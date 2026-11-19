// DATANOMICS TECHNOLOGIES Ltd: website + admin panel server.
import express from "express";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import helmet from "helmet";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import { config } from "./src/config.js";
import { pool } from "./src/db.js";
import { publicRouter, notFound } from "./src/routes/public.js";
import { adminApi, requireAdmin } from "./src/routes/admin.js";
import { fetchFeeds } from "./src/services/feeds.js";

const app = express();
const dir = p => fileURLToPath(new URL(p, import.meta.url));
if (config.trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:"],
      "frame-src": ["https://www.google.com", "https://maps.google.com"],
      "connect-src": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "upgrade-insecure-requests": config.prod ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "200kb" }));

const MySQLStore = MySQLStoreFactory(session);
app.use(session({
  name: "dn.sid",
  secret: config.sessionSecret,
  store: new MySQLStore({ createDatabaseTable: true, clearExpired: true, checkExpirationInterval: 15 * 60 * 1000, expiration: 8 * 3600 * 1000 }, pool),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: "lax", secure: config.trustProxy ? "auto" : false, maxAge: 8 * 3600 * 1000 }
}));

// Static files
app.use("/assets", express.static(dir("./public/assets"), { maxAge: config.prod ? "7d" : 0 }));
app.use("/uploads", express.static(dir("./public/uploads"), { maxAge: "30d", setHeaders: res => res.set("X-Content-Type-Options", "nosniff") }));

// Admin panel
const adminFile = f => (req, res) => res.set({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }).sendFile(dir(`./admin/${f}`));
app.get("/admin/login", (req, res, next) => req.session?.adminId ? res.redirect("/admin") : next(), adminFile("login.html"));
app.use("/admin/static", express.static(dir("./admin/static"), { maxAge: config.prod ? "1d" : 0 }));
app.get(["/admin", "/admin/"], requireAdmin, adminFile("index.html"));
app.use("/api/admin", adminApi);

// Public website
app.use(publicRouter);
app.use(notFound);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  if (req.originalUrl.startsWith("/api/")) return res.status(500).json({ ok: false, error: "Something went wrong on the server. Please try again." });
  res.status(500).type("text").send("Something went wrong. Please try again later.");
});

// Daily insights fetch
if (cron.validate(config.feedsCron)) {
  cron.schedule(config.feedsCron, () => fetchFeeds().then(r => console.log(`[feeds] ${r.message || "done"}`)).catch(e => console.error("[feeds]", e)));
}

app.listen(config.port, () => console.log(`Datanomics site running at http://localhost:${config.port}  (admin: /admin)`));
