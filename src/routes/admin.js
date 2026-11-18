import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
import ExcelJS from "exceljs";
import { randomBytes } from "node:crypto";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { q, one, list } from "../db.js";
import { config } from "../config.js";
import { invalidate } from "../repo.js";
import { ENTITIES, SETTINGS_FIELDS } from "../admin-schema.js";
import { fetchFeeds } from "../services/feeds.js";
import { appendContact, readSheetRows, sheetsEnabled, SHEET_COLUMNS } from "../services/sheets.js";

export const adminApi = Router();
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const fail = (res, status, error, extra = {}) => res.status(status).json({ ok: false, error, ...extra });

/* ---------------- authentication ---------------- */
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, skipSuccessfulRequests: true,
  message: { ok: false, error: "Too many sign-in attempts. Try again in 15 minutes." } });
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12); // equalises response time for unknown emails

adminApi.post("/login", loginLimiter, wrap(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase(), pw = String(req.body?.password || "");
  const a = await one("SELECT * FROM admins WHERE email = ?", [email]);
  const ok = await bcrypt.compare(pw, a?.password_hash || DUMMY_HASH);
  if (!a || !ok) return fail(res, 401, "Email or password is incorrect.");
  req.session.regenerate(err => {
    if (err) return fail(res, 500, "Could not start a session.");
    req.session.adminId = a.id;
    req.session.csrf = randomBytes(24).toString("hex");
    q("UPDATE admins SET last_login = NOW() WHERE id = ?", [a.id]).catch(() => {});
    req.session.save(() => res.json({ ok: true }));
  });
}));

export function requireAdmin(req, res, next) {
  if (req.session?.adminId) return next();
  if (req.originalUrl.startsWith("/api/")) return fail(res, 401, "Your session has ended. Please sign in again.");
  res.redirect("/admin/login");
}
adminApi.use(requireAdmin);
adminApi.use((req, res, next) => { // CSRF protection for every state-changing request
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("X-CSRF-Token") && req.get("X-CSRF-Token") === req.session.csrf) return next();
  fail(res, 403, "Security check failed. Reload the page and try again.");
});

adminApi.post("/logout", (req, res) => req.session.destroy(() => res.clearCookie("dn.sid").json({ ok: true })));

adminApi.get("/me", wrap(async (req, res) => {
  const a = await one("SELECT id, name, email, last_login FROM admins WHERE id = ?", [req.session.adminId]);
  if (!a) return req.session.destroy(() => fail(res, 401, "Account not found."));
  res.json({ ok: true, admin: a, csrf: req.session.csrf, sheets: { enabled: sheetsEnabled(), viewUrl: config.sheets.viewUrl } });
}));

adminApi.put("/account/password", wrap(async (req, res) => {
  const { current = "", next = "" } = req.body || {};
  const a = await one("SELECT * FROM admins WHERE id = ?", [req.session.adminId]);
  if (!(await bcrypt.compare(String(current), a.password_hash))) return fail(res, 400, "Your current password is incorrect.");
  if (String(next).length < 10) return fail(res, 400, "The new password must be at least 10 characters.");
  await q("UPDATE admins SET password_hash = ? WHERE id = ?", [await bcrypt.hash(String(next), 12), a.id]);
  res.json({ ok: true });
}));

