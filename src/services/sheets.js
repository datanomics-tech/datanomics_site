// Google Sheet (in your shared Drive) via a small Apps Script web app. See google-apps-script/.
import { config } from "../config.js";
import { q } from "../db.js";

export const sheetsEnabled = () => !!(config.sheets.webhook && config.sheets.secret);

async function call(action, payload = {}) {
  if (!sheetsEnabled()) throw new Error("Google Sheet is not configured (SHEETS_WEBHOOK_URL / SHEETS_SECRET).");
  const r = await fetch(config.sheets.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: config.sheets.secret, action, ...payload }),
    redirect: "follow",
    signal: AbortSignal.timeout(20000)
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Unexpected response from Apps Script (HTTP ${r.status}). Check the deployment URL and access settings.`); }
  if (!data.ok) throw new Error(data.error || "Apps Script returned an error");
  return data;
}

export const SHEET_COLUMNS = ["ID", "Received", "Name", "Company", "Email", "Phone", "Service", "Message", "Page"];

export async function appendContact(c) {
  if (!sheetsEnabled()) return;
  try {
    await call("append", {
      row: [c.id, new Date(c.created_at || Date.now()).toISOString().replace("T", " ").slice(0, 19), c.name, c.company || "", c.email, c.phone || "", c.service || "", c.message, c.source_page || ""]
    });
    await q("UPDATE contacts SET sheet_synced = 1, sheet_error = NULL WHERE id = ?", [c.id]);
  } catch (e) {
    await q("UPDATE contacts SET sheet_synced = 0, sheet_error = ? WHERE id = ?", [String(e.message).slice(0, 250), c.id]);
  }
}

export async function readSheetRows() {
  const data = await call("list");
  return { headers: data.headers || SHEET_COLUMNS, rows: data.rows || [] };
}
