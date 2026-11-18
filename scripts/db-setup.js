// Creates tables, loads starter content (only into empty tables) and creates the first admin.
// Safe to run more than once.   Usage: npm run db:setup
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { pool, q, one } from "../src/db.js";
import { DIVS, VERTICALS, PROJECTS, TEAM, TST, POSTS } from "../src/data/content.mjs";

const J = a => JSON.stringify(a || []);
const empty = async t => (await one(`SELECT COUNT(*) n FROM ${t}`)).n === 0;

const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .replace(/^--.*$/gm, "").split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
for (const s of sql) await q(s);
console.log("✓ Tables ready");

const SETTINGS = {
  company_name: "DATANOMICS TECHNOLOGIES Ltd",
  email: "datanomicstechnologies@gmail.com",
  phone: "+250780591568",
  whatsapp: "250780591568",
  address: "Norrsken Kigali Building, Kigali, Rwanda",
  hours_weekdays: "08:00 – 18:00",
  hours_saturday: "09:00 – 13:00",
  hours_sunday: "Support contracts only",
  social_linkedin: "", social_x: "", social_facebook: "", social_instagram: "",
  advice_title: "Need advice?",
  advice_text: "Talk to an engineer about your project, free of charge."
};
for (const [k, v] of Object.entries(SETTINGS)) await q("INSERT IGNORE INTO settings (k, v) VALUES (?, ?)", [k, v]);

if (await empty("verticals")) {
  for (const [i, v] of VERTICALS.entries())
    await q(`INSERT INTO verticals (slug, division, icon, short_name, title, summary, intro, solutions, customers, deliverables, technologies, note, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [v.id, v.div, v.icon, v.nm, v.title, v.short, v.intro, J(v.solutions), J(v.customers), J(v.deliverables), J(v.tech), v.note || null, (i + 1) * 10]);
  console.log(`✓ ${VERTICALS.length} verticals`);
}
if (await empty("projects")) {
  for (const [i, p] of PROJECTS.entries())
    await q(`INSERT INTO projects (title, category, tags, stack, summary, details, url, is_live, color_a, color_b, icon, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.t, p.cat, J(p.tags), p.stack, p.d, p.long, p.url || null, p.live ? 1 : 0, p.c[0], p.c[1], p.ic, (i + 1) * 10]);
  console.log(`✓ ${PROJECTS.length} projects`);
}
if (await empty("team")) {
  for (const [i, m] of TEAM.entries())
    await q("INSERT INTO team (name, role, bio, is_lead, is_placeholder, sort_order) VALUES (?,?,?,?,?,?)",
      [m.n, m.r, m.b, m.lead ? 1 : 0, m.ph ? 1 : 0, (i + 1) * 10]);
  console.log(`✓ ${TEAM.length} team members`);
}
if (await empty("testimonials")) {
  for (const [i, t] of TST.entries())
    await q("INSERT INTO testimonials (quote, author, company, rating, is_sample, sort_order) VALUES (?,?,?,?,1,?)",
      [t.q, t.n, t.c, t.s, (i + 1) * 10]);
  console.log(`✓ ${TST.length} testimonials (marked as samples)`);
}

const CATS = ["Digital Transformation", "Cybersecurity", "Data & AI", "Automation", "Cloud", "Data Privacy"];
if (await empty("insight_categories")) {
  for (const [i, c] of CATS.entries()) await q("INSERT INTO insight_categories (name, sort_order) VALUES (?, ?)", [c, (i + 1) * 10]);
  console.log("✓ Insight categories");
}
const catId = async name => (await one("SELECT id FROM insight_categories WHERE name = ?", [name]))?.id || null;

if (await empty("insight_topics")) {
  const TOPICS = [
    ["Penetration testing", "penetration test, pentest, pen test, red team, ethical hacking"],
    ["Power BI", "power bi, powerbi, business intelligence dashboard"],
    ["CCTV", "cctv, video surveillance, surveillance camera, ip camera"],
    ["Law 058/2021", "058/2021, data protection law, rwanda data protection, personal data protection, ncsa"],
    ["Cloud costs", "cloud cost, finops, cloud spending, cloud bill, cost optimization"],
    ["SOC", "security operations center, security operations centre, soc analyst, siem, threat detection"]
  ];
  for (const [i, [n, k]] of TOPICS.entries()) await q("INSERT INTO insight_topics (name, keywords, sort_order) VALUES (?,?,?)", [n, k, (i + 1) * 10]);
  console.log("✓ Popular topics");
}

