import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

const springTransition = { type: "spring", damping: 25, stiffness: 300 };

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function StatusBadge({ connected, expired }) {
    if (expired)
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-200 bg-amber-50 text-amber-700">
                Token Expired
            </span>
        );
    if (connected)
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Connected
            </span>
        );
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-neutral-200 bg-neutral-50 text-neutral-500">
            Not Connected
        </span>
    );
}

function PlatformCard({
    title,
    description,
    icon,
    brandBg,
    connected,
    expired,
    connectedInfo,
    children,
    onDisconnect,
    disconnecting,
}) {
    return (
        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 relative overflow-hidden transition-all h-full">
            <div className="flex items-start justify-between mb-6">
                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${brandBg}`}
                >
                    {icon}
                </div>
                <StatusBadge connected={connected} expired={expired} />
            </div>

            <div className="flex-1 mb-8">
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                    {title}
                </h3>
                <p className="text-[13px] font-medium text-neutral-500 mt-1.5 leading-relaxed">
                    {description}
                </p>

                {connected && connectedInfo ? (
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                        {connectedInfo}
                    </div>
                ) : (
                    !connected && (
                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-100">
                            No account linked
                        </div>
                    )
                )}
            </div>

            <div className="space-y-3 mt-auto">
                {children}
                {connected && onDisconnect && (
                    <div className="pt-4 border-t border-neutral-100 mt-6">
                        <button
                            onClick={onDisconnect}
                            disabled={disconnecting}
                            className="w-full py-3.5 border border-neutral-200 text-neutral-600 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {disconnecting
                                ? "Disconnecting..."
                                : "Disconnect Platform"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function AdminPlatformSettings() {
    const [gmail, setGmail] = useState(null);
    const [facebook, setFacebook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState({});
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const messages = {
            google: {
                success: "Gmail connected!",
                denied: "Google login cancelled.",
                error: "Gmail connection failed.",
                no_refresh_token: "No refresh token. Try again.",
            },
            facebook: {
                success: "Meta services connected!",
                denied: "Facebook login cancelled.",
                error: "Facebook connection failed.",
                no_page: "No Facebook Page found.",
            },
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
        const [g, f] = await Promise.allSettled([
            apiFetch("/admin/google/status"),
            apiFetch("/admin/facebook/status"),
        ]);
        if (g.status === "fulfilled") setGmail(g.value);
        if (f.status === "fulfilled") setFacebook(f.value);
        setLoading(false);
    }

    function setWork(key, val) {
        setWorking((w) => ({ ...w, [key]: val }));
    }

    function showToast(message, type = "success") {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }

    async function connectGmail() {
        setWork("gmail", true);
        try {
            const d = await apiFetch("/admin/google/auth-url");
            window.location.href = d.url;
        } catch {
            showToast("Failed to get Google auth URL.", "error");
            setWork("gmail", false);
        }
    }

    async function disconnectGmail() {
        setWork("gmailDc", true);
        try {
            await apiFetch("/admin/google/disconnect", { method: "DELETE" });
            showToast("Gmail disconnected.");
            loadAll();
        } catch {
            showToast("Failed to disconnect Gmail.", "error");
        } finally {
            setWork("gmailDc", false);
        }
    }

    async function connectFacebook() {
        setWork("facebook", true);
        try {
            const d = await apiFetch("/admin/facebook/auth-url");
            window.location.href = d.url;
        } catch {
            showToast("Failed to get Facebook auth URL.", "error");
            setWork("facebook", false);
        }
    }

    async function disconnectFacebook() {
        if (!window.confirm("This will also disconnect Instagram. Continue?"))
            return;
        setWork("facebookDc", true);
        try {
            await apiFetch("/admin/facebook/disconnect", { method: "DELETE" });
            showToast("Facebook & Instagram disconnected.");
            loadAll();
        } catch {
            showToast("Failed to disconnect.", "error");
        } finally {
            setWork("facebookDc", false);
        }
    }

    if (loading)
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Syncing Platforms
                </p>
            </div>
        );

    // Calculate Summary Stats
    const activeConnections = [
        gmail?.connected,
        facebook?.facebook?.connected,
        facebook?.instagram?.connected,
    ].filter(Boolean).length;

    const requiresAttention = [
        facebook?.facebook?.expired,
        facebook?.facebook?.connected && !facebook?.instagram?.connected,
    ].filter(Boolean).length;

    return (
        <div className="w-full flex flex-col [font-family:var(--font-neue)] relative pb-20">
            {/* Header & Actions */}
            <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-neutral-500">
                        Manage API integrations to automate your workflow.
                    </p>
                </div>
                <button
                    onClick={loadAll}
                    className="h-10 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer shrink-0"
                >
                    <RefreshIcon
                        className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`}
                    />
                    Refresh Status
                </button>
            </div>

            {/* Quick Stats - Fills the empty space beautifully */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px]">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                            Active Integrations
                        </p>
                        <div className="text-emerald-500">
                            <LinkIcon />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-neutral-900 mt-2">
                        {activeConnections}{" "}
                        <span className="text-lg text-neutral-400 font-medium">
                            / 3
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px]">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                            Needs Attention
                        </p>
                        <div
                            className={`${requiresAttention > 0 ? "text-amber-500" : "text-black"}`}
                        >
                            <AlertCircleIcon />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-neutral-900 mt-2">
                        {requiresAttention}
                    </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px]">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                            Available Platforms
                        </p>
                        <div className="text-black">
                            <LayersIcon />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-neutral-900 mt-2">
                        3
                    </p>
                </div>
            </div>

            {/* Grid Layout replacing the narrow column */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {/* Gmail */}
                <PlatformCard
                    title="Google Gmail"
                    description="Sync your Google Workspace account to automatically route and manage email inquiries directly from this dashboard."
                    icon={<MailIcon />}
                    brandBg="bg-[#EA4335]/10"
                    connected={gmail?.connected}
                    expired={false}
                    connectedInfo={
                        gmail?.connected_at
                            ? `Linked: ${gmail.connected_at}`
                            : null
                    }
                    onDisconnect={disconnectGmail}
                    disconnecting={working.gmailDc}
                >
                    {!gmail?.connected && (
                        <button
                            onClick={connectGmail}
                            disabled={working.gmail}
                            className="w-full py-3.5 bg-[#EA4335] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#d93025] transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                        >
                            {working.gmail ? <Spinner /> : "Connect Google"}
                        </button>
                    )}
                    {gmail?.connected && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50 rounded-xl px-4 py-4 border border-neutral-100 text-center">
                            Watch Status:{" "}
                            {gmail.watch_active ? (
                                <span className="text-emerald-600 block mt-1">
                                    Active (Expires {gmail.watch_expiry})
                                </span>
                            ) : (
                                <span className="text-amber-600 block mt-1">
                                    Expired — Reconnect to renew
                                </span>
                            )}
                        </div>
                    )}
                </PlatformCard>

                {/* Facebook */}
                <PlatformCard
                    title="Facebook Messenger"
                    description="Link your official Facebook Page to pull incoming Messenger chats into your unified inbox for faster response times."
                    icon={<FbIcon />}
                    brandBg="bg-[#1877F2]/10"
                    connected={facebook?.facebook?.connected}
                    expired={facebook?.facebook?.expired}
                    connectedInfo={
                        facebook?.facebook?.page_name
                            ? `Page: ${facebook.facebook.page_name}`
                            : null
                    }
                    onDisconnect={disconnectFacebook}
                    disconnecting={working.facebookDc}
                >
                    {!facebook?.facebook?.connected && (
                        <button
                            onClick={connectFacebook}
                            disabled={working.facebook}
                            className="w-full py-3.5 bg-[#1877F2] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#166fe5] transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                        >
                            {working.facebook ? (
                                <Spinner />
                            ) : (
                                "Connect Facebook"
                            )}
                        </button>
                    )}
                    {facebook?.facebook?.expired && (
                        <button
                            onClick={connectFacebook}
                            disabled={working.facebook}
                            className="w-full py-3.5 bg-amber-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            Refresh Credentials
                        </button>
                    )}
                </PlatformCard>

                {/* Instagram */}
                <PlatformCard
                    title="Instagram DMs"
                    description="Connect your Instagram Professional account via Meta Business Suite to handle direct messages in one place."
                    icon={<IgIcon />}
                    brandBg="bg-[#E4405F]/10"
                    connected={facebook?.instagram?.connected}
                    expired={false}
                    connectedInfo={
                        facebook?.instagram?.connected
                            ? "Synced via Meta Suite"
                            : null
                    }
                >
                    {!facebook?.facebook?.connected && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 rounded-xl px-4 py-3.5 text-center border border-dashed border-neutral-200">
                            Dependency: Connect Facebook first
                        </div>
                    )}
                    {facebook?.facebook?.connected &&
                        !facebook?.instagram?.connected && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 rounded-xl px-4 py-4 text-center border border-amber-100">
                                Action Required: <br /> No IG Business account
                                found on linked Page.
                            </div>
                        )}
                </PlatformCard>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast-alert"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={springTransition}
                        className="fixed bottom-10 right-10 z-[110] pointer-events-none [font-family:var(--font-neue)]"
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${
                                toast.type === "success"
                                    ? "bg-black text-white border-black"
                                    : "bg-red-600 text-white border-red-700"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <CloseIcon className="w-4 h-4 text-white" />
                            )}
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5">
                                {toast.message}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function Spinner() {
    return (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    );
}

function MailIcon() {
    return (
        <svg
            className="w-6 h-6 text-[#EA4335]"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
        </svg>
    );
}

function FbIcon() {
    return (
        <svg
            className="w-6 h-6 text-[#1877F2]"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function IgIcon() {
    return (
        <svg
            className="w-6 h-6 text-[#E4405F]"
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
    );
}

function CheckIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function CloseIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function RefreshIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    );
}

function LinkIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );
}

function AlertCircleIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}

function LayersIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 12 12 17 22 12" />
            <polyline points="2 17 12 22 22 17" />
        </svg>
    );
}
