// HTML renderers for data-driven sections. All values from the database are escaped.
import { DIVS, VERTICALS as SEED_VERTICALS, INDUSTRIES, WHY, VALUES, CMP } from "./data/content.mjs";
import { ICONS } from "./data/icons.mjs";

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const icon = (id, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="#${esc(id)}"/></svg>`;
const safeUrl = u => /^(https?:\/\/|\/)/i.test(String(u || "")) ? esc(u) : "#";
const stars = n => Array.from({ length: 5 }, (_, k) => `<svg class="i" style="opacity:${k < n ? 1 : .25}" aria-hidden="true"><use href="#i-star"/></svg>`).join("");
const initials = n => String(n).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
const paras = t => String(t || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

// Industries reference verticals by number in the seed file; map them to slugs once.
const NO_TO_SLUG = Object.fromEntries(SEED_VERTICALS.map(v => [v.no, v.id]));
const IND = INDUSTRIES.map(x => ({ ...x, slugs: x.v.map(n => NO_TO_SLUG[n]) }));

const SOCIAL = [["social_linkedin", "i-li", "LinkedIn"], ["social_x", "i-x", "X"], ["social_facebook", "i-fb", "Facebook"], ["social_instagram", "i-ig", "Instagram"]];
export function socialHTML(S) {
  return SOCIAL.map(([k, id, l]) => S[k]
    ? `<a href="${safeUrl(S[k])}" target="_blank" rel="noopener" aria-label="Datanomics on ${l}">${icon(id)}</a>`
    : `<a href="#" data-soon aria-label="Datanomics on ${l}">${icon(id)}</a>`).join("");
}

/* ---------- generated placeholder covers ---------- */
export function coverSVG(title, a, b, ic, w = 800, h = 500) {
  const seed = [...String(title)].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 9973, 7);
  const r = n => ((seed * (n + 3) * 9301 + 49297) % 233280) / 233280;
  let dots = "", lines = "";
  for (let k = 0; k < 18; k++) dots += `<circle cx="${(r(k) * w).toFixed(0)}" cy="${(r(k + 40) * h).toFixed(0)}" r="${(2 + r(k + 80) * 3).toFixed(1)}" fill="#F8FAFC" fill-opacity=".35"/>`;
  for (let k = 0; k < 10; k++) lines += `<line x1="${(r(k) * w).toFixed(0)}" y1="${(r(k + 40) * h).toFixed(0)}" x2="${(r(k + 1) * w).toFixed(0)}" y2="${(r(k + 41) * h).toFixed(0)}" stroke="#F8FAFC" stroke-opacity=".12"/>`;
  const col = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : "#0D6EFD";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071A2F"/><stop offset=".55" stop-color="${col(a)}"/><stop offset="1" stop-color="${col(b)}"/></linearGradient><pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#F8FAFC" stroke-opacity=".07"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#p)"/>${lines}${dots}<circle cx="${w * .78}" cy="${h * .3}" r="${h * .42}" fill="#F8FAFC" fill-opacity=".05"/><g transform="translate(${w / 2 - 70} ${h / 2 - 70}) scale(5.8)" fill="none" stroke="#F8FAFC" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic] || ICONS["i-layers"]}</g></svg>`;
}
export const CATEGORY_STYLE = {
  "Digital Transformation": ["#0D6EFD", "#00C853", "i-globe"], "Cybersecurity": ["#0A3A7A", "#0D6EFD", "i-shield"],
  "Data & AI": ["#7C4DFF", "#0D6EFD", "i-ai"], "Automation": ["#00C853", "#0A3A7A", "i-cctv"],
  "Cloud": ["#00A3FF", "#0F172A", "i-cloud"], "Data Privacy": ["#0D6EFD", "#7C4DFF", "i-lock"]
};
const projectCover = p => p.cover_image ? safeUrl(p.cover_image) : `/covers/project-${p.id}.svg`;
const insightCover = i => i.image_url ? safeUrl(i.image_url) : `/covers/insight-${i.id}.svg`;

/* ---------- topic matching for insights ---------- */
export function topicsFor(item, topics) {
  const text = `${item.title} ${item.summary || ""}`.toLowerCase();
  return topics.filter(t => t.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean).some(k => text.includes(k))).map(t => t.name);
}