if (await empty("feeds")) {
  const gnews = qs => `https://news.google.com/rss/search?q=${encodeURIComponent(qs)}&hl=en-RW&gl=RW&ceid=RW:en`;
  const FEEDS = [
    ["The Hacker News", "https://feeds.feedburner.com/TheHackersNews", "Cybersecurity"],
    ["BleepingComputer", "https://www.bleepingcomputer.com/feed/", "Cybersecurity"],
    ["CISA Cybersecurity Advisories", "https://www.cisa.gov/cybersecurity-advisories/all.xml", "Cybersecurity"],
    ["Google News: Rwanda cybersecurity", gnews("Rwanda cybersecurity"), "Cybersecurity"],
    ["MIT Technology Review: AI", "https://www.technologyreview.com/topic/artificial-intelligence/feed", "Data & AI"],
    ["Microsoft Power BI Blog", "https://powerbi.microsoft.com/en-us/blog/feed/", "Data & AI"],
    ["AWS News Blog", "https://aws.amazon.com/blogs/aws/feed/", "Cloud"],
    ["Google Cloud Blog", "https://cloudblog.withgoogle.com/rss/", "Cloud"],
    ["TechCabal", "https://techcabal.com/feed/", "Digital Transformation"],
    ["Google News: Rwanda digital transformation", gnews("Rwanda digital transformation"), "Digital Transformation"],
    ["IEEE Spectrum: Robotics", "https://spectrum.ieee.org/feeds/topic/robotics.rss", "Automation"],
    ["Google News: smart office automation CCTV Africa", gnews("smart building automation CCTV Africa"), "Automation"],
    ["Google News: Rwanda data protection", gnews("Rwanda data protection law 058/2021"), "Data Privacy"],
    ["EFF Deeplinks", "https://www.eff.org/rss/updates.xml", "Data Privacy"]
  ];
  for (const [n, u, c] of FEEDS) await q("INSERT INTO feeds (name, url, category_id) VALUES (?,?,?)", [n, u, await catId(c)]);
  console.log(`✓ ${FEEDS.length} news sources`);
}

if (await empty("insights")) {
  const mapCat = { "Digital Transformation": "Digital Transformation", "Cybersecurity": "Cybersecurity", "Data & AI": "Data & AI", "Automation": "Automation", "Cloud": "Cloud", "Data Privacy": "Data Privacy" };
  const months = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  for (const p of POSTS) {
    const [d, m, y] = p.date.split(" ");
    await q(`INSERT INTO insights (title, summary, body, category_id, origin, status, featured, read_minutes, published_at)
             VALUES (?,?,?,?, 'manual', 'published', ?, ?, ?)`,
      [p.t, p.x, p.f.join("\n\n"), await catId(mapCat[p.cat]), p.feat ? 1 : 0, p.min, `${y}-${String(months[m]).padStart(2, "0")}-${d} 09:00:00`]);
  }
  console.log(`✓ ${POSTS.length} starter articles`);
}

const admins = (await one("SELECT COUNT(*) n FROM admins")).n;
if (!admins) {
  const email = process.env.ADMIN_EMAIL, pw = process.env.ADMIN_PASSWORD, name = process.env.ADMIN_NAME || "Administrator";
  if (!email || !pw || pw.length < 10) {
    console.log("! No admin created: set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) in .env, then run `npm run admin:create`.");
  } else {
    await q("INSERT INTO admins (name, email, password_hash) VALUES (?,?,?)", [name, email.toLowerCase(), await bcrypt.hash(pw, 12)]);
    console.log(`✓ Admin account created: ${email}`);
  }
}
await pool.end();
console.log("Database setup complete.");
void DIVS;
