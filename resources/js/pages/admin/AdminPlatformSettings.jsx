import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
  return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function StatusBadge({ connected, expired }) {
  if (expired)   return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Token Expired</span>;
  if (connected) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">● Connected</span>;
  return              <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500">○ Not Connected</span>;
}

function PlatformCard({ title, icon, connected, expired, connectedInfo, children, onDisconnect, disconnecting }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${connected ? 'bg-green-50' : 'bg-neutral-50'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            <StatusBadge connected={connected} expired={expired} />
          </div>
          {connected && connectedInfo && (
            <p className="text-xs text-neutral-500 mt-0.5">{connectedInfo}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {children}
        {connected && onDisconnect && (
          <button onClick={onDisconnect} disabled={disconnecting}
            className="w-full py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition disabled:opacity-50">
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPlatformSettings() {
  const [gmail,    setGmail]    = useState(null);
  const [facebook, setFacebook] = useState(null);
  const [viber,    setViber]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [working,  setWorking]  = useState({});
  const [viberToken, setViberToken] = useState("");
  const [viberError, setViberError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const messages = {
      google:   { success: "Gmail connected!", denied: "Google login cancelled.", error: "Gmail connection failed.", no_refresh_token: "No refresh token. Try again." },
      facebook: { success: "Facebook & Instagram connected!", denied: "Facebook login cancelled.", error: "Facebook connection failed.", no_page: "No Facebook Page found." },
    };
    for (const [platform, msgs] of Object.entries(messages)) {
      const val = params.get(platform);
      if (val && msgs[val]) {
        showToast(msgs[val], val === "success" ? "success" : "error");
        window.history.replaceState({}, "", window.location.pathname);
        break;
      }
    }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [g, f, v] = await Promise.allSettled([
      apiFetch("/admin/google/status"),
      apiFetch("/admin/facebook/status"),
      apiFetch("/admin/viber/status"),
    ]);
    if (g.status === "fulfilled") setGmail(g.value);
    if (f.status === "fulfilled") setFacebook(f.value);
    if (v.status === "fulfilled") setViber(v.value);
    setLoading(false);
  }

  function setWork(key, val) { setWorking(w => ({ ...w, [key]: val })); }
  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function connectGmail() {
    setWork("gmail", true);
    try { const d = await apiFetch("/admin/google/auth-url"); window.location.href = d.url; }
    catch { showToast("Failed to get Google auth URL.", "error"); setWork("gmail", false); }
  }

  async function disconnectGmail() {
    setWork("gmailDc", true);
    try { await apiFetch("/admin/google/disconnect", { method: "DELETE" }); showToast("Gmail disconnected."); loadAll(); }
    catch { showToast("Failed to disconnect Gmail.", "error"); }
    finally { setWork("gmailDc", false); }
  }

  async function connectFacebook() {
    setWork("facebook", true);
    try { const d = await apiFetch("/admin/facebook/auth-url"); window.location.href = d.url; }
    catch { showToast("Failed to get Facebook auth URL.", "error"); setWork("facebook", false); }
  }

  async function disconnectFacebook() {
    if (!confirm("This will also disconnect Instagram. Continue?")) return;
    setWork("facebookDc", true);
    try { await apiFetch("/admin/facebook/disconnect", { method: "DELETE" }); showToast("Facebook & Instagram disconnected."); loadAll(); }
    catch { showToast("Failed to disconnect.", "error"); }
    finally { setWork("facebookDc", false); }
  }

  async function connectViber() {
    if (!viberToken.trim()) { setViberError("Please enter your Viber bot token."); return; }
    setViberError("");
    setWork("viber", true);
    try {
      await apiFetch("/admin/viber/connect", { method: "POST", body: JSON.stringify({ token: viberToken.trim() }) });
      setViberToken("");
      showToast("Viber connected!");
      loadAll();
    } catch { setViberError("Invalid token. Check your Viber bot token."); }
    finally { setWork("viber", false); }
  }

  async function disconnectViber() {
    setWork("viberDc", true);
    try { await apiFetch("/admin/viber/disconnect", { method: "DELETE" }); showToast("Viber disconnected."); loadAll(); }
    catch { showToast("Failed to disconnect.", "error"); }
    finally { setWork("viberDc", false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-900">Platform Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Connect your accounts to receive and reply to inquiries.</p>
      </div>

      {/* Gmail */}
      <PlatformCard title="Gmail" icon={<MailIcon />}
        connected={gmail?.connected} expired={false}
        connectedInfo={gmail?.connected_at ? `Connected ${gmail.connected_at}` : null}
        onDisconnect={disconnectGmail} disconnecting={working.gmailDc}>
        {!gmail?.connected && (
          <button onClick={connectGmail} disabled={working.gmail}
            className="w-full py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {working.gmail ? <Spinner /> : "Sign in with Google"}
          </button>
        )}
        {gmail?.connected && (
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded px-3 py-2">
            Inbox watch {gmail.watch_active ? `active — expires ${gmail.watch_expiry}` : "expired — reconnect to renew"}
          </div>
        )}
      </PlatformCard>

      {/* Facebook */}
      <PlatformCard title="Facebook Messenger" icon={<FbIcon />}
        connected={facebook?.facebook?.connected} expired={facebook?.facebook?.expired}
        connectedInfo={facebook?.facebook?.page_name ? `Page: ${facebook.facebook.page_name}` : null}
        onDisconnect={disconnectFacebook} disconnecting={working.facebookDc}>
        {!facebook?.facebook?.connected && (
          <button onClick={connectFacebook} disabled={working.facebook}
            className="w-full py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {working.facebook ? <Spinner /> : "Sign in with Facebook"}
          </button>
        )}
        {facebook?.facebook?.expired && (
          <button onClick={connectFacebook} disabled={working.facebook}
            className="w-full py-2 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition disabled:opacity-50">
            Reconnect Facebook
          </button>
        )}
      </PlatformCard>

      {/* Instagram */}
      <PlatformCard title="Instagram DMs" icon={<IgIcon />}
        connected={facebook?.instagram?.connected} expired={false}
        connectedInfo={facebook?.instagram?.connected ? "Connected via Facebook Page" : null}>
        {!facebook?.facebook?.connected && (
          <div className="text-xs text-neutral-500 bg-neutral-50 rounded px-3 py-2 text-center">
            Connect Facebook first — Instagram uses the same login
          </div>
        )}
        {facebook?.facebook?.connected && !facebook?.instagram?.connected && (
          <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-3 py-2">
            No Instagram Business account linked to your Facebook Page.
          </div>
        )}
      </PlatformCard>

      {/* Viber */}
      <PlatformCard title="Viber" icon={<ViberIcon />}
        connected={viber?.connected} expired={viber?.expired}
        connectedInfo={viber?.bot_name ? `Bot: ${viber.bot_name}` : null}
        onDisconnect={disconnectViber} disconnecting={working.viberDc}>
        {!viber?.connected && (
          <>
            <p className="text-xs text-neutral-500">
              Get your token at <a href="https://partners.viber.com" target="_blank" rel="noopener noreferrer" className="underline">partners.viber.com</a> → Create Bot → copy Authentication Token
            </p>
            <div className="flex gap-2">
              <input type="text" placeholder="Paste Viber bot token..."
                value={viberToken} onChange={e => { setViberToken(e.target.value); setViberError(""); }}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-neutral-400" />
              <button onClick={connectViber} disabled={working.viber || !viberToken.trim()}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition disabled:opacity-50">
                {working.viber ? "Saving..." : "Connect"}
              </button>
            </div>
            {viberError && <p className="text-xs text-red-600">{viberError}</p>}
          </>
        )}
      </PlatformCard>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${toast.type === "success" ? "bg-neutral-900" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Spinner() { return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />; }
function MailIcon() { return <svg className="w-6 h-6 text-neutral-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>; }
function FbIcon() { return <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>; }
function IgIcon() { return <svg className="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>; }
function ViberIcon() { return <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.03 4.447.35 7.35.278 10.532c-.073 3.18-.146 9.138 5.591 10.752h.005l-.005 2.467s-.038.999.623 1.202c.795.247 1.262-.512 2.022-1.328.418-.452.995-1.113 1.43-1.616 3.942.332 6.97-.427 7.32-.538.797-.26 5.303-.835 6.038-6.808.759-6.157-.368-10.048-2.997-11.799l-.001-.001c-.756-.5-3.101-1.458-8.906-1.861z"/></svg>; }