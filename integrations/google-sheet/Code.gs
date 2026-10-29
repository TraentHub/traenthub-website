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
        firstName: cell_(data.firstName),
        lastName: cell_(data.lastName),
        email: cell_(data.email),
        altContact: cell_(data.altContact),
        linkedin: cell_(data.linkedin),
        occupation: cell_(data.occupation),
        ai: cell_(data.ai),
        projects: cell_(data.projects),
        lang: data.lang === "en" ? "en" : "it",
      };

      getSheet_().appendRow([
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

function sendConfirmation_(s) {
  try {
    const en = s.lang === "en";
    const subject = en
      ? "We received your application to Traent Hub"
      : "Abbiamo ricevuto la tua candidatura a Traent Hub";
    const body = en
      ? [
          "Hi " + s.firstName + ",",
          "",
          "thanks for applying to Traent Hub! We've received your form and we'll read it carefully.",
          "If we need anything else, or we'd like to get to know you better, we'll write to you at this address.",
          "",
          "Want to add something or have a question? Just reply to this email.",
          "",
          "See you soon,",
          "The Traent Hub team",
          "Via Borgo Stretto 3, Pisa",
        ].join("\n")
      : [
          "Ciao " + s.firstName + ",",
          "",
          "grazie per esserti candidato a Traent Hub! Abbiamo ricevuto il tuo form e lo leggeremo con attenzione.",
          "Se ci serve altro, o vogliamo conoscerti meglio, ti scriveremo a questo indirizzo.",
          "",
          "Vuoi aggiungere qualcosa o hai una domanda? Rispondi pure a questa email.",
          "",
          "A presto,",
          "Il team di Traent Hub",
          "Via Borgo Stretto 3, Pisa",
        ].join("\n");

    MailApp.sendEmail({
      to: s.email,
      subject: subject,
      body: body,
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

    const body = [
      "Nuova candidatura dal sito di Traent Hub.",
      "",
      "Nome: " + s.firstName + " " + s.lastName,
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
      "Tutte le candidature: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      "(Rispondendo a questa email scrivi direttamente al candidato.)",
    ].join("\n");

    MailApp.sendEmail({
      to: recipients.join(","),
      subject: "Nuova candidatura: " + s.firstName + " " + s.lastName,
      body: body,
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

// Trim, and neutralise spreadsheet formulas (=, +, -, @) so that user input is never evaluated.
function cell_(value) {
  const text = value == null ? "" : String(value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

// ----------------------------------------------------------------- sheet ---

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet
      .getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#0d0d0d")
      .setFontColor("#f5f2ed");
    sheet.getRange("A:A").setNumberFormat("dd/mm/yyyy hh:mm");
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
