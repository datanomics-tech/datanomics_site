/* Datanomics admin panel (vanilla JS). Every value from the server is escaped with esc(). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d, time = true) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
  const view = $("#view");
  let ME = null, SCHEMA = null, CSRF = "";

  /* ---------------- API ---------------- */
  async function api(path, { method = "GET", body, raw } = {}) {
    const opts = { method, headers: {}, credentials: "same-origin" };
    if (method !== "GET") opts.headers["X-CSRF-Token"] = CSRF;
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    const r = await fetch("/api/admin" + path, opts);
    if (r.status === 401) { location.href = "/admin/login"; throw new Error("Signed out"); }
    if (raw) return r;
    const j = await r.json().catch(() => ({ ok: false, error: "Unexpected server response." }));
    if (!r.ok || j.ok === false) { const e = new Error(j.error || "Request failed."); e.errors = j.errors; throw e; }
    return j;
  }

  let tt;
  function toast(msg, bad = false) {
    const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : "");
    clearTimeout(tt); tt = setTimeout(() => t.className = "toast", 3200);
  }

  /* ---------------- navigation ---------------- */
  const NAV = [
    ["Overview", [["dashboard", "Dashboard"]]],
    ["Enquiries", [["contacts", "Contacts", "contactsNew"], ["subscribers", "Newsletter"]]],
    ["Insights", [["insights", "Articles", "insightsPending", "warn"], ["c-feeds", "News sources"], ["c-insight_categories", "Categories"], ["c-insight_topics", "Popular topics"]]],
    ["Website content", [["c-verticals", "Verticals"], ["c-projects", "Portfolio"], ["c-team", "Team"], ["c-testimonials", "Testimonials"]]],
    ["Configuration", [["settings", "Site settings"], ["account", "Account & admins"]]]
  ];
  let BADGES = {};
  function drawNav(active) {
    $("#nav").innerHTML = NAV.map(([g, items]) => `<div class="grp">${esc(g)}</div>` + items.map(([id, label, badge, cls]) =>
      `<a href="#${id}" ${id === active ? 'aria-current="page"' : ""}><span>${esc(label)}</span>${badge && BADGES[badge] ? `<span class="badge ${cls || ""}">${+BADGES[badge]}</span>` : ""}</a>`).join("")).join("");
  }
  async function refreshBadges() {
    try { const d = await api("/dashboard"); BADGES = d.counts; drawNav(current()); } catch { /* ignore */ }
  }
  const current = () => (location.hash.slice(1) || "dashboard").split("?")[0];

  async function route() {
    const id = current();
    drawNav(id);
    $("#side").classList.remove("open");
    closeDrawer();
    view.innerHTML = `<p class="loading">Loading…</p>`;
    try {
      if (id === "dashboard") await viewDashboard();
      else if (id === "contacts") await viewContacts();
      else if (id === "subscribers") await viewSubscribers();
      else if (id === "insights") await viewInsights();
      else if (id === "settings") await viewSettings();
      else if (id === "account") await viewAccount();
      else if (id.startsWith("c-") && SCHEMA.entities[id.slice(2)]) await viewEntity(id.slice(2));
      else { location.hash = "dashboard"; }
    } catch (e) { if (e.message !== "Signed out") view.innerHTML = `<div class="alert">${esc(e.message)}</div>`; }
  }
  const setTitle = t => { $("#title").textContent = t; document.title = `${t} · Datanomics Admin`; };

  /* ---------------- dashboard ---------------- */
  async function viewDashboard() {
    setTitle("Dashboard");
    const d = await api("/dashboard"); BADGES = d.counts; drawNav("dashboard");
    const c = d.counts;
    const days = [...Array(14)].map((_, i) => { const x = new Date(); x.setDate(x.getDate() - 13 + i); return x; });
    const key = x => x.toISOString().slice(0, 10);
    const per = Object.fromEntries(d.perDay.map(r => [String(r.d).slice(0, 10), r.n]));
    const max = Math.max(1, ...days.map(x => per[key(x)] || 0));
    view.innerHTML = `
      ${!d.sheets ? `<div class="alert info">The Google Sheet isn't connected yet, so enquiries are only saved in the database. Follow <b>google-apps-script/SETUP.md</b> to connect your shared Drive spreadsheet.</div>` : ""}
      ${c.unsynced && d.sheets ? `<div class="alert">${c.unsynced} enquir${c.unsynced === 1 ? "y has" : "ies have"} not reached the Google Sheet yet. <a href="#contacts">Open Contacts</a> and choose “Sync to Google Sheet”.</div>` : ""}
      ${d.feedErrors.length ? `<div class="alert">${d.feedErrors.length} news source${d.feedErrors.length === 1 ? "" : "s"} failed on the last fetch: ${d.feedErrors.map(f => esc(f.name)).join(", ")}. <a href="#c-feeds">Check news sources</a>.</div>` : ""}
      <div class="stats">
        <a class="stat ${c.contactsNew ? "attn" : ""}" href="#contacts"><span class="k">${c.contactsNew}</span><span class="l">New enquiries</span></a>
        <a class="stat ${c.insightsPending ? "attn" : ""}" href="#insights"><span class="k">${c.insightsPending}</span><span class="l">Articles to review</span></a>
        <a class="stat" href="#contacts"><span class="k">${c.contacts30}</span><span class="l">Enquiries in the last 30 days</span></a>
        <a class="stat" href="#subscribers"><span class="k">${c.subscribers}</span><span class="l">Newsletter subscribers</span></a>
      </div>
      <div class="grid2">
        <div class="card"><h2>Enquiries, last 14 days <span class="pill">${c.contactsTotal} total</span></h2>
          <div class="chart">${days.map(x => { const n = per[key(x)] || 0; return `<div class="bar" title="${esc(fmtDate(x, false))}: ${n}"><b>${n || ""}</b><i style="height:${(n / max) * 100}%"></i></div>`; }).join("")}</div>
          <div class="chart-x">${days.map((x, i) => `<span>${i % 2 ? "" : x.getDate()}</span>`).join("")}</div>
        </div>
        <div class="card"><h2>On the website</h2>
          <ul class="list-plain">
            <li><a href="#c-verticals">Verticals</a><b>${c.verticals}</b></li>
            <li><a href="#c-projects">Portfolio projects</a><b>${c.projects}</b></li>
            <li><a href="#c-team">Team members</a><b>${c.team}</b></li>
            <li><a href="#c-testimonials">Testimonials</a><b>${c.testimonials}</b></li>
            <li><a href="#insights">Published articles</a><b>${c.insightsPublished}</b></li>
          </ul>
        </div>
      </div>
      <div class="grid2">
        <div class="card"><h2>Latest enquiries <a class="btn sm ghost" href="#contacts">View all</a></h2>
          ${d.recentContacts.length ? `<ul class="list-plain">${d.recentContacts.map(r => `<li><div style="min-width:0"><div class="t1">${esc(r.name)}${r.company ? ` · ${esc(r.company)}` : ""}</div><div class="t2">${esc(r.service)} · ${esc(fmtDate(r.created_at))}</div></div><span class="pill ${esc(r.status)}">${esc(r.status)}</span></li>`).join("")}</ul>` : `<p class="empty">No enquiries yet.</p>`}
        </div>
        <div class="card"><h2>Articles waiting for review <a class="btn sm ghost" href="#insights">Review</a></h2>
          ${d.pending.length ? `<ul class="list-plain">${d.pending.map(r => `<li><div style="min-width:0"><div class="t1">${esc(r.title)}</div><div class="t2">${esc(r.category || "")} · ${esc(r.source || "")} · ${esc(fmtDate(r.published_at, false))}</div></div><button class="btn sm lime" data-publish="${r.id}">Publish</button></li>`).join("")}</ul>` : `<p class="empty">Nothing to review. New articles arrive automatically every day.</p>`}
        </div>
      </div>`;
    view.onclick = async e => {
      const b = e.target.closest("[data-publish]"); if (!b) return;
      b.disabled = true;
      try { await api("/insights/bulk", { method: "POST", body: { ids: [+b.dataset.publish], action: "publish" } }); toast("Article published"); viewDashboard(); }
      catch (err) { toast(err.message, true); b.disabled = false; }
    };
  }

  /* ---------------- drawer & form builder ---------------- */
  function openDrawer(title, bodyHtml, footHtml) {
    const d = $("#drawer");
    d.innerHTML = `<div class="drawer-head"><h2 id="drawerTitle">${esc(title)}</h2><button class="icon-btn" data-close-drawer aria-label="Close">✕</button></div><div class="drawer-body">${bodyHtml}</div>${footHtml ? `<div class="drawer-foot">${footHtml}</div>` : ""}`;
    $("#drawerWrap").hidden = false;
    setTimeout(() => ($("input:not([type=hidden]), textarea, select", d) || d).focus(), 30);
    return d;
  }
  function closeDrawer() { $("#drawerWrap").hidden = true; $("#drawer").innerHTML = ""; }
  document.addEventListener("click", e => { if (e.target.closest("[data-close-drawer]")) closeDrawer(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#drawerWrap").hidden) closeDrawer(); });

  const ICON_SVG = id => { const s = document.getElementById(id); return s ? s.innerHTML : ""; };
  function fieldHtml(f, v, suggestions) {
    const id = `f_${f.name}`, help = f.help ? `<span class="help">${esc(f.help)}</span>` : "";
    const val = v ?? f.default ?? "";
    let input;
    switch (f.type) {
      case "textarea": input = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 4}" ${f.max ? `maxlength="${f.max}"` : ""}>${esc(val)}</textarea>`; break;
      case "list": input = `<textarea id="${id}" name="${f.name}" rows="5">${esc((Array.isArray(val) ? val : []).join("\n"))}</textarea>`; break;
      case "number": input = `<input id="${id}" name="${f.name}" type="number" value="${esc(val)}" ${f.min != null ? `min="${f.min}"` : ""} ${f.max != null ? `max="${f.max}"` : ""}>`; break;
      case "bool": return `<div class="f" data-f="${f.name}"><label class="switch"><input type="checkbox" id="${id}" name="${f.name}" ${+val ? "checked" : ""}> ${esc(f.label)}</label>${help}<span class="err"></span></div>`;
      case "select": case "icon":
        input = `<select id="${id}" name="${f.name}"><option value="">Choose…</option>${(f.options || []).map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
        if (f.type === "icon") input = `<div class="icon-prev"><svg viewBox="0 0 24 24" data-icon-prev>${ICON_SVG(val)}</svg>${input}</div>`;
        break;
      case "color": input = `<input id="${id}" name="${f.name}" type="color" value="${esc(val || "#0D6EFD")}">`; break;
      case "datetime": { const d = val ? new Date(val) : null; const loc = d && !isNaN(d) ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""; input = `<input id="${id}" name="${f.name}" type="datetime-local" value="${loc}">`; break; }
      case "image": input = `<div class="img-field"><img class="prev" src="${esc(val || "/assets/img/og-image.svg")}" alt="" data-prev="${f.name}"><div class="acts"><input id="${id}" name="${f.name}" type="text" value="${esc(val)}" placeholder="https://… or upload"><div><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="${f.name}" hidden><button type="button" class="btn sm ghost" data-pick="${f.name}">Upload image</button> <button type="button" class="btn sm ghost" data-clear="${f.name}">Remove</button></div></div></div>`; break;
      case "readonly": input = `<div class="ro">${esc(val === "" ? "—" : /T\d\d:|\d{4}-\d\d-\d\d/.test(String(val)) && !isNaN(new Date(val)) ? fmtDate(val) : val)}</div>`; break;
      default: {
        const list = f.suggest && suggestions[f.suggest] ? `list="dl_${f.name}"` : "";
        input = `<input id="${id}" name="${f.name}" type="${f.type === "url" ? "url" : "text"}" value="${esc(val)}" ${f.max ? `maxlength="${f.max}"` : ""} ${list}>` +
          (list ? `<datalist id="dl_${f.name}">${suggestions[f.suggest].map(s => `<option value="${esc(s)}">`).join("")}</datalist>` : "");
      }
    }
    return `<div class="f" data-f="${f.name}"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label>${input}${help}<span class="err"></span></div>`;
  }
  function readForm(root, fields) {
    const out = {};
    for (const f of fields) {
      if (f.type === "readonly") continue;
      const el = root.querySelector(`[name="${f.name}"]`); if (!el) continue;
      if (f.type === "bool") out[f.name] = el.checked ? 1 : 0;
      else if (f.type === "list") out[f.name] = el.value.split("\n").map(s => s.trim()).filter(Boolean);
      else if (f.type === "datetime") out[f.name] = el.value ? new Date(el.value).toISOString() : "";
      else out[f.name] = el.value;
    }
    return out;
  }
  function showErrors(root, errors = {}) {
    $$(".f", root).forEach(w => { w.classList.remove("bad"); const e = $(".err", w); if (e) e.textContent = ""; });
    Object.entries(errors).forEach(([k, m]) => { const w = $(`[data-f="${k}"]`, root); if (w) { w.classList.add("bad"); $(".err", w).textContent = m; } });
    const first = $(".f.bad", root); if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function wireFormExtras(root) {
    root.addEventListener("change", async e => {
      if (e.target.matches("[data-upload]")) {
        const name = e.target.dataset.upload, file = e.target.files[0]; if (!file) return;
        const fd = new FormData(); fd.append("file", file);
        try { const r = await api("/upload", { method: "POST", body: fd }); $(`[name="${name}"]`, root).value = r.url; $(`[data-prev="${name}"]`, root).src = r.url; toast("Image uploaded"); }
        catch (err) { toast(err.message, true); }
        e.target.value = "";
      }
      if (e.target.closest(".icon-prev")) $("[data-icon-prev]", e.target.closest(".icon-prev")).innerHTML = ICON_SVG(e.target.value);
    });
    root.addEventListener("input", e => { const p = e.target.name && $(`[data-prev="${e.target.name}"]`, root); if (p) p.src = e.target.value || "/assets/img/og-image.svg"; });
    root.addEventListener("click", e => {
      const p = e.target.closest("[data-pick]"); if (p) $(`[data-upload="${p.dataset.pick}"]`, root).click();
      const c = e.target.closest("[data-clear]"); if (c) { $(`[name="${c.dataset.clear}"]`, root).value = ""; $(`[data-prev="${c.dataset.clear}"]`, root).src = "/assets/img/og-image.svg"; }
    });
  }

  // Confirm in-page (no browser dialogs)
  function confirmIn(btn, label = "Click again to confirm") {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = "1"; const old = btn.textContent; btn.textContent = label;
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 3500);
    return false;
  }

  function editEntity(key, row, onSaved) {
    const ent = SCHEMA.entities[key], isNew = !row?.id;
    const fields = ent.fields.filter(f => !(isNew && f.type === "readonly"));
    const body = fields.map(f => fieldHtml(f, row?.[f.name], SCHEMA.suggestions)).join("");
    const foot = `${!isNew ? `<button class="btn danger" data-del>Delete</button>` : ""}<span class="grow"></span><button class="btn ghost" data-close-drawer>Cancel</button><button class="btn primary" data-save>${isNew ? "Create" : "Save changes"}</button>`;
    const d = openDrawer(isNew ? `New ${ent.singular.toLowerCase()}` : `Edit ${ent.singular.toLowerCase()}`, `<form novalidate>${body}</form>`, foot);
    const form = $("form", d); form.style.display = "grid"; form.style.gap = "16px";
    wireFormExtras(d);
    const save = async () => {
      const btn = $("[data-save]", d); btn.disabled = true;
      try {
        const r = await api(`/content/${key}${isNew ? "" : "/" + row.id}`, { method: isNew ? "POST" : "PUT", body: readForm(form, fields) });
        toast(isNew ? `${ent.singular} created` : "Changes saved"); closeDrawer(); onSaved(r.row);
      } catch (err) { showErrors(d, err.errors); toast(err.message, true); btn.disabled = false; }
    };
    $("[data-save]", d).onclick = save;
    form.onsubmit = e => { e.preventDefault(); save(); };
    const del = $("[data-del]", d);
    if (del) del.onclick = async () => {
      if (!confirmIn(del, "Click again to delete")) return;
      try { await api(`/content/${key}/${row.id}`, { method: "DELETE" }); toast(`${ent.singular} deleted`); closeDrawer(); onSaved(null); }
      catch (err) { toast(err.message, true); }
    };
  }

  /* ---------------- generic entity list ---------------- */
  function cell(f, v, key) {
    if (!f) return esc(v);
    if (f.type === "bool") return `<span class="pill ${+v ? "yes" : "no"}">${+v ? "Yes" : "No"}</span>`;
    if (f.type === "select") { const o = (f.options || []).find(o => String(o.value) === String(v)); return esc(o ? o.label.replace(/^[A-D] · /, m => key === "verticals" ? m.trim().slice(0, 1) + " · " : m) : v ?? "—"); }
    if (f.type === "readonly" && f.name === "last_status") return v ? `<span class="pill ${/^Error/.test(v) ? "err" : "yes"}">${esc(v)}</span>` : "—";
    if (f.type === "readonly" || f.type === "datetime") return esc(v ? fmtDate(v) : "—");
    return `<span class="clip">${esc(v ?? "—")}</span>`;
  }
  async function viewEntity(key) {
    const ent = SCHEMA.entities[key]; setTitle(ent.label);
    const load = async () => {
      const r = await api(`/content/${key}`);
      const fmap = Object.fromEntries(ent.fields.map(f => [f.name, f]));
      const extra = key === "feeds" ? `<button class="btn primary" data-fetch-all>Fetch all sources now</button>` : "";
      view.innerHTML = `
        <div class="toolbar"><span class="grow" style="color:var(--muted)">${r.total} item${r.total === 1 ? "" : "s"}</span>${extra}<button class="btn lime" data-new>+ Add ${esc(ent.singular.toLowerCase())}</button></div>
        <div class="table-wrap">${r.rows.length ? `<table class="t"><thead><tr>${ent.columns.map(c => `<th>${esc(fmap[c]?.label.replace(/ \(.*\)$/, "") || c)}</th>`).join("")}</tr></thead>
          <tbody>${r.rows.map(row => `<tr data-id="${row.id}">${ent.columns.map(c => `<td>${cell(fmap[c], row[c], key)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : `<p class="empty">Nothing here yet.</p>`}</div>`;
      const rows = Object.fromEntries(r.rows.map(x => [x.id, x]));
      view.onclick = async e => {
        if (e.target.closest("[data-new]")) return editEntity(key, null, () => { load(); refreshSchema(); });
        const fa = e.target.closest("[data-fetch-all]");
        if (fa) { fa.disabled = true; fa.textContent = "Fetching… this can take a minute"; try { const x = await api("/feeds/fetch", { method: "POST", body: {} }); toast(x.message || "Done"); load(); refreshBadges(); } catch (err) { toast(err.message, true); fa.disabled = false; } return; }
        const tr = e.target.closest("tr[data-id]"); if (tr) editEntity(key, rows[tr.dataset.id], () => { load(); refreshSchema(); });
      };
    };
    await load();
  }
  async function refreshSchema() { SCHEMA = await api("/schema"); }

  /* ---------------- insights ---------------- */
  async function viewInsights() {
    setTitle("Articles");
    const st = { status: "pending", category_id: "", q: "", page: 1 };
    const cats = SCHEMA.entities.insights.fields.find(f => f.name === "category_id").options;
    const sel = new Set();
    view.innerHTML = `
      <div class="alert info">Articles from your <a href="#c-feeds">news sources</a> arrive every morning as <b>Waiting for review</b>. Publish the ones that suit Datanomics; the rest stay hidden from the website.</div>
      <div class="toolbar">
        <div class="tabs" id="stTabs">${[["pending", "Waiting for review"], ["published", "Published"], ["hidden", "Hidden"], ["", "All"]].map(([v, l]) => `<button type="button" data-st="${v}" aria-pressed="${v === st.status}">${l}</button>`).join("")}</div>
        <select class="filter" id="catF" aria-label="Category"><option value="">All categories</option>${cats.map(c => `<option value="${c.value}">${esc(c.label)}</option>`).join("")}</select>
        <input class="search" id="qF" type="search" placeholder="Search titles or sources" aria-label="Search">
        <span class="grow"></span>
        <button class="btn ghost" id="fetchNow">Fetch latest news</button>
        <button class="btn lime" id="newArt">+ Write article</button>
      </div>
      <div class="bulk" id="bulk" hidden><b id="selN"></b><button class="btn sm lime" data-bulk="publish">Publish</button><button class="btn sm ghost" data-bulk="hide">Hide</button><button class="btn sm ghost" data-bulk="pending">Back to review</button><button class="btn sm danger" data-bulk="delete">Delete</button><button class="btn sm ghost" data-bulk="clear">Clear selection</button></div>
      <div class="table-wrap" id="tbl"></div>
      <div class="pager" id="pager"></div>`;
    const load = async () => {
      const qs = new URLSearchParams(Object.entries({ status: st.status, category_id: st.category_id, q: st.q, page: st.page }).filter(([, v]) => v !== ""));
      const r = await api(`/content/insights?${qs}`);
      const catName = id => cats.find(c => String(c.value) === String(id))?.label || "—";
      $("#tbl").innerHTML = r.rows.length ? `<table class="t"><thead><tr><th><input type="checkbox" id="all" aria-label="Select all"></th><th></th><th>Article</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>
        ${r.rows.map(a => `<tr data-id="${a.id}"><td data-nocl><input type="checkbox" data-sel="${a.id}" ${sel.has(a.id) ? "checked" : ""} aria-label="Select"></td>
          <td><img class="thumb" src="${esc(a.image_url || `/covers/insight-${a.id}.svg`)}" data-fallback="/covers/insight-${a.id}.svg" alt="" loading="lazy" referrerpolicy="no-referrer"></td>
          <td style="max-width:460px"><span class="clip" style="display:block;font-weight:600">${a.featured ? "★ " : ""}${esc(a.title)}</span><span class="sub">${esc(a.source || (a.origin === "manual" ? "Datanomics" : ""))}</span></td>
          <td>${esc(catName(a.category_id))}</td><td><span class="pill ${esc(a.status)}">${a.status === "pending" ? "review" : esc(a.status)}</span></td>
          <td style="white-space:nowrap">${esc(fmtDate(a.published_at, false))}</td>
          <td data-nocl>${a.url ? `<a class="btn sm ghost" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Open ↗</a>` : ""}</td></tr>`).join("")}
        </tbody></table>` : `<p class="empty">${st.status === "pending" ? "Nothing waiting for review. Use “Fetch latest news” to check your sources now." : "No articles found."}</p>`;
      $("#pager").innerHTML = r.pages > 1 ? `<button class="btn sm ghost" data-pg="-1" ${r.page <= 1 ? "disabled" : ""}>← Previous</button><span>Page ${r.page} of ${r.pages} · ${r.total} articles</span><button class="btn sm ghost" data-pg="1" ${r.page >= r.pages ? "disabled" : ""}>Next →</button>` : `<span>${r.total} article${r.total === 1 ? "" : "s"}</span>`;
      view._rows = Object.fromEntries(r.rows.map(x => [x.id, x]));
      updBulk();
    };
    const updBulk = () => { $("#bulk").hidden = !sel.size; $("#selN").textContent = `${sel.size} selected`; };
    let qt;
    $("#qF").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); st.page = 1; load(); }, 300); };
    $("#catF").onchange = e => { st.category_id = e.target.value; st.page = 1; load(); };
    view.onclick = async e => {
      const t = e.target;
      const tab = t.closest("[data-st]"); if (tab) { st.status = tab.dataset.st; st.page = 1; sel.clear(); $$("[data-st]").forEach(b => b.setAttribute("aria-pressed", b === tab)); return load(); }
      const pg = t.closest("[data-pg]"); if (pg) { st.page += +pg.dataset.pg; return load(); }
      if (t.id === "all") { $$("[data-sel]").forEach(c => { c.checked = t.checked; t.checked ? sel.add(+c.dataset.sel) : sel.delete(+c.dataset.sel); }); return updBulk(); }
      if (t.matches("[data-sel]")) { t.checked ? sel.add(+t.dataset.sel) : sel.delete(+t.dataset.sel); return updBulk(); }
      const bk = t.closest("[data-bulk]");
      if (bk) {
        if (bk.dataset.bulk === "clear") { sel.clear(); $$("[data-sel]").forEach(c => c.checked = false); return updBulk(); }
        if (bk.dataset.bulk === "delete" && !confirmIn(bk, "Click again to delete")) return;
        try { const r = await api("/insights/bulk", { method: "POST", body: { ids: [...sel], action: bk.dataset.bulk } }); toast(`${r.count} article${r.count === 1 ? "" : "s"} updated`); sel.clear(); load(); refreshBadges(); }
        catch (err) { toast(err.message, true); }
        return;
      }
      if (t.id === "fetchNow") { t.disabled = true; t.textContent = "Fetching…"; try { const r = await api("/feeds/fetch", { method: "POST", body: {} }); toast(r.message || "Done"); load(); refreshBadges(); } catch (err) { toast(err.message, true); } t.disabled = false; t.textContent = "Fetch latest news"; return; }
      if (t.id === "newArt") return editEntity("insights", { status: "published", origin: "manual" }, () => { load(); refreshBadges(); });
      if (t.closest("[data-nocl]")) return;
      const tr = t.closest("tr[data-id]"); if (tr) editEntity("insights", view._rows[tr.dataset.id], () => { load(); refreshBadges(); });
    };
    await load();
  }

  /* ---------------- contacts ---------------- */
  async function viewContacts() {
    setTitle("Contacts");
    const st = { status: "", q: "", page: 1 };
    view.innerHTML = `
      <div class="toolbar">
        <div class="tabs">${[["", "All"], ["new", "New"], ["read", "Read"], ["replied", "Replied"], ["archived", "Archived"]].map(([v, l]) => `<button type="button" data-st="${v}" aria-pressed="${v === st.status}">${l}</button>`).join("")}</div>
        <input class="search" id="qF" type="search" placeholder="Search name, email, company or message" aria-label="Search">
        <span class="grow"></span>
        ${ME.sheets.enabled ? `<button class="btn ghost" id="sheetRows">View Google Sheet</button>` : ""}
        ${ME.sheets.viewUrl ? `<a class="btn ghost" href="${esc(ME.sheets.viewUrl)}" target="_blank" rel="noopener">Open in Drive ↗</a>` : ""}
        ${ME.sheets.enabled ? `<button class="btn ghost" id="syncAll">Sync to Google Sheet</button>` : ""}
        <a class="btn primary" href="/api/admin/contacts/export.xlsx">Download Excel</a>
      </div>
      ${!ME.sheets.enabled ? `<div class="alert info">Enquiries are saved in the database. Connect the Google Sheet in your shared Drive to keep a live spreadsheet copy (see <b>google-apps-script/SETUP.md</b>).</div>` : ""}
      <div class="table-wrap" id="tbl"></div><div class="pager" id="pager"></div>`;
    const load = async () => {
      const qs = new URLSearchParams(Object.entries(st).filter(([, v]) => v !== ""));
      const r = await api(`/contacts?${qs}`);
      $("#tbl").innerHTML = r.rows.length ? `<table class="t"><thead><tr><th>Received</th><th>From</th><th>Service</th><th>Message</th><th>Status</th>${ME.sheets.enabled ? "<th>Sheet</th>" : ""}</tr></thead><tbody>
        ${r.rows.map(c => `<tr data-id="${c.id}"><td style="white-space:nowrap">${esc(fmtDate(c.created_at))}</td><td><b>${esc(c.name)}</b><span class="sub">${esc(c.company || c.email)}</span></td>
          <td><span class="clip" style="display:block;max-width:220px">${esc(c.service)}</span></td><td><span class="clip" style="display:block;max-width:300px">${esc(c.message)}</span></td>
          <td><span class="pill ${esc(c.status)}">${esc(c.status)}</span></td>${ME.sheets.enabled ? `<td>${c.sheet_synced ? `<span class="pill yes">Saved</span>` : `<span class="pill err" title="${esc(c.sheet_error || "Not yet sent")}">Pending</span>`}</td>` : ""}</tr>`).join("")}
        </tbody></table>` : `<p class="empty">No enquiries found.</p>`;
      $("#pager").innerHTML = r.pages > 1 ? `<button class="btn sm ghost" data-pg="-1" ${r.page <= 1 ? "disabled" : ""}>← Previous</button><span>Page ${r.page} of ${r.pages} · ${r.total}</span><button class="btn sm ghost" data-pg="1" ${r.page >= r.pages ? "disabled" : ""}>Next →</button>` : `<span>${r.total} enquir${r.total === 1 ? "y" : "ies"}</span>`;
      view._rows = Object.fromEntries(r.rows.map(x => [x.id, x]));
    };
    let qt;
    $("#qF").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); st.page = 1; load(); }, 300); };
    view.onclick = async e => {
      const t = e.target;
      const tab = t.closest("[data-st]"); if (tab) { st.status = tab.dataset.st; st.page = 1; $$("[data-st]").forEach(b => b.setAttribute("aria-pressed", b === tab)); return load(); }
      const pg = t.closest("[data-pg]"); if (pg) { st.page += +pg.dataset.pg; return load(); }
      if (t.id === "syncAll") { t.disabled = true; try { const r = await api("/contacts/sync", { method: "POST", body: {} }); toast(r.remaining ? `${r.synced} synced, ${r.remaining} still failing. Check the sheet setup.` : `All enquiries are in the Google Sheet`, !!r.remaining); load(); } catch (err) { toast(err.message, true); } t.disabled = false; return; }
      if (t.id === "sheetRows") return showSheet();
      const tr = t.closest("tr[data-id]"); if (tr) openContact(view._rows[tr.dataset.id], load);
    };
    await load();
  }
  async function openContact(c, reload) {
    if (c.status === "new") { try { c = (await api(`/contacts/${c.id}`, { method: "PUT", body: { status: "read" } })).row; refreshBadges(); } catch { /* ignore */ } }
    const body = `
      <dl class="kv"><dt>Received</dt><dd>${esc(fmtDate(c.created_at))}</dd><dt>Name</dt><dd>${esc(c.name)}</dd><dt>Company</dt><dd>${esc(c.company || "—")}</dd>
        <dt>Email</dt><dd><a href="mailto:${esc(c.email)}?subject=${encodeURIComponent("Re: your enquiry to Datanomics")}">${esc(c.email)}</a></dd><dt>Phone</dt><dd>${esc(c.phone || "—")}</dd>
        <dt>Service</dt><dd>${esc(c.service)}</dd><dt>Sent from</dt><dd>${esc(c.source_page || "—")}</dd>
        <dt>Google Sheet</dt><dd>${c.sheet_synced ? "Saved" : esc(c.sheet_error || "Not sent yet")}</dd></dl>
      <div class="f"><label>Message</label><div class="msg-box">${esc(c.message)}</div></div>
      <div class="f"><label for="cStatus">Status</label><select id="cStatus">${["new", "read", "replied", "archived"].map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
      <div class="f"><label for="cNotes">Internal notes</label><textarea id="cNotes" rows="4" placeholder="Follow-up actions, quote sent, etc.">${esc(c.notes || "")}</textarea></div>`;
    const d = openDrawer(`Enquiry from ${c.name}`, body, `<button class="btn danger" data-del>Delete</button><span class="grow"></span>${c.phone ? `<a class="btn ghost" href="https://wa.me/${esc(String(c.phone).replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}<button class="btn primary" data-save>Save</button>`);
    $("[data-save]", d).onclick = async () => {
      try { await api(`/contacts/${c.id}`, { method: "PUT", body: { status: $("#cStatus").value, notes: $("#cNotes").value } }); toast("Saved"); closeDrawer(); reload(); refreshBadges(); }
      catch (err) { toast(err.message, true); }
    };
    const del = $("[data-del]", d);
    del.onclick = async () => { if (!confirmIn(del, "Click again to delete")) return; try { await api(`/contacts/${c.id}`, { method: "DELETE" }); toast("Enquiry deleted"); closeDrawer(); reload(); refreshBadges(); } catch (err) { toast(err.message, true); } };
  }
  async function showSheet() {
    const d = openDrawer("Google Sheet (live)", `<p class="loading">Reading the spreadsheet…</p>`);
    try {
      const r = await api("/contacts/sheet");
      $(".drawer-body", d).innerHTML = `<p style="color:var(--muted);margin:0">${r.rows.length} row${r.rows.length === 1 ? "" : "s"} in the spreadsheet${r.viewUrl ? ` · <a href="${esc(r.viewUrl)}" target="_blank" rel="noopener">Open in Google Drive ↗</a>` : ""}</p>
        <div class="table-wrap"><table class="t"><thead><tr>${r.headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${r.rows.slice().reverse().map(row => `<tr>${row.map(v => `<td><span class="clip" style="display:block;max-width:240px">${esc(v)}</span></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      $("#drawer").style.width = "min(1000px, 100%)";
    } catch (err) { $(".drawer-body", d).innerHTML = `<div class="alert">${esc(err.message)}</div>`; }
  }

  /* ---------------- subscribers ---------------- */
  async function viewSubscribers() {
    setTitle("Newsletter subscribers");
    const load = async () => {
      const r = await api("/subscribers");
      view.innerHTML = `<div class="toolbar"><span class="grow" style="color:var(--muted)">${r.rows.length} subscriber${r.rows.length === 1 ? "" : "s"}</span><a class="btn primary" href="/api/admin/subscribers/export.xlsx">Download Excel</a></div>
        <div class="table-wrap">${r.rows.length ? `<table class="t"><thead><tr><th>Email</th><th>Subscribed</th><th></th></tr></thead><tbody>${r.rows.map(s => `<tr><td>${esc(s.email)}</td><td>${esc(fmtDate(s.created_at))}</td><td style="text-align:right"><button class="btn sm danger" data-rm="${s.id}">Remove</button></td></tr>`).join("")}</tbody></table>` : `<p class="empty">No subscribers yet. The sign-up form is in the website footer.</p>`}</div>`;
    };
    view.onclick = async e => {
      const b = e.target.closest("[data-rm]"); if (!b || !confirmIn(b, "Confirm")) return;
      try { await api(`/subscribers/${b.dataset.rm}`, { method: "DELETE" }); toast("Removed"); load(); } catch (err) { toast(err.message, true); }
    };
    await load();
  }

  /* ---------------- settings ---------------- */
  async function viewSettings() {
    setTitle("Site settings");
    const r = await api("/settings");
    view.innerHTML = `<form class="card" id="setForm" novalidate style="display:grid;gap:16px;max-width:760px">
      <p style="margin:0;color:var(--muted)">These details appear in the website header, footer, contact page and Insights sidebar.</p>
      ${SCHEMA.settingsFields.map(f => fieldHtml(f, r.values[f.name] ?? "", {})).join("")}
      <div><button class="btn primary" type="submit">Save settings</button></div></form>`;
    $("#setForm").onsubmit = async e => {
      e.preventDefault();
      try { await api("/settings", { method: "PUT", body: readForm(e.target, SCHEMA.settingsFields) }); showErrors(e.target); toast("Settings saved"); }
      catch (err) { showErrors(e.target, err.errors); toast(err.message, true); }
    };
  }

  /* ---------------- account ---------------- */
  async function viewAccount() {
    setTitle("Account & admins");
    const r = await api("/admins");
    view.innerHTML = `<div class="grid2">
      <form class="card" id="pwForm" novalidate style="display:grid;gap:14px"><h2>Change your password</h2>
        <div class="f"><label for="pwCur">Current password</label><input id="pwCur" type="password" autocomplete="current-password"></div>
        <div class="f"><label for="pwNew">New password</label><input id="pwNew" type="password" autocomplete="new-password"><span class="help">At least 10 characters. A short sentence works well.</span></div>
        <div class="f"><label for="pwNew2">Repeat new password</label><input id="pwNew2" type="password" autocomplete="new-password"></div>
        <div><button class="btn primary" type="submit">Update password</button></div></form>
      <div class="card"><h2>Admins</h2>
        <ul class="list-plain">${r.rows.map(a => `<li><div style="min-width:0"><div class="t1">${esc(a.name)}${a.id === ME.admin.id ? " (you)" : ""}</div><div class="t2">${esc(a.email)} · last sign-in ${esc(fmtDate(a.last_login))}</div></div>${a.id !== ME.admin.id ? `<button class="btn sm danger" data-rm="${a.id}">Remove</button>` : ""}</li>`).join("")}</ul>
        <form id="addForm" novalidate style="display:grid;gap:12px;margin-top:16px"><h2 style="margin:0">Add an admin</h2>
          <div class="f"><label for="aName">Name</label><input id="aName"></div>
          <div class="f"><label for="aEmail">Email</label><input id="aEmail" type="email"></div>
          <div class="f"><label for="aPw">Temporary password</label><input id="aPw" type="text" autocomplete="off"><span class="help">Share it privately; they can change it after signing in.</span></div>
          <div><button class="btn ghost" type="submit">Add admin</button></div></form>
      </div></div>`;
    $("#pwForm").onsubmit = async e => {
      e.preventDefault();
      if ($("#pwNew").value !== $("#pwNew2").value) return toast("The new passwords don't match.", true);
      try { await api("/account/password", { method: "PUT", body: { current: $("#pwCur").value, next: $("#pwNew").value } }); e.target.reset(); toast("Password updated"); }
      catch (err) { toast(err.message, true); }
    };
    $("#addForm").onsubmit = async e => {
      e.preventDefault();
      try { await api("/admins", { method: "POST", body: { name: $("#aName").value, email: $("#aEmail").value, password: $("#aPw").value } }); toast("Admin added"); viewAccount(); }
      catch (err) { toast(err.message, true); }
    };
    view.onclick = async e => {
      const b = e.target.closest("[data-rm]"); if (!b || !confirmIn(b, "Confirm")) return;
      try { await api(`/admins/${b.dataset.rm}`, { method: "DELETE" }); toast("Admin removed"); viewAccount(); } catch (err) { toast(err.message, true); }
    };
  }

  document.addEventListener("error", e => { const i = e.target; if (i.tagName === "IMG" && i.dataset.fallback && !i.src.endsWith(i.dataset.fallback)) i.src = i.dataset.fallback; }, true);

  /* ---------------- boot ---------------- */
  async function boot() {
    // Icon sprite from the public site so forms can preview icons
    try { const s = await fetch("/").then(r => r.text()); const m = s.match(/<svg width="0" height="0"[\s\S]*?<\/svg>\s*(?=<script)/); if (m) document.body.insertAdjacentHTML("beforeend", m[0]); } catch { /* optional */ }
    ME = await api("/me"); CSRF = ME.csrf;
    $("#who").textContent = ME.admin.name;
    SCHEMA = await api("/schema");
    $("#logout").onclick = async () => { try { await api("/logout", { method: "POST", body: {} }); } catch { /* ignore */ } location.href = "/admin/login"; };
    $("#menuBtn").onclick = () => $("#side").classList.toggle("open");
    addEventListener("hashchange", route);
    await route();
    refreshBadges();
    setInterval(refreshBadges, 120000);
  }
  boot().catch(e => { if (e.message !== "Signed out") view.innerHTML = `<div class="alert">${esc(e.message)}</div>`; });
})();
