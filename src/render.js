// Assembles full HTML pages: layout + page template + data placeholders.
import { readFileSync, readdirSync } from "node:fs";
import { config } from "./config.js";
import { SPRITE } from "./data/icons.mjs";
import { sections, socialHTML, verticalPage, esc } from "./components.mjs";

const VIEWS = new URL("../views/", import.meta.url);
const read = p => readFileSync(new URL(p, VIEWS), "utf8");

let T = null;
function templates() {
  if (T && config.prod) return T;
  const pages = {};
  for (const f of readdirSync(new URL("pages/", VIEWS)).filter(f => f.endsWith(".html"))) {
    const raw = read(`pages/${f}`);
    const m = raw.match(/^<!--meta (\{.*?\}) -->\n/);
    pages[f.replace(/\.html$/, "")] = { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
  }
  T = { header: read("partials/header.html"), footer: read("partials/footer.html"), pages };
  return T;
}

function fill(html, D) {
  const S = sections(D);
  return html
    .replace(/\{\{set:(\w+)\}\}/g, (m, k) => esc(D.settings[k] ?? ""))
    .replace(/\{\{(\w+)\}\}/g, (m, k) => { if (!S[k]) throw new Error(`Unknown placeholder ${m}`); return S[k](); })
    .replace(/data-social><\/div>/g, () => `data-social>${socialHTML(D.settings)}</div>`);
}

function layout({ title, description, nav, path, body, home }, D) {
  const t = templates();
  const canonical = config.siteUrl + path;
  const header = t.header.replace(`<a href="${nav === "home" ? "/" : `/${nav}/`}">`, m => m.replace(">", ` aria-current="page">`));
  const S = D.settings;
  const org = {
    "@context": "https://schema.org", "@type": "Organization", name: S.company_name, url: config.siteUrl + "/",
    email: S.email, telephone: S.phone, foundingDate: "2024-06-28",
    founder: { "@type": "Person", name: "Frank Shimirwa Muyoboke" },
    address: { "@type": "PostalAddress", streetAddress: S.address, addressCountry: "RW" }
  };
  return fill(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#071A2F">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.company_name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(config.siteUrl)}/assets/img/og-image.svg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/css/styles.css">
${home ? `<script type="application/ld+json">${JSON.stringify(org).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
${home ? `<div id="loader" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#logo"/></svg></div>` : ""}
<div id="progress" aria-hidden="true"></div>
<a class="skip" href="#main">Skip to content</a>
${header}
<main id="main">
${body}
</main>
${t.footer}
<button id="toTop" aria-label="Back to top"><svg class="i"><use href="#i-up"/></svg></button>
<div id="toast" role="status" aria-live="polite"></div>
<dialog id="dlg"><button class="dlg-close" aria-label="Close" data-close><svg class="i"><use href="#i-close"/></svg></button><div id="dlgContent"></div></dialog>
${SPRITE}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`, D);
}

export const PAGE_PATHS = { index: "/", about: "/about/", verticals: "/verticals/", portfolio: "/portfolio/", team: "/team/", testimonials: "/testimonials/", insights: "/insights/", contact: "/contact/" };

export function renderPage(name, D) {
  const p = templates().pages[name];
  if (!p) return null;
  return layout({ ...p.meta, path: PAGE_PATHS[name], body: p.body, home: name === "index" }, D);
}

export function renderVertical(v, D) {
  return layout({ title: `${v.title} | ${D.settings.company_name}`, description: v.summary, nav: "verticals", path: `/verticals/${v.slug}/`, body: verticalPage(v, D) }, D);
}

export function render404(D) {
  return layout({
    title: `Page not found | ${D.settings.company_name}`, description: "This page could not be found.", nav: "", path: "/404",
    body: `<section class="view"><div class="page-hero page-in"><div class="wrap"><div class="crumb">404</div><h1>We couldn't find that page</h1><p>The link may be old or mistyped. Try the home page, or tell us what you were looking for.</p><div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:8px"><a class="btn lime" href="/">Go to home page</a><a class="btn ghost" href="/contact/">Contact us</a></div></div></div></section>`
  }, D);
}
