/* DATANOMICS TECHNOLOGIES Ltd — site interactions (vanilla JS, no dependencies) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = id => `<svg class="i" aria-hidden="true"><use href="#${id}"/></svg>`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- toast & copy ---------- */
  let tt;
  function toast(msg) {
    const t = $("#toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2800);
  }
  function copyText(el) {
    const txt = el.textContent.trim();
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selected — press Ctrl/Cmd+C to copy"); };
    try { navigator.clipboard.writeText(txt).then(() => toast("Copied: " + txt), fallback); } catch (_) { fallback(); }
  }

  /* ---------- mobile menu ---------- */
  const nav = $("#nav"), burger = $("#burger");
  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    burger.innerHTML = icon(open ? "i-close" : "i-menu");
  }
  burger && burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- reveal on scroll ---------- */
  const io = "IntersectionObserver" in window && !reduce
    ? new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        const t = en.target; t.classList.remove("wait"); io.unobserve(t);
        setTimeout(() => { t.style.transitionDelay = ""; }, 900);
      }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function armReveal() {
    if (!io) return;
    $$(".rv").forEach((el, i) => {
      if (el.dataset.armed || el.offsetParent === null) return;
      el.dataset.armed = 1;
      if (el.getBoundingClientRect().top > innerHeight * .92) {
        el.classList.add("wait"); el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el);
      }
    });
  }
  armReveal();

  /* ---------- counters ---------- */
  const stats = $("#stats");
  if (stats && "IntersectionObserver" in window && !reduce) {
    new IntersectionObserver((es, o) => es.forEach(en => {
      if (!en.isIntersecting) return; o.disconnect();
      $$("[data-count]", stats).forEach(el => {
        const end = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "", t0 = performance.now();
        const step = t => { const k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 3); el.textContent = (end * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }), { threshold: .4 }).observe(stats);
  }

  /* ---------- hero particle mesh ---------- */
  const cv = $("#mesh");
  if (cv) {
    const ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2);
    let pts = [], W = 0, H = 0, raf = 0;
    const size = () => {
      const r = cv.parentElement.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, W * H / 14000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, g: Math.random() < .25 }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
      for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
        const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, d = dx * dx + dy * dy;
        if (d < 16900) { ctx.strokeStyle = `rgba(91,157,255,${.22 * (1 - d / 16900)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke(); }
      }
      for (const p of pts) { ctx.fillStyle = p.g ? "rgba(46,224,122,.9)" : "rgba(91,157,255,.8)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.g ? 2.2 : 1.6, 0, 7); ctx.fill(); }
      if (!reduce && !document.hidden) raf = requestAnimationFrame(draw);
    };
    size(); draw();
    addEventListener("resize", () => { cancelAnimationFrame(raf); size(); draw(); });
    document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) draw(); });
  }

  /* ---------- scroll progress & back to top ---------- */
  const prog = $("#progress"), top = $("#toTop"), hdr = $("header.site");
  addEventListener("scroll", () => {
    const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    hdr && hdr.classList.toggle("scrolled", h.scrollTop > 12);
    if (prog) prog.style.width = (max > 0 ? h.scrollTop / max * 100 : 0) + "%";
    top && top.classList.toggle("show", h.scrollTop > 600);
  }, { passive: true });
  top && top.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- filters (portfolio + insights) ---------- */
  function filterGroup(btnSel, attr, items) {
    document.addEventListener("click", e => {
      const b = e.target.closest(btnSel); if (!b) return;
      const cat = b.getAttribute(attr);
      $$(btnSel).forEach(x => x.setAttribute("aria-pressed", x === b));
      items().forEach(el => { el.hidden = !(cat === "All" || el.dataset.cat === cat); });
      armReveal();
    });
  }
  filterGroup("#pfFilters [data-cat]", "data-cat", () => $$("#pfGrid [data-cat]"));
  // Insights: category + popular-topic filters work together
  let pcat = "All", ptopic = "";
  function applyInsights() {
    $$("#featured, #postGrid [data-cat]").forEach(el => {
      const okCat = pcat === "All" || el.dataset.cat === pcat;
      const okTopic = !ptopic || (el.dataset.topics || "").split("|").includes(ptopic);
      el.hidden = !(okCat && okTopic);
    });
    const empty = $("#noResults"), any = $$("#featured, #postGrid [data-cat]").some(el => !el.hidden);
    if (empty) empty.hidden = any;
    armReveal();
  }
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-pcat]");
    if (c) { pcat = c.dataset.pcat; $$("[data-pcat]").forEach(x => x.setAttribute("aria-pressed", x === c)); applyInsights(); }
    const t = e.target.closest("[data-topic]");
    if (t) { ptopic = ptopic === t.dataset.topic ? "" : t.dataset.topic; $$("[data-topic]").forEach(x => x.setAttribute("aria-pressed", x.dataset.topic === ptopic)); applyInsights(); }
  });
  // External article images that fail to load fall back to a generated cover
  document.addEventListener("error", e => {
    const img = e.target;
    if (img.tagName === "IMG" && img.dataset.fallback && !img.src.endsWith(img.dataset.fallback)) img.src = img.dataset.fallback;
  }, true);

  /* ---------- project modal ---------- */
  const dlg = $("#dlg");
  const projects = (() => { try { return JSON.parse($("#projects-json").textContent); } catch (_) { return []; } })();
  function openProject(i) {
    const p = projects[i]; if (!p || !dlg) return;
    const img = $(`[data-proj="${i}"]`).closest(".pf").querySelector("img").getAttribute("src");
    $("#dlgContent").innerHTML = `
      <div class="dlg-cover"><img src="${esc(img)}" alt="" width="800" height="500"></div>
      <div class="dlg-body">
        <div class="chips"><span class="badge ${p.live ? "live" : "ill"}">${p.live ? "Live project" : "Illustrative"}</span>${p.tags.map(t => `<span class="chip blue">${esc(t)}</span>`).join("")}</div>
        <h3>${esc(p.t)}</h3><p>${esc(p.d)}</p><p>${esc(p.long)}</p>
        <div class="stack" style="font-family:var(--f-mono);font-size:.8rem;color:var(--faint)">STACK · ${esc(p.stack)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px">
          ${p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Open live app ${icon("i-ext")}</a>` : ""}
          <a class="btn ghost" href="${esc(($('nav.main a[href*="contact"]') || {getAttribute:()=>"contact.html"}).getAttribute("href"))}">Discuss a similar project</a>
        </div>
      </div>`;
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  }
  dlg && dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest("[data-close]")) dlg.close(); });

  /* ---------- delegated clicks ---------- */
  document.addEventListener("click", e => {
    if (e.target.closest("[data-soon]")) { e.preventDefault(); toast("Social profile links coming soon"); }
    const rd = e.target.closest("[data-read]");
    if (rd) {
      const box = $("#full-" + rd.dataset.read); box.hidden = !box.hidden;
      rd.setAttribute("aria-expanded", !box.hidden);
      rd.firstChild.textContent = box.hidden ? "Read more " : "Show less ";
    }
    const pj = e.target.closest("[data-proj]"); if (pj) openProject(+pj.dataset.proj);
    const cp = e.target.closest("[data-copy]"); if (cp) copyText($("#" + cp.dataset.copy));
  });

  /* ---------- forms ---------- */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const cf = $("#cf");
  if (cf) {
    const pre = new URLSearchParams(location.search).get("service");
    if (pre && $(`#cf-service option[value="${CSS.escape(pre)}"]`)) $("#cf-service").value = pre;

    cf.addEventListener("submit", async e => {
      e.preventDefault();
      const get = id => $("#" + id, cf);
      const checks = [
        ["cf-name", v => v.trim().length > 1, "Please enter your name."],
        ["cf-email", emailOk, "Enter a valid email, e.g. name@company.rw."],
        ["cf-service", v => !!v, "Choose what you need help with."],
        ["cf-msg", v => v.trim().length > 9, "Add a short description (at least 10 characters)."]
      ];
      let ok = true;
      checks.forEach(([id, test, msg]) => {
        const el = get(id), wrap = el.closest(".field"), good = test(el.value);
        wrap.classList.toggle("bad", !good); $(".err", wrap).textContent = good ? "" : msg;
        if (!good && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;

      const data = {
        name: get("cf-name").value, company: get("cf-company").value, email: get("cf-email").value,
        phone: get("cf-phone").value, service: get("cf-service").selectedOptions[0].text, message: get("cf-msg").value,
        website: get("cf-website") ? get("cf-website").value : ""
      };
      const first = esc(data.name.split(" ")[0]);
      const s = $("#sent"), btn = cf.querySelector('button[type="submit"]');
      const endpoint = cf.dataset.endpoint;

      if (endpoint) {
        btn.disabled = true; btn.firstChild.textContent = "Sending… ";
        try {
          const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (r.status === 422) {
            const j = await r.json(), map = { name: "cf-name", email: "cf-email", service: "cf-service", message: "cf-msg" };
            Object.entries(j.errors || {}).forEach(([k, msg]) => { const el = get(map[k]); if (el) { el.closest(".field").classList.add("bad"); $(".err", el.closest(".field")).textContent = msg; } });
            btn.disabled = false; btn.firstChild.textContent = "Send request "; return;
          }
          if (r.status === 429) throw new Error("rate");
          if (!r.ok) throw new Error(r.status);
          s.innerHTML = `<h3>Thank you, ${first}. Your message has been sent.</h3><p class="muted">A member of our team will reply within one business day.</p>`;
          cf.reset();
        } catch (_) {
          s.innerHTML = `<h3>We couldn't send your message.</h3><p class="muted">Please check your connection and try again, or contact us on WhatsApp at +250780591568.</p>`;
        }
        btn.disabled = false; btn.firstChild.textContent = "Send request ";
      } else {
        const text = encodeURIComponent(`Hello Datanomics,\n\nName: ${data.name}\nCompany: ${data.company || "-"}\nEmail: ${data.email}\nPhone: ${data.phone || "-"}\nService: ${data.service}\n\n${data.message}`);
        s.innerHTML = `<h3>Your request is ready, ${first}.</h3><p class="muted">Send it to our team on WhatsApp for the fastest reply, or email it to datanomicstechnologies@gmail.com.</p><div><a class="btn lime sm" target="_blank" rel="noopener" href="https://wa.me/250780591568?text=${text}">Send via WhatsApp ${icon("i-wa")}</a></div>`;
      }
      s.hidden = false;
      s.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
  }

  const news = $("#news");
  news && news.addEventListener("submit", async e => {
    e.preventDefault();
    const v = $("#news-email").value.trim(), m = $("#newsMsg");
    if (!emailOk(v)) { m.style.color = "#FF8A8A"; m.textContent = "Enter a valid email address."; return; }
    m.style.color = "";
    if (news.dataset.endpoint) {
      try {
        const r = await fetch(news.dataset.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email: v }) });
        if (!r.ok) throw new Error(r.status);
      } catch (_) { m.style.color = "#FF8A8A"; m.textContent = "We couldn't subscribe you right now. Please try again later."; return; }
    }
    m.textContent = "Thank you for subscribing. Look out for our next issue."; news.reset();
  });

  /* ---------- loader ---------- */
  const loader = $("#loader");
  if (loader) addEventListener("load", () => loader.classList.add("done"));
})();
