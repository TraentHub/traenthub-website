/**
 * Traent Hub — application form → Google Sheet
 *
 * Google Apps Script web app that receives the website's application form
 * (a JSON body sent as text/plain) and appends one row per submission to the
 * "Applications" tab of the spreadsheet this script is bound to.
 *
 * Setup instructions: see README.md in this folder.
 */

const SHEET_NAME = "Applications";

const HEADERS = [
  "Submitted at",
  "First name",
  "Last name",
  "Email",
  "Other contact",
  "LinkedIn",
  "What do you do?",
  "How do you use AI?",
  "Projects",
  "Language",
  "Privacy consent",
];

// Hard limits, in case someone calls the endpoint without going through the form.
const MAX_SHORT = 300;
const MAX_LONG = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LINKEDIN_RE = /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[^\s/?#]+/i;

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    lock.waitLock(10000);
    locked = true;

    const data = JSON.parse(e.postData.contents);
    const error = validate_(data);
    if (error) return json_({ ok: false, error: error });

    getSheet_().appendRow([
      new Date(),
      cell_(data.firstName),
      cell_(data.lastName),
      cell_(data.email),
      cell_(data.altContact),
      cell_(data.linkedin),
      cell_(data.occupation),
      cell_(data.ai),
      cell_(data.projects),
      data.lang === "en" ? "en" : "it",
      "yes",
    ]);

    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server_error" });
  } finally {
    if (locked) lock.releaseLock();
  }
}

// Handy to check that the deployment is live: open the /exec URL in a browser.
function doGet() {
  return json_({ ok: true, service: "traenthub-applications" });
}

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

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
