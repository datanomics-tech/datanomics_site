import { Router } from "express";
import rateLimit from "express-rate-limit";
import { q, one } from "../db.js";
import { config } from "../config.js";
import { getContent } from "../repo.js";
import { renderPage, renderVertical, render404, PAGE_PATHS } from "../render.js";
import { coverSVG, CATEGORY_STYLE } from "../components.mjs";
import { appendContact } from "../services/sheets.js";

export const publicRouter = Router();

const send = (res, html) => res.set("Cache-Control", "public, max-age=60").type("html").send(html);
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

for (const [name, path] of Object.entries(PAGE_PATHS)) {
  publicRouter.get(path === "/" ? "/" : path.replace(/\/$/, ""), wrap(async (req, res) => {
    if (path !== "/" && !req.path.endsWith("/")) return res.redirect(301, path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""));
    send(res, renderPage(name, await getContent()));
  }));
}

publicRouter.get("/verticals/:slug", wrap(async (req, res, next) => {
  const D = await getContent();
  const v = D.verticals.find(x => x.slug === req.params.slug);
  if (!v) return next();
  if (!req.path.endsWith("/")) return res.redirect(301, `/verticals/${v.slug}/`);
  send(res, renderVertical(v, D));
}));

// Generated placeholder cover images
publicRouter.get("/covers/project-:id.svg", wrap(async (req, res, next) => {
  const p = await one("SELECT title, color_a, color_b, icon FROM projects WHERE id = ?", [+req.params.id]);
  if (!p) return next();
  res.type("image/svg+xml").set("Cache-Control", "public, max-age=86400").send(coverSVG(p.title, p.color_a, p.color_b, p.icon));
}));
publicRouter.get("/covers/insight-:id.svg", wrap(async (req, res, next) => {
  const i = await one("SELECT i.title, c.name cat FROM insights i LEFT JOIN insight_categories c ON c.id = i.category_id WHERE i.id = ?", [+req.params.id]);
  if (!i) return next();
  const [a, b, ic] = CATEGORY_STYLE[i.cat] || ["#0D6EFD", "#00C853", "i-spark"];
  res.type("image/svg+xml").set("Cache-Control", "public, max-age=86400").send(coverSVG(i.title, a, b, ic, 800, 450));
}));

publicRouter.get("/sitemap.xml", wrap(async (req, res) => {
  const D = await getContent();
  const urls = [...Object.values(PAGE_PATHS), ...D.verticals.map(v => `/verticals/${v.slug}/`)];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${config.siteUrl}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
}));
publicRouter.get("/robots.txt", (req, res) => res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${config.siteUrl}/sitemap.xml\n`));

/* ---------- forms ---------- */
const formLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 8, standardHeaders: "draft-7", legacyHeaders: false, message: { ok: false, error: "Too many requests. Please try again in a few minutes." } });
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

publicRouter.post("/api/contact", formLimiter, wrap(async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: bots fill hidden fields
  const c = {
    name: clean(b.name, 160), company: clean(b.company, 200), email: clean(b.email, 190).toLowerCase(),
    phone: clean(b.phone, 60), service: clean(b.service, 200), message: clean(b.message, 5000),
    source_page: clean(req.get("referer"), 255)
  };
  const errors = {};
  if (c.name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL.test(c.email)) errors.email = "Enter a valid email address.";
  if (!c.service) errors.service = "Choose what you need help with.";
  if (c.message.length < 10) errors.message = "Add a short description (at least 10 characters).";
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });

  const r = await q("INSERT INTO contacts (name, company, email, phone, service, message, source_page, ip) VALUES (?,?,?,?,?,?,?,?)",
    [c.name, c.company || null, c.email, c.phone || null, c.service, c.message, c.source_page || null, req.ip]);
  res.json({ ok: true, id: r.insertId });
  appendContact({ ...c, id: r.insertId, created_at: new Date() }).catch(() => {}); // runs after responding
}));

publicRouter.post("/api/subscribe", formLimiter, wrap(async (req, res) => {
  const email = clean(req.body?.email, 190).toLowerCase();
  if (!EMAIL.test(email)) return res.status(422).json({ ok: false, error: "Enter a valid email address." });
  await q("INSERT IGNORE INTO subscribers (email) VALUES (?)", [email]);
  res.json({ ok: true });
}));

export async function notFound(req, res) {
  try { res.status(404).type("html").send(render404(await getContent())); }
  catch { res.status(404).send("Not found"); }
}
