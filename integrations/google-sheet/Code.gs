/**
 * Traent Hub — application form → Google Sheet (+ emails)
 *
 * Google Apps Script web app that receives the website's application form
 * (a JSON body sent as text/plain) and, for every submission:
 *   1. appends one row to the "Candidature" tab of the spreadsheet this script is bound to;
 *   2. sends a confirmation email to the applicant;
 *   3. sends a "new application" notification to the team.
 *
 * Setup instructions: see README.md in this folder.
 */

const SPREADSHEET_NAME = "Traent Hub – Candidature dal sito";
const SHEET_NAME = "Candidature";

// Public address applicants can reply to. The emails are *sent* from the Google
// account that deployed this script; replies are routed here.
const REPLY_TO = "contact@traenthub.com";
const SENDER_NAME = "Traent Hub";

// Team addresses are NOT stored in the code (the repository is public).
// Set them in Apps Script → Project Settings → Script properties:
//   NOTIFY_TO = name1@example.com, name2@example.com, name3@example.com
const NOTIFY_PROPERTY = "NOTIFY_TO";

const DATE_FORMAT = "dd/mm/yyyy hh:mm";

const HEADERS = [
  "Data invio",
  "Nome",
  "Cognome",
  "Email",
  "Altro contatto",
  "LinkedIn",
  "Di cosa ti occupi?",
  "Come usi l'AI?",
  "Progetti",
  "Lingua",
  "Consenso privacy",
];

