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
    '<tr><td style="padding:0 0 22px 2px;font-family:' + FONT_SANS + ';font-size:24px;font-weight:600;letter-spacing:-0.02em;color:' + BRAND.ink + ';">traent<span style="color:' + BRAND.pop + ';">.</span>hub</td></tr>' +
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
