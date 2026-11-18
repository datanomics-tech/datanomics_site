/**
 * Datanomics website enquiries → Google Sheet (in your shared Drive).
 * Paste this into Extensions → Apps Script of the spreadsheet, set SECRET, then Deploy → New deployment → Web app.
 * The website server sends each enquiry here and the admin panel reads the rows back.
 */
const SECRET = "PASTE-THE-SAME-LONG-RANDOM-SECRET-AS-SHEETS_SECRET-IN-.env";
const SHEET_NAME = "Enquiries";
const HEADERS = ["ID", "Received", "Name", "Company", "Email", "Phone", "Service", "Message", "Page"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#071A2F").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
  }
  return sh;
}
const json_ = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!SECRET || body.secret !== SECRET) return json_({ ok: false, error: "Unauthorized" });
    const sh = sheet_();
    if (body.action === "append") {
      const row = (body.row || []).slice(0, HEADERS.length).map(v => {
        const s = String(v == null ? "" : v);
        return /^[=+\-@]/.test(s) ? "'" + s : s; // stop spreadsheet formula injection
      });
      const lock = LockService.getScriptLock(); lock.waitLock(10000);
      try {
        const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().flat().map(String) : [];
        if (!ids.includes(String(row[0]))) sh.appendRow(row); // ignore duplicates when the server retries
      } finally { lock.releaseLock(); }
      return json_({ ok: true });
    }
    if (body.action === "list") {
      const values = sh.getDataRange().getDisplayValues();
      return json_({ ok: true, headers: values[0] || HEADERS, rows: values.slice(1) });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() { return json_({ ok: true, service: "Datanomics enquiries" }); }