adminApi.get("/admins", wrap(async (req, res) => res.json({ ok: true, rows: await q("SELECT id, name, email, last_login, created_at FROM admins ORDER BY id") })));
adminApi.post("/admins", wrap(async (req, res) => {
  const name = String(req.body?.name || "").trim(), email = String(req.body?.email || "").trim().toLowerCase(), pw = String(req.body?.password || "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(res, 400, "Enter a name and a valid email.");
  if (pw.length < 10) return fail(res, 400, "The password must be at least 10 characters.");
  try { await q("INSERT INTO admins (name, email, password_hash) VALUES (?,?,?)", [name, email, await bcrypt.hash(pw, 12)]); }
  catch (e) { if (e.code === "ER_DUP_ENTRY") return fail(res, 409, "An admin with this email already exists."); throw e; }
  res.json({ ok: true });
}));
adminApi.delete("/admins/:id", wrap(async (req, res) => {
  if (+req.params.id === req.session.adminId) return fail(res, 400, "You can't remove your own account.");
  await q("DELETE FROM admins WHERE id = ?", [+req.params.id]);
  res.json({ ok: true });
}));

/* ---------------- dashboard ---------------- */
adminApi.get("/dashboard", wrap(async (req, res) => {
  const n = async sql => (await one(sql)).n;
  const [counts, recentContacts, pending, feedErrors] = await Promise.all([
    (async () => ({
      verticals: await n("SELECT COUNT(*) n FROM verticals WHERE published = 1"),
      projects: await n("SELECT COUNT(*) n FROM projects WHERE published = 1"),
      team: await n("SELECT COUNT(*) n FROM team WHERE published = 1"),
      testimonials: await n("SELECT COUNT(*) n FROM testimonials WHERE published = 1"),
      insightsPublished: await n("SELECT COUNT(*) n FROM insights WHERE status = 'published'"),
      insightsPending: await n("SELECT COUNT(*) n FROM insights WHERE status = 'pending'"),
      contactsNew: await n("SELECT COUNT(*) n FROM contacts WHERE status = 'new'"),
      contactsTotal: await n("SELECT COUNT(*) n FROM contacts"),
      contacts30: await n("SELECT COUNT(*) n FROM contacts WHERE created_at >= NOW() - INTERVAL 30 DAY"),
      subscribers: await n("SELECT COUNT(*) n FROM subscribers"),
      unsynced: await n("SELECT COUNT(*) n FROM contacts WHERE sheet_synced = 0")
    }))(),
    q("SELECT id, name, company, service, status, created_at FROM contacts ORDER BY created_at DESC LIMIT 6"),
    q("SELECT i.id, i.title, i.source, i.published_at, c.name category FROM insights i LEFT JOIN insight_categories c ON c.id = i.category_id WHERE i.status = 'pending' ORDER BY i.published_at DESC LIMIT 6"),
    q("SELECT id, name, last_status FROM feeds WHERE active = 1 AND last_status LIKE 'Error%'")
  ]);
  const perDay = await q("SELECT DATE(created_at) d, COUNT(*) n FROM contacts WHERE created_at >= CURDATE() - INTERVAL 13 DAY GROUP BY DATE(created_at)");
  res.json({ ok: true, counts, recentContacts, pending, feedErrors, perDay, sheets: sheetsEnabled() });
}));

/* ---------------- generic content CRUD ---------------- */
adminApi.get("/schema", wrap(async (req, res) => {
  const cats = await q("SELECT id value, name label FROM insight_categories ORDER BY sort_order, id");
  const projectCats = (await q("SELECT DISTINCT category FROM projects ORDER BY category")).map(r => r.category);
  const resolve = f => f.optionsFrom === "insight_categories" ? { ...f, options: cats } : f;
  const entities = Object.fromEntries(Object.entries(ENTITIES).map(([k, e]) => [k, { ...e, table: undefined, fields: e.fields.map(resolve) }]));
  res.json({ ok: true, entities, settingsFields: SETTINGS_FIELDS, suggestions: { "projects.category": projectCats } });
}));

const toDb = (f, v) => {
  if (f.type === "list") return JSON.stringify((Array.isArray(v) ? v : String(v || "").split("\n")).map(s => String(s).trim()).filter(Boolean).slice(0, 50));
  if (f.type === "bool") return v === true || v === 1 || v === "1" || v === "true" || v === "on" ? 1 : 0;
  if (f.type === "number" || f.type === "select" && f.optionsFrom) return v === "" || v == null ? null : Number(v);
  if (f.type === "datetime") return v ? new Date(v) : null;
  const s = v == null ? "" : String(v).trim();
  return s === "" ? null : s;
};

function validate(entity, body, isCreate) {
  const errors = {}, values = {};
  for (const f of entity.fields) {
    if (f.type === "readonly") continue;
    if (!isCreate && !(f.name in body)) continue;
    let v = body[f.name];
    if (v === undefined && isCreate) v = f.default ?? (f.type === "bool" ? 0 : null);
    const val = toDb(f, v);
    const empty = val === null || val === "" || val === "[]";
    if (f.required && empty) { errors[f.name] = `${f.label} is required.`; continue; }
    if (!empty) {
      if (typeof val === "string" && f.max && val.length > f.max) errors[f.name] = `Keep this under ${f.max} characters.`;
      if (f.pattern && typeof val === "string" && !new RegExp(f.pattern).test(val)) errors[f.name] = f.help || "Invalid format.";
      if ((f.type === "url" || f.type === "image") && !/^(https?:\/\/|\/uploads\/)/i.test(val)) errors[f.name] = "Use a full web address starting with https://.";
      if (f.type === "color" && !/^#[0-9a-f]{6}$/i.test(val)) errors[f.name] = "Use a colour like #0D6EFD.";
      if (f.type === "number" && (Number.isNaN(val) || (f.min != null && val < f.min) || (f.max != null && val > f.max))) errors[f.name] = `Enter a number${f.min != null ? ` from ${f.min}` : ""}${f.max != null ? ` to ${f.max}` : ""}.`;
      if (f.type === "select" && f.options && !f.optionsFrom && !f.options.some(o => o.value === val)) errors[f.name] = "Choose one of the options.";
      if (f.type === "datetime" && Number.isNaN(val.getTime?.())) errors[f.name] = "Enter a valid date.";
    }
    values[f.name] = val;
  }
  return { errors, values };
}

const shape = (entity, row) => {
  if (!row) return row;
  for (const f of entity.fields) if (f.type === "list") row[f.name] = list(row[f.name]);
  return row;
};
const getEntity = (req, res) => { const e = ENTITIES[req.params.entity]; if (!e) fail(res, 404, "Unknown section."); return e; };

adminApi.get("/content/:entity", wrap(async (req, res) => {
  const e = getEntity(req, res); if (!e) return;
  const where = [], params = [];
  for (const f of e.filters || []) if (req.query[f]) { where.push(`${f} = ?`); params.push(req.query[f]); }
  if (e.search && req.query.q) { where.push(`(${e.search.map(c => `${c} LIKE ?`).join(" OR ")})`); e.search.forEach(() => params.push(`%${req.query.q}%`)); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const size = e.pageSize || 500, page = Math.max(1, +req.query.page || 1);
  const total = (await one(`SELECT COUNT(*) n FROM ${e.table} ${w}`, params)).n;
  const rows = await q(`SELECT * FROM ${e.table} ${w} ORDER BY ${e.order} LIMIT ? OFFSET ?`, [...params, size, (page - 1) * size]);
  res.json({ ok: true, rows: rows.map(r => shape(e, r)), total, page, pages: Math.max(1, Math.ceil(total / size)) });
}));

adminApi.get("/content/:entity/:id", wrap(async (req, res) => {
  const e = getEntity(req, res); if (!e) return;
  const row = await one(`SELECT * FROM ${e.table} WHERE id = ?`, [+req.params.id]);
  row ? res.json({ ok: true, row: shape(e, row) }) : fail(res, 404, "Not found.");
}));

async function save(req, res, isCreate) {
  const e = getEntity(req, res); if (!e) return;
  const { errors, values } = validate(e, req.body || {}, isCreate);
  if (Object.keys(errors).length) return fail(res, 422, "Please correct the highlighted fields.", { errors });
  const cols = Object.keys(values);
  try {
    if (isCreate) {
      const r = await q(`INSERT INTO ${e.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map(c => values[c]));
      req.params.id = r.insertId;
    } else if (cols.length) {
      const r = await q(`UPDATE ${e.table} SET ${cols.map(c => `${c} = ?`).join(", ")} WHERE id = ?`, [...cols.map(c => values[c]), +req.params.id]);
      if (!r.affectedRows) return fail(res, 404, "Not found.");
    }
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return fail(res, 409, "This item already exists (a name, address or link must be unique).");
    if (err.code === "ER_ROW_IS_REFERENCED_2") return fail(res, 409, "This item is still in use.");
    throw err;
  }
  if (e.table === "insights" && values.featured === 1) await q("UPDATE insights SET featured = 0 WHERE id <> ?", [+req.params.id]);
  if (e.table === "insights" && values.status === "published") await q("UPDATE insights SET published_at = COALESCE(published_at, NOW()) WHERE id = ?", [+req.params.id]);
  invalidate();
  res.json({ ok: true, row: shape(e, await one(`SELECT * FROM ${e.table} WHERE id = ?`, [+req.params.id])) });
}
adminApi.post("/content/:entity", wrap((req, res) => save(req, res, true)));
adminApi.put("/content/:entity/:id", wrap((req, res) => save(req, res, false)));
adminApi.delete("/content/:entity/:id", wrap(async (req, res) => {
  const e = getEntity(req, res); if (!e) return;
  try { await q(`DELETE FROM ${e.table} WHERE id = ?`, [+req.params.id]); }
  catch (err) { if (err.code === "ER_ROW_IS_REFERENCED_2") return fail(res, 409, "This item is still in use."); throw err; }
  invalidate();
  res.json({ ok: true });
}));

/* ---------------- insights: approval & fetching ---------------- */
adminApi.post("/insights/bulk", wrap(async (req, res) => {
  const ids = (req.body?.ids || []).map(Number).filter(Boolean).slice(0, 500);
  const action = req.body?.action;
  if (!ids.length) return fail(res, 400, "Select at least one article.");
  if (action === "publish") await q("UPDATE insights SET status = 'published', published_at = COALESCE(published_at, NOW()) WHERE id IN (?)", [ids]);
  else if (action === "hide") await q("UPDATE insights SET status = 'hidden', featured = 0 WHERE id IN (?)", [ids]);
  else if (action === "pending") await q("UPDATE insights SET status = 'pending' WHERE id IN (?)", [ids]);
  else if (action === "delete") await q("DELETE FROM insights WHERE id IN (?)", [ids]);
  else return fail(res, 400, "Unknown action.");
  invalidate();
  res.json({ ok: true, count: ids.length });
}));
adminApi.post("/feeds/fetch", wrap(async (req, res) => res.json(await fetchFeeds({ feedId: +req.body?.feedId || undefined }))));

/* ---------------- contacts ---------------- */
adminApi.get("/contacts", wrap(async (req, res) => {
  const where = [], params = [];
  if (req.query.status) { where.push("status = ?"); params.push(req.query.status); }
  if (req.query.q) { where.push("(name LIKE ? OR email LIKE ? OR company LIKE ? OR message LIKE ?)"); params.push(...Array(4).fill(`%${req.query.q}%`)); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const size = 25, page = Math.max(1, +req.query.page || 1);
  const total = (await one(`SELECT COUNT(*) n FROM contacts ${w}`, params)).n;
  const rows = await q(`SELECT * FROM contacts ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, size, (page - 1) * size]);
  res.json({ ok: true, rows, total, page, pages: Math.max(1, Math.ceil(total / size)) });
}));
adminApi.put("/contacts/:id", wrap(async (req, res) => {
  const status = req.body?.status, notes = req.body?.notes;
  if (status && !["new", "read", "replied", "archived"].includes(status)) return fail(res, 400, "Unknown status.");
  await q("UPDATE contacts SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?", [status || null, notes == null ? null : String(notes).slice(0, 5000), +req.params.id]);
  res.json({ ok: true, row: await one("SELECT * FROM contacts WHERE id = ?", [+req.params.id]) });
}));
adminApi.delete("/contacts/:id", wrap(async (req, res) => { await q("DELETE FROM contacts WHERE id = ?", [+req.params.id]); res.json({ ok: true }); }));
adminApi.post("/contacts/sync", wrap(async (req, res) => {
  if (!sheetsEnabled()) return fail(res, 400, "The Google Sheet is not connected yet. See the setup guide.");
  const rows = await q("SELECT * FROM contacts WHERE sheet_synced = 0 ORDER BY id LIMIT 200");
  for (const c of rows) await appendContact(c);
  const left = (await one("SELECT COUNT(*) n FROM contacts WHERE sheet_synced = 0")).n;
  res.json({ ok: true, synced: rows.length - left, remaining: left });
}));
adminApi.get("/contacts/sheet", wrap(async (req, res) => {
  if (!sheetsEnabled()) return fail(res, 400, "The Google Sheet is not connected yet. See the setup guide.");
  try { res.json({ ok: true, ...(await readSheetRows()), viewUrl: config.sheets.viewUrl }); }
  catch (e) { fail(res, 502, `Couldn't read the Google Sheet: ${e.message}`); }
}));

async function sendXlsx(res, name, columns, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Datanomics admin";
  const ws = wb.addWorksheet(name);
  ws.columns = columns.map(([key, header, width]) => ({ key, header, width }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF071A2F" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  rows.forEach(r => ws.addRow(r));
  ws.autoFilter = { from: "A1", to: { row: 1, column: columns.length } };
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${name.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}
adminApi.get("/contacts/export.xlsx", wrap(async (req, res) => {
  const rows = await q("SELECT * FROM contacts ORDER BY created_at DESC");
  await sendXlsx(res, "Contacts", [["id", "ID", 8], ["created_at", "Received", 20], ["name", "Name", 24], ["company", "Company", 24], ["email", "Email", 30], ["phone", "Phone", 18], ["service", "Service", 28], ["message", "Message", 60], ["status", "Status", 12], ["notes", "Notes", 40]], rows);
}));

/* ---------------- subscribers ---------------- */
adminApi.get("/subscribers", wrap(async (req, res) => res.json({ ok: true, rows: await q("SELECT * FROM subscribers ORDER BY created_at DESC") })));
adminApi.delete("/subscribers/:id", wrap(async (req, res) => { await q("DELETE FROM subscribers WHERE id = ?", [+req.params.id]); res.json({ ok: true }); }));
adminApi.get("/subscribers/export.xlsx", wrap(async (req, res) => {
  await sendXlsx(res, "Subscribers", [["email", "Email", 36], ["created_at", "Subscribed", 22]], await q("SELECT email, created_at FROM subscribers ORDER BY created_at DESC"));
}));

/* ---------------- settings ---------------- */
adminApi.get("/settings", wrap(async (req, res) => {
  const rows = await q("SELECT k, v FROM settings");
  res.json({ ok: true, values: Object.fromEntries(rows.map(r => [r.k, r.v])) });
}));
adminApi.put("/settings", wrap(async (req, res) => {
  const errors = {};
  for (const f of SETTINGS_FIELDS) {
    if (!(f.name in (req.body || {}))) continue;
    const v = String(req.body[f.name] ?? "").trim().slice(0, 2000);
    if (v && f.type === "url" && !/^https?:\/\//i.test(v)) { errors[f.name] = "Use a full web address starting with https://."; continue; }
    if (v && f.pattern && !new RegExp(f.pattern).test(v)) { errors[f.name] = "Invalid format."; continue; }
    await q("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", [f.name, v]);
  }
  invalidate();
  Object.keys(errors).length ? fail(res, 422, "Some fields were not saved.", { errors }) : res.json({ ok: true });
}));

/* ---------------- image uploads ---------------- */
const TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
const upload = multer({
  storage: multer.diskStorage({
    destination: fileURLToPath(new URL("../../public/uploads/", import.meta.url)),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${TYPES[file.mimetype] || extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => cb(TYPES[file.mimetype] ? null : new Error("Upload a JPG, PNG, WebP or GIF image."), !!TYPES[file.mimetype])
});
adminApi.post("/upload", (req, res) => upload.single("file")(req, res, err => {
  if (err) return fail(res, 400, err.code === "LIMIT_FILE_SIZE" ? "Images must be 4 MB or smaller." : err.message);
  if (!req.file) return fail(res, 400, "Choose an image to upload.");
  res.json({ ok: true, url: `/uploads/${req.file.filename}` });
}));

export { SHEET_COLUMNS };
