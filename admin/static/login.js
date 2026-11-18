(() => {
  const f = document.getElementById("login"), err = document.getElementById("err"), btn = f.querySelector("button[type=submit]");
  document.getElementById("togglePw").addEventListener("click", e => {
    const p = document.getElementById("password"), show = p.type === "password";
    p.type = show ? "text" : "password"; e.target.textContent = show ? "Hide" : "Show";
    e.target.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    err.hidden = true;
    const email = f.email.value.trim(), password = f.password.value;
    if (!email || !password) { err.textContent = "Enter your email and password."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { location.href = "/admin"; return; }
      err.textContent = j.error || "Sign-in failed. Please try again.";
    } catch { err.textContent = "Can't reach the server. Check your connection."; }
    err.hidden = false; btn.disabled = false; btn.textContent = "Sign in";
  });
})();
