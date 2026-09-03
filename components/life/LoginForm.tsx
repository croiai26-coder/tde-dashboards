"use client";

import { useEffect, useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Match whatever theme the app itself is set to.
  useEffect(() => {
    const saved = localStorage.getItem("life_os_theme");
    const t = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/life/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json?.ok) {
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = next && next.startsWith("/") ? next : "/life";
        return;
      }
      setError(json?.error ?? "That didn't work.");
    } catch {
      setError("Couldn't reach the server.");
    }
    setBusy(false);
  };

  return (
    <div className="wrap" style={{ maxWidth: 380, paddingTop: "18vh" }}>
      <div className="greet" style={{ marginBottom: 6 }}>Life OS</div>
      <div className="subgreet" style={{ marginBottom: 22 }}>
        This one&rsquo;s private.
      </div>
      <form onSubmit={submit}>
        <div className="capture" style={{ paddingLeft: 15 }}>
          <span className="capture-dot" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            id="capture-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="capture-actions">
            <button className="add-btn" type="submit" disabled={busy}>
              {busy ? "…" : "Enter"}
            </button>
          </div>
        </div>
      </form>
      {error && (
        <div className="notice" style={{ marginTop: 14 }}>{error}</div>
      )}
      <div className="capture-hint" style={{ marginTop: 18, display: "flex" }}>
        <span>Your items stay in this browser. The password guards what the server fetches for you — your calendar, Notion and business boards.</span>
      </div>
    </div>
  );
}
