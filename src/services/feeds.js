// Pulls articles from trusted news feeds into the insights table as "pending" for admin approval.
import Parser from "rss-parser";
import { createHash } from "node:crypto";
import { q } from "../db.js";
import { config } from "../config.js";
import { invalidate } from "../repo.js";

const parser = new Parser({
  timeout: 20000,
  headers: { "User-Agent": `DatanomicsInsights/1.0 (+${config.siteUrl})`, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8" },
  customFields: { item: [["media:content", "mediaContent"], ["media:thumbnail", "mediaThumb"], ["source", "sourceName"]] }
});

const stripHtml = s => String(s || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ").trim();
const trimTo = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
const isHttp = u => /^https?:\/\//i.test(u || "");

function imageOf(item) {
  const cands = [item.enclosure?.type?.startsWith?.("image") || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(item.enclosure?.url || "") ? item.enclosure?.url : null,
    item.mediaContent?.$?.url, item.mediaThumb?.$?.url,
    (String(item["content:encoded"] || item.content || "").match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1]];
  return cands.find(isHttp) || null;
}

let running = false;
export async function fetchFeeds({ feedId } = {}) {
  if (running) return { ok: false, message: "A fetch is already running." };
  running = true;
  const report = [];
  try {
    const feeds = await q(`SELECT * FROM feeds WHERE active = 1 ${feedId ? "AND id = ?" : ""}`, feedId ? [feedId] : []);
    const cutoff = Date.now() - 45 * 24 * 3600 * 1000;
    for (const f of feeds) {
      let added = 0;
      try {
        const feed = await parser.parseURL(f.url);
        for (const it of (feed.items || []).slice(0, 25)) {
          const url = it.link;
          if (!isHttp(url) || !it.title) continue;
          const date = new Date(it.isoDate || it.pubDate || Date.now());
          if (date.getTime() < cutoff) continue;
          let title = stripHtml(it.title), source = f.name.replace(/^Google News:.*$/, "");
          const gsrc = typeof it.sourceName === "string" ? it.sourceName : it.sourceName?._;
          if (/news\.google\./.test(f.url)) { // Google News titles end with " - Publisher"
            const m = title.match(/^(.*)\s+-\s+([^-]{2,80})$/);
            if (m) { title = m[1]; source = gsrc || m[2]; } else source = gsrc || "Google News";
          }
          const summary = trimTo(stripHtml(it.contentSnippet || it.summary || it.content || ""), 320);
          const hash = createHash("sha1").update(url).digest("hex");
          const r = await q(`INSERT IGNORE INTO insights (title, summary, url, url_hash, source, image_url, category_id, origin, status, published_at)
                             VALUES (?,?,?,?,?,?,?, 'feed', 'pending', ?)`,
            [trimTo(title, 390), summary && summary !== title ? summary : null, url.slice(0, 690), hash, (source || feed.title || f.name).slice(0, 150), imageOf(it), f.category_id, date]);
          added += r.affectedRows;
        }
        await q("UPDATE feeds SET last_fetched = NOW(), last_status = ? WHERE id = ?", [`OK · ${added} new`, f.id]);
        report.push({ feed: f.name, ok: true, added });
      } catch (e) {
        const msg = String(e.message || e).slice(0, 200);
        await q("UPDATE feeds SET last_fetched = NOW(), last_status = ? WHERE id = ?", [`Error · ${msg}`, f.id]);
        report.push({ feed: f.name, ok: false, error: msg });
      }
    }
    invalidate();
    const added = report.reduce((s, r) => s + (r.added || 0), 0);
    return { ok: true, added, report, message: `${added} new article${added === 1 ? "" : "s"} waiting for review.` };
  } finally { running = false; }
}