// Hard limits, in case someone calls the endpoint without going through the form.
const MAX_SHORT = 300;
const MAX_LONG = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LINKEDIN_RE = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[^\s/?#]+/i;

/**
 * Run this ONCE from the Apps Script editor (select "setup" → Run).
 * It names the spreadsheet, creates the tab with a formatted header row, and
 * asks for the permissions the script needs (sheet access + sending email).
 */
function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.rename(SPREADSHEET_NAME);
  getSheet_();
  MailApp.getRemainingDailyQuota(); // triggers the "send email" authorization prompt
  const recipients = getNotifyRecipients_();
  console.log(
    recipients.length
      ? "Team notifications go to: " + recipients.join(", ")
      : 'No team recipients yet: add the "' + NOTIFY_PROPERTY + '" script property.'
  );
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let submission = null;

  try {
    lock.waitLock(10000);
    try {
      const data = JSON.parse(e.postData.contents);
      const error = validate_(data);
      if (error) return json_({ ok: false, error: error });

      submission = {
        firstName: clean_(data.firstName),
        lastName: clean_(data.lastName),
        email: clean_(data.email),
        altContact: clean_(data.altContact),
        linkedin: clean_(data.linkedin),
        occupation: clean_(data.occupation),
        ai: clean_(data.ai),
        projects: clean_(data.projects),
        lang: data.lang === "en" ? "en" : "it",
      };

      appendApplication_(getSheet_(), [
        new Date(),
        submission.firstName,
        submission.lastName,
        submission.email,
        submission.altContact,
        submission.linkedin,
        submission.occupation,
        submission.ai,
        submission.projects,
        submission.lang,
        "sì",
      ]);
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server_error" });
  }

  // The row is saved. Emails are best effort: a failure here must never make
  // the applicant think their application was lost.
  sendConfirmation_(submission);
  sendTeamNotification_(submission);

  return json_({ ok: true });
}

// Handy to check that the deployment is live: open the /exec URL in a browser.
function doGet() {
  return json_({ ok: true, service: "traenthub-applications" });
}

// ---------------------------------------------------------------- emails ---

// Same palette as the website (see src/index.css).
const BRAND = {
  ink: "#0d0d0d",
  paper: "#f5f2ed",
  line: "#d9d4cb",
  muted: "#6b655a",
  soft: "#8a8478",
  pop: "#ff3d00",
};
const FONT_SANS = "'Outfit',Helvetica,Arial,sans-serif";
const FONT_SERIF = "'Playfair Display',Georgia,'Times New Roman',serif";

function sendConfirmation_(s) {
  try {
    const en = s.lang === "en";
    const copy = en
      ? {
          subject: "We received your application to Traent Hub",
          preheader: "Thanks for applying: we'll read your application carefully.",
          label: "Application received",
          title: "Thank you, " + s.firstName,
          paragraphs: [
            "We've received your application to Traent Hub and we'll read it carefully.",
            "If we need anything else, or we'd like to get to know you better, we'll write to you at this address.",
            "Want to add something or have a question? Just reply to this email.",
          ],
          signoff: "See you soon,",
          team: "The Traent Hub team",
          footer: "You are receiving this email because you sent an application from our website.",
        }
      : {
          subject: "Abbiamo ricevuto la tua candidatura a Traent Hub",
          preheader: "Grazie per averci scritto: leggeremo la tua candidatura con attenzione.",
          label: "Candidatura ricevuta",
          title: "Grazie, " + s.firstName,
          paragraphs: [
            "Abbiamo ricevuto la tua candidatura a Traent Hub e la leggeremo con attenzione.",
            "Se ci serve altro, o vogliamo conoscerti meglio, ti scriveremo a questo indirizzo.",
            "Vuoi aggiungere qualcosa o hai una domanda? Rispondi pure a questa email.",
          ],
          signoff: "A presto,",
          team: "Il team di Traent Hub",
          footer: "Ricevi questa email perché hai inviato una candidatura dal nostro sito.",
        };

    const html = layout_(
      copy.preheader,
      label_(copy.label) +
        '<h1 style="margin:0 0 24px 0;font-family:' + FONT_SERIF + ';font-size:32px;line-height:1.15;font-weight:700;color:' + BRAND.ink + ';">' +
        esc_(copy.title) + '<span style="color:' + BRAND.pop + ';">.</span></h1>' +
        copy.paragraphs.map(paragraph_).join("") +
        '<p style="margin:28px 0 0 0;font-family:' + FONT_SANS + ';font-size:16px;line-height:1.6;color:' + BRAND.ink + ';">' +
        esc_(copy.signoff) + '<br><strong>' + esc_(copy.team) + "</strong></p>",
      copy.footer
    );

    const text = [
      copy.title + ".",
      "",
      copy.paragraphs.join("\n\n"),
      "",
      copy.signoff,
      copy.team,
      "Via Borgo Stretto 3, Pisa",
    ].join("\n");

    MailApp.sendEmail({
      to: s.email,
      subject: copy.subject,
      body: text,
      htmlBody: html,
      inlineImages: { logo: logoBlob_() },
      name: SENDER_NAME,
      replyTo: REPLY_TO,
    });
  } catch (err) {
    console.error("Confirmation email failed", err);
  }
}

function sendTeamNotification_(s) {
  try {
    const recipients = getNotifyRecipients_();
    if (!recipients.length) {
      console.warn('Script property "' + NOTIFY_PROPERTY + '" is empty: team notification skipped.');
      return;
    }

    const fullName = s.firstName + " " + s.lastName;
    const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

    const fields = [
      ["Email", '<a href="mailto:' + esc_(s.email) + '" style="color:' + BRAND.ink + ';">' + esc_(s.email) + "</a>"],
      ["Altro contatto", s.altContact ? esc_(s.altContact) : "—"],
      ["LinkedIn", linkedinLink_(s.linkedin)],
    ];
    const answers = [
      ["Di cosa si occupa", s.occupation],
      ["Come usa l'AI", s.ai],
      ["Progetti", s.projects],
    ];

    const html = layout_(
      "Nuova candidatura da " + fullName,
      label_("Nuova candidatura") +
        '<h1 style="margin:0 0 24px 0;font-family:' + FONT_SERIF + ';font-size:30px;line-height:1.15;font-weight:700;color:' + BRAND.ink + ';">' +
        esc_(fullName) + '<span style="color:' + BRAND.pop + ';">.</span></h1>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;">' +
        fields.map(function (f) {
          return '<tr><td style="padding:10px 0;border-top:1px solid ' + BRAND.line + ';width:130px;vertical-align:top;font-family:' + FONT_SANS + ';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:' + BRAND.soft + ';">' +
            esc_(f[0]) + '</td><td style="padding:10px 0;border-top:1px solid ' + BRAND.line + ';vertical-align:top;font-family:' + FONT_SANS + ';font-size:15px;line-height:1.5;color:' + BRAND.ink + ';">' + f[1] + "</td></tr>";
        }).join("") +
        "</table>" +
        answers.map(function (a) {
          return '<p style="margin:22px 0 6px 0;font-family:' + FONT_SANS + ';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:' + BRAND.soft + ';">' + esc_(a[0]) + "</p>" +
            '<p style="margin:0;font-family:' + FONT_SANS + ';font-size:15px;line-height:1.6;color:' + BRAND.ink + ';">' + multiline_(a[1]) + "</p>";
        }).join("") +
        '<p style="margin:32px 0 0 0;"><a href="' + esc_(sheetUrl) + '" style="display:inline-block;background:' + BRAND.ink + ';color:' + BRAND.paper + ';font-family:' + FONT_SANS + ';font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:14px 26px;border-radius:999px;">Apri il foglio</a></p>',
      "Rispondendo a questa email scrivi direttamente a " + fullName + "."
    );

    const text = [
      "Nuova candidatura dal sito di Traent Hub.",
      "",
      "Nome: " + fullName,
      "Email: " + s.email,
      "Altro contatto: " + (s.altContact || "—"),
      "LinkedIn: " + s.linkedin,
      "",
      "Di cosa si occupa:",
      s.occupation,
      "",
      "Come usa l'AI:",
      s.ai,
      "",
      "Progetti:",
      s.projects,
      "",
      "Tutte le candidature: " + sheetUrl,
      "(Rispondendo a questa email scrivi direttamente al candidato.)",
    ].join("\n");

    MailApp.sendEmail({
      to: recipients.join(","),
      subject: "Nuova candidatura: " + fullName,
      body: text,
      htmlBody: html,
      inlineImages: { logo: logoBlob_() },
      name: SENDER_NAME,
      replyTo: s.email,
    });
  } catch (err) {
    console.error("Team notification failed", err);
  }
}

function getNotifyRecipients_() {
  const raw = PropertiesService.getScriptProperties().getProperty(NOTIFY_PROPERTY) || "";
  return raw
    .split(/[,;\s]+/)
    .map(function (address) {
      return address.trim();
    })
    .filter(function (address) {
      return EMAIL_RE.test(address);
    });
}

// --- email building blocks (inline CSS only: that's what email clients support) ---

function layout_(preheader, innerHtml, footerText) {
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:' + BRAND.paper + ';">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + esc_(preheader) + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + BRAND.paper + ';"><tr><td align="center" style="padding:32px 16px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">' +
    '<tr><td style="padding:0 0 22px 2px;"><img src="cid:logo" width="162" height="53" alt="traent.hub" style="display:block;border:0;outline:none;width:162px;height:53px;font-family:' + FONT_SANS + ';font-size:22px;font-weight:600;color:' + BRAND.ink + ';"></td></tr>' +
    '<tr><td style="background:#ffffff;border:1px solid ' + BRAND.line + ';border-radius:12px;padding:36px 32px;">' + innerHtml + "</td></tr>" +
    '<tr><td style="padding:20px 4px 0 4px;font-family:' + FONT_SANS + ';font-size:12px;line-height:1.7;color:' + BRAND.soft + ';">' +
    esc_(footerText) + "<br>Traent Hub · Via Borgo Stretto 3, Pisa · " +
    '<a href="mailto:' + REPLY_TO + '" style="color:' + BRAND.soft + ';">' + REPLY_TO + "</a></td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

function label_(text) {
  return (
    '<p style="margin:0 0 14px 0;font-family:' + FONT_SANS + ';font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:' + BRAND.muted + ';">' +
    '<span style="color:' + BRAND.pop + ';">&#9679;</span>&nbsp; ' + esc_(text) + "</p>"
  );
}

function paragraph_(text) {
  return (
    '<p style="margin:0 0 16px 0;font-family:' + FONT_SANS + ';font-size:16px;line-height:1.65;font-weight:300;color:' + BRAND.muted + ';">' +
    esc_(text) + "</p>"
  );
}

function linkedinLink_(url) {
  // Only http(s) links are made clickable; anything else is shown as plain text.
  return /^https?:\/\//i.test(url)
    ? '<a href="' + esc_(url) + '" style="color:' + BRAND.ink + ';">' + esc_(url) + "</a>"
    : esc_(url);
}

function esc_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function multiline_(value) {
  return esc_(value).replace(/\r?\n/g, "<br>");
}

// ------------------------------------------------------------ validation ---

function validate_(data) {
  if (!data || typeof data !== "object") return "invalid_payload";
  if (data.consent !== true) return "missing_consent";

  const required = ["firstName", "lastName", "email", "linkedin", "occupation", "ai", "projects"];
  for (const key of required) {
    if (typeof data[key] !== "string" || !data[key].trim()) return "missing_" + key;
  }

  if (!EMAIL_RE.test(data.email.trim())) return "invalid_email";
  if (!LINKEDIN_RE.test(data.linkedin.trim())) return "invalid_linkedin";

  for (const key of ["firstName", "lastName", "email", "altContact", "linkedin"]) {
    if (data[key] && String(data[key]).length > MAX_SHORT) return "too_long_" + key;
  }
  for (const key of ["occupation", "ai", "projects"]) {
    if (String(data[key]).length > MAX_LONG) return "too_long_" + key;
  }
  return null;
}

function clean_(value) {
  return value == null ? "" : String(value).trim();
}

// ----------------------------------------------------------------- sheet ---

// Writes one row. Every cell except the date is first formatted as plain text, so a value such as
// "=IMPORTXML(...)" or "@username" is stored exactly as typed and never evaluated as a formula.
function appendApplication_(sheet, values) {
  const row = sheet.getLastRow() + 1;
  const range = sheet.getRange(row, 1, 1, values.length);
  const formats = values.map(function (_, i) {
    return i === 0 ? DATE_FORMAT : "@";
  });
  range.setNumberFormats([formats]);
  range.setValues([values]);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // A brand-new spreadsheet has one empty tab ("Foglio1"/"Sheet1"): reuse it.
    const existing = spreadsheet.getSheets();
    if (existing.length === 1 && existing[0].getLastRow() === 0) {
      sheet = existing[0];
      sheet.setName(SHEET_NAME);
    } else {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#0d0d0d")
      .setFontColor("#f5f2ed");
    sheet.getRange("A:A").setNumberFormat(DATE_FORMAT);
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidths(2, 5, 170);
    sheet.setColumnWidths(7, 3, 320);
    sheet.getRange(2, 7, 1000, 3).setWrap(true).setVerticalAlignment("top");
  }
  return sheet;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ------------------------------------------------------------------ logo ---

// Traent Hub logo (transparent PNG, 324x106, shown at 162x53 for sharp screens), embedded so the
// emails don't depend on any hosted image. Source file: email-logo.png in this folder.
function logoBlob_() {
  return Utilities.newBlob(Utilities.base64Decode(LOGO_PNG_BASE64), "image/png", "logo.png");
}

const LOGO_PNG_BASE64 =
  "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";
