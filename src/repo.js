// Loads published website content from MySQL. Cached in memory; the admin panel clears the cache on every change.
import { q, list } from "./db.js";

let cache = null, cachedAt = 0;
const TTL = 5 * 60 * 1000;

export function invalidate() { cache = null; }

export async function getSettings() {
  const rows = await q("SELECT k, v FROM settings");
  return Object.fromEntries(rows.map(r => [r.k, r.v ?? ""]));
}

export async function getContent() {
  if (cache && Date.now() - cachedAt < TTL) return cache;
  const [verticals, projects, team, testimonials, categories, topics, insights, settings] = await Promise.all([
    q("SELECT * FROM verticals WHERE published = 1 ORDER BY sort_order, id"),
    q("SELECT * FROM projects WHERE published = 1 ORDER BY sort_order, id"),
    q("SELECT * FROM team WHERE published = 1 ORDER BY is_lead DESC, sort_order, id"),
    q("SELECT * FROM testimonials WHERE published = 1 ORDER BY sort_order, id"),
    q("SELECT * FROM insight_categories ORDER BY sort_order, id"),
    q("SELECT * FROM insight_topics ORDER BY sort_order, id"),
    q("SELECT * FROM insights WHERE status = 'published' ORDER BY featured DESC, published_at DESC, id DESC LIMIT 60"),
    getSettings()
  ]);
  verticals.forEach((v, i) => {
    v.no = String(i + 1).padStart(2, "0");
    for (const f of ["solutions", "customers", "deliverables", "technologies"]) v[f] = list(v[f]);
  });
  projects.forEach(p => { p.tags = list(p.tags); });
  // featured first in SQL so the featured item is easy to find; restore date order for the list
  const feat = insights.find(i => i.featured);
  const rest = insights.filter(i => i !== feat).sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  cache = { verticals, projects, team, testimonials, categories, topics, insights: feat ? [feat, ...rest] : rest, settings };
  cachedAt = Date.now();
  return cache;
}