/* ---------- section renderers ---------- */
export function sections(D) {
  const { verticals, projects, team, testimonials, insights, categories, topics, settings: S } = D;
  const bySlug = Object.fromEntries(verticals.map(v => [v.slug, v]));
  const vCard = v => `
  <a class="glass vcard lift rv" href="/verticals/${esc(v.slug)}/">
    <div class="vtop"><div class="ico">${icon(v.icon)}</div><span class="vno">${esc(v.no)}</span></div>
    <h3>${esc(v.title)}</h3><p>${esc(v.summary)}</p>
    <span class="link-arrow">Explore ${icon("i-arrow")}</span>
  </a>`;
  const indCard = x => `
  <article class="glass ind lift rv"><div class="ico">${icon(x.icon)}</div><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
    <div class="chips">${x.slugs.filter(s => bySlug[s]).map(s => `<a class="chip blue" href="/verticals/${esc(s)}/">${esc(bySlug[s].short_name)}</a>`).join("")}</div>
  </article>`;
  const tstCard = t => `
  <figure class="glass tst lift rv" style="margin:0">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div class="stars" aria-label="${+t.rating} out of 5 stars">${stars(+t.rating)}</div>${t.is_sample ? `<span class="ph-note">Sample</span>` : ""}</div>
    <blockquote>“${esc(t.quote)}”</blockquote>
    <figcaption class="who"><span class="avatar">${esc(initials(t.author))}</span><span><b>${esc(t.author)}</b><small>${esc(t.company)}</small></span></figcaption>
  </figure>`;

  const published = insights;
  const feat = published.find(i => i.featured) || published[0];
  const catName = id => categories.find(c => c.id === id)?.name || "Insights";
  const insightCard = (i, featured = false) => {
    const tps = topicsFor(i, topics).join("|");
    const meta = `<div class="meta"><span class="cat">${esc(catName(i.category_id))}</span>${i.source ? `<span>${esc(i.source)}</span>` : ""}<span>${esc(fmtDate(i.published_at))}</span>${i.read_minutes ? `<span>${+i.read_minutes} min read</span>` : ""}</div>`;
    const action = i.origin === "feed" && i.url
      ? `<a class="link-arrow" href="${safeUrl(i.url)}" target="_blank" rel="noopener nofollow">Read on ${esc(i.source || "source")} ${icon("i-ext")}</a>`
      : paras(i.body).length ? `<button class="link-arrow" type="button" data-read="${i.id}" aria-expanded="false">Read more ${icon("i-arrow")}</button>` : "";
    const full = i.origin !== "feed" && paras(i.body).length ? `<div class="full${featured ? " muted" : ""}" id="full-${i.id}" hidden>${paras(i.body).map(p => `<p>${esc(p)}</p>`).join("")}</div>` : "";
    const img = `<img loading="lazy" decoding="async" src="${insightCover(i)}" alt="" width="800" height="450" referrerpolicy="no-referrer" data-fallback="/covers/insight-${i.id}.svg">`;
    return featured
      ? `<article class="glass feat lift rv" id="featured" data-cat="${esc(catName(i.category_id))}" data-topics="${esc(tps)}">
          <div class="cover">${img}</div>
          <div class="body"><span class="eyebrow">Featured</span>${meta}<h2>${esc(i.title)}</h2><p class="muted">${esc(i.summary)}</p>${full}<div>${action}</div></div>
        </article>`
      : `<article class="glass post lift rv" data-cat="${esc(catName(i.category_id))}" data-topics="${esc(tps)}">
          <div class="cover">${img}</div>
          <div class="body">${meta}<h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p>${full}<div class="foot">${action}</div></div>
        </article>`;
  };

  return {
    divmap: () => DIVS.map(d => `
      <div class="glass dm rv"><div class="dm-h"><span class="div-letter sm">${d.id}</span><span>${esc(d.name)}</span></div>
        <ul>${verticals.filter(v => v.division === d.id).map(v => `<li><a href="/verticals/${esc(v.slug)}/"><span class="n">${esc(v.no)}</span><span>${esc(v.short_name)}</span>${icon("i-arrow")}</a></li>`).join("")}</ul>
      </div>`).join(""),
    divisions: () => DIVS.map(d => {
      const vs = verticals.filter(v => v.division === d.id);
      return vs.length ? `
      <div>
        <div class="div-head rv"><span class="div-letter">${d.id}</span><div><span class="eyebrow">Division ${d.id}</span><h2>${esc(d.name)}</h2><p>${esc(d.d)}</p></div></div>
        <div class="vgrid">${vs.map(vCard).join("")}</div>
      </div>` : "";
    }).join(""),
    industries: () => IND.map(indCard).join(""),
    why: () => WHY.map(([ic, h, p]) => `<div class="glass why lift rv"><div class="ico">${icon(ic)}</div><div><h3>${esc(h)}</h3><p>${esc(p)}</p></div></div>`).join(""),
    testimonials_preview: () => testimonials.slice(0, 3).map(tstCard).join(""),
    testimonials: () => testimonials.map(tstCard).join(""),
    stars5: () => stars(5),
    values: () => VALUES.map(([ic, h, p]) => `<div class="glass val lift rv"><div class="ico">${icon(ic)}</div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join(""),
    compare: () => CMP.map(([l, a, b]) => {
      const cell = v => v === true ? `<span class="yes">${icon("i-check")}<span class="sr">Yes</span></span>` : v === "partial" ? `<span class="no">Partial</span>` : `<span class="no">—<span class="sr">No</span></span>`;
      return `<tr><td>${esc(l)}</td><td class="c">${cell(a)}</td><td class="c">${cell(b)}</td></tr>`;
    }).join(""),
    pf_filters: () => ["All", ...new Set(projects.map(p => p.category))].map((c, i) => `<button type="button" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`).join(""),
    pf_grid: () => projects.map((p, i) => `
      <article class="glass pf lift rv" data-cat="${esc(p.category)}">
        <div class="cover"><img loading="lazy" decoding="async" src="${projectCover(p)}" alt="${esc(p.title)} cover image" width="800" height="500"><span class="badge ${p.is_live ? "live" : "ill"}">${p.is_live ? "Live project" : "Illustrative"}</span></div>
        <div class="body">
          <div class="chips">${p.tags.map(t => `<span class="chip blue">${esc(t)}</span>`).join("")}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.summary)}</p>
          <div class="stack">${esc(p.stack)}</div>
          <div class="foot"><span class="chip">${esc(p.category)}</span><button class="btn sm ghost" type="button" data-proj="${i}">View Project ${icon("i-arrow")}</button></div>
        </div>
      </article>`).join("") +
      `<script type="application/json" id="projects-json">${JSON.stringify(projects.map(p => ({ t: p.title, d: p.summary, long: p.details, stack: p.stack, tags: p.tags, live: !!p.is_live, url: /^https?:\/\//.test(p.url || "") ? p.url : "" }))).replace(/</g, "\\u003c")}</script>`,
    team: () => team.map(m => `
      <article class="glass tm lift rv ${m.is_lead ? "lead" : ""}">
        ${m.is_placeholder ? `<span class="ph-note">Placeholder</span>` : ""}
        <div class="ph">${m.photo ? `<img src="${safeUrl(m.photo)}" alt="${esc(m.name)}" loading="lazy" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : `<div aria-hidden="true">${esc(initials(m.name))}</div>`}</div>
        <div style="display:grid;gap:8px;${m.is_lead ? "" : "justify-items:center"}">
          <span class="role">${esc(m.role)}</span>
          <h3>${esc(m.name)}</h3>
          <p>${esc(m.bio)}</p>
          <div class="social" style="${m.is_lead ? "" : "justify-content:center"}">
            ${m.linkedin ? `<a href="${safeUrl(m.linkedin)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on LinkedIn">${icon("i-li")}</a>` : `<a href="#" data-soon aria-label="${esc(m.name)} on LinkedIn">${icon("i-li")}</a>`}
            ${m.x_url ? `<a href="${safeUrl(m.x_url)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on X">${icon("i-x")}</a>` : `<a href="#" data-soon aria-label="${esc(m.name)} on X">${icon("i-x")}</a>`}
          </div>
        </div>
      </article>`).join(""),
    featured: () => feat ? insightCard(feat, true) : `<p class="muted">New articles are on their way. Check back soon.</p>`,
    posts: () => published.filter(i => i !== feat).map(i => insightCard(i)).join(""),
    post_cats: () => [{ name: "All", n: published.length }, ...categories.map(c => ({ name: c.name, n: published.filter(i => i.category_id === c.id).length }))]
      .map((c, k) => `<li><button type="button" data-pcat="${esc(c.name)}" aria-pressed="${k === 0}">${esc(c.name)}<span>${c.n}</span></button></li>`).join(""),
    topics_box: () => topics.length ? `<div class="glass box"><h4>Popular topics</h4><div class="chips">${topics.map(t => `<button type="button" class="chip topic" data-topic="${esc(t.name)}" aria-pressed="false">${esc(t.name)}</button>`).join("")}</div></div>` : "",
    advice_box: () => `<div class="glass box" style="display:grid;gap:12px"><h4 style="margin:0">${esc(S.advice_title || "Need advice?")}</h4><p class="muted" style="font-size:.93rem">${esc(S.advice_text || "")}</p><a class="btn sm" href="/contact/?service=advice">Book a free call</a></div>`,
    service_options: () => DIVS.map(d => `<optgroup label="${d.id} · ${esc(d.name)}">${verticals.filter(v => v.division === d.id).map(v => `<option value="${esc(v.slug)}">${esc(v.title)}</option>`).join("")}</optgroup>`).join("") + `<option value="other">Not sure yet, help me choose</option>`,
    footer_verticals: () => verticals.map(v => `<li><a href="/verticals/${esc(v.slug)}/">${esc(v.short_name)}</a></li>`).join(""),
    form_endpoint: () => "/api/contact",
    newsletter_endpoint: () => "/api/subscribe"
  };
}

/* ---------- one page per vertical ---------- */
export function verticalPage(v, D) {
  const vs = D.verticals, S = D.settings;
  const d = DIVS.find(x => x.id === v.division) || { id: v.division, name: "" };
  const k = vs.indexOf(v), n = vs.length;
  const prev = vs[(k + n - 1) % n], next = vs[(k + 1) % n];
  const ticks = arr => `<ul class="ticks">${arr.map(x => `<li>${icon("i-check")}<span>${esc(x)}</span></li>`).join("")}</ul>`;
  const sib = vs.filter(x => x.division === v.division && x !== v);
  const wa = `https://wa.me/${encodeURIComponent(S.whatsapp || "")}?text=` + encodeURIComponent(`Hello Datanomics, I'd like to talk about ${v.title}.`);
  const card = x => `
  <a class="glass vcard lift rv" href="/verticals/${esc(x.slug)}/">
    <div class="vtop"><div class="ico">${icon(x.icon)}</div><span class="vno">${esc(x.no)}</span></div>
    <h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><span class="link-arrow">Explore ${icon("i-arrow")}</span>
  </a>`;
  return `<section class="view">
  <div class="page-hero page-in"><div class="wrap">
    <div class="crumb"><a href="/">Home</a> / <a href="/verticals/">Verticals</a> / ${esc(v.short_name)}</div>
    <div class="vd-head"><div class="ico" style="width:64px;height:64px">${icon(v.icon)}</div><span class="eyebrow">Division ${esc(d.id)}: ${esc(d.name)}</span></div>
    <h1 style="max-width:22ch">${esc(v.title)}</h1>
    <p>${esc(v.intro)}</p>
    <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:8px">
      <a class="btn lime" href="/contact/?service=${esc(v.slug)}">Request a Quote ${icon("i-arrow")}</a>
      <a class="btn ghost" href="${esc(wa)}" target="_blank" rel="noopener">Ask on WhatsApp ${icon("i-wa")}</a>
    </div>
  </div></div>
  <div class="band"><div class="wrap">
    <div class="grid g2">
      <div class="glass vd-box rv"><h2>What we can do for you</h2>${ticks(v.solutions)}</div>
      <div class="glass vd-box rv"><h2>What you will receive</h2>${ticks(v.deliverables)}</div>
      <div class="glass vd-box rv"><h2>Who we usually work with</h2><div class="chips">${v.customers.map(c => `<span class="chip lime">${esc(c)}</span>`).join("")}</div></div>
      <div class="glass vd-box rv"><h2>Tools and technologies</h2><div class="chips">${v.technologies.map(c => `<span class="chip blue">${esc(c)}</span>`).join("")}</div></div>
    </div>
    ${v.note ? `<p class="vd-note rv">${icon("i-bulb")}<span>${esc(v.note)}</span></p>` : ""}
    ${sib.length ? `<div style="margin-top:64px"><div class="sec-head rv" style="margin-bottom:24px"><span class="eyebrow">Also in Division ${esc(d.id)}</span><h2 style="font-size:var(--s-3)">${esc(d.name)}</h2></div><div class="vgrid">${sib.map(card).join("")}</div></div>` : ""}
    ${n > 1 ? `<nav class="vd-nav" aria-label="More verticals">
      <a class="glass lift" href="/verticals/${esc(prev.slug)}/"><small>← PREVIOUS</small><b>${esc(prev.short_name)}</b></a>
      <a class="glass lift" href="/verticals/${esc(next.slug)}/" style="text-align:right"><small>NEXT →</small><b>${esc(next.short_name)}</b></a>
    </nav>` : ""}
  </div></div>
</section>`;
}

export { DIVS };
