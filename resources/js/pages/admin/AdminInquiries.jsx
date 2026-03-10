/**
 * AdminInquiries.jsx
 * File: resources/js/pages/admin/AdminInquiries.jsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const POLL_MS  = 30_000;
const PAGE_SIZE = 10;

const PLATFORMS = {
  gmail:     { label: "Gmail",     color: "bg-red-100 text-red-700",      dot: "bg-red-500"     },
  facebook:  { label: "Facebook",  color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500"    },
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700",    dot: "bg-pink-500"    },
  sms:       { label: "SMS",       color: "bg-green-100 text-green-700",  dot: "bg-green-500"   },
  viber:     { label: "Viber",     color: "bg-purple-100 text-purple-700",dot: "bg-purple-500"  },
  website:   { label: "Website",   color: "bg-gray-100 text-gray-700",    dot: "bg-gray-500"    },
};

const STATUS_META = {
  new:      { label: "New",      color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  replied:  { label: "Replied",  color: "bg-green-100 text-green-800",   dot: "bg-green-500"  },
  archived: { label: "Archived", color: "bg-gray-200 text-gray-700",     dot: "bg-gray-500"   },
};

function getToken() {
  return localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept:         "application/json",
      Authorization:  `Bearer ${getToken()}`,
      ...getAuthHeaders(),
    },
    credentials: "include",
    ...opts,
  });
  if (res.status === 401) { window.location.href = "/admin/login"; throw new Error("Unauthenticated"); }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const getInquiries = (p) => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([, v]) => v !== "" && v != null))).toString();
  return apiFetch(`/inquiries${qs ? "?" + qs : ""}`);
};
const getStats   = ()           => apiFetch("/inquiries/stats");
const putStatus  = (id, status) => apiFetch(`/inquiries/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
const delInquiry = (id)         => apiFetch(`/inquiries/${id}`, { method: "DELETE" });

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function PlatformBadge({ platform }) {
  const p = PLATFORMS[platform] || { label: platform, color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${p.color}`}>
      <span className={`w-2 h-2 rounded-full ${p.dot}`} />{p.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_META[status] || { label: status, color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}

export default function AdminInquiries() {
  const [inquiries, setInquiries]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteId, setDeleteId]     = useState(null);
  const [updating, setUpdating]     = useState(false);
  const [replyId, setReplyId]       = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replying, setReplying]     = useState(false);

  const [platform, setPlatform] = useState("");
  const [status, setStatus]     = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const pollRef   = useRef(null);
  const searchRef = useRef(null);

  const load = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const [data, statsData] = await Promise.all([
        getInquiries({ platform, status, search, page, per_page: PAGE_SIZE }),
        getStats(),
      ]);
      setInquiries(data.data);
      setPagination(data.meta);
      setStats(statsData);
    } catch (e) {
      if (e.message !== "Unauthenticated") setError("Could not load inquiries. Check your server connection.");
    } finally {
      setLoading(false);
    }
  }, [platform, status, search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    pollRef.current = setInterval(() => load(false), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(searchRef.current);
  }, [search]);

  async function handleStatusChange(id, newStatus) {
    try {
      setUpdating(true);
      const updated = await putStatus(id, newStatus);
      setInquiries(prev => prev.map(i => i.id === id ? updated : i));
      if (selected?.id === id) setSelected(updated);
      getStats().then(setStats).catch(() => {});
      showSuccess(`Marked as ${newStatus}`);
    } catch { setError("Failed to update status."); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id) {
    try {
      await delInquiry(id);
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
      getStats().then(setStats).catch(() => {});
      setDeleteId(null);
      showSuccess("Inquiry deleted");
    } catch { setError("Failed to delete inquiry."); }
  }

  async function handleReply(id) {
    try {
      setReplying(true);
      const res = await apiFetch(`/inquiries/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: replyMessage }),
      });
      setInquiries(prev => prev.map(i => i.id === id ? res.inquiry : i));
      if (selected?.id === id) setSelected(res.inquiry);
      getStats().then(setStats).catch(() => {});
      setReplyId(null);
      setReplyMessage("");
      showSuccess("Reply sent successfully!");
    } catch {
      setError("Failed to send reply. Check Gmail API credentials.");
    } finally {
      setReplying(false);
    }
  }

  function setFilter(key, value) {
    setPage(1); setSelected(null);
    if (key === "platform") setPlatform(value);
    if (key === "status")   setStatus(value);
  }

  function showSuccess(msg) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  const totalPages = pagination?.last_page || 1;

  if (loading && inquiries.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Loading Inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* SUCCESS TOAST */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Inquiry Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage messages from all platforms</p>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">{error}</span>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live · 30s
            </div>
            <button
              onClick={() => load(false)}
              className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all hover:shadow-md"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total",    value: stats?.total,    cls: "text-gray-900"   },
            { label: "New",      value: stats?.new,      cls: "text-yellow-600" },
            { label: "Replied",  value: stats?.replied,  cls: "text-green-600"  },
            { label: "Archived", value: stats?.archived, cls: "text-gray-500"   },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-600 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.value ?? "—"}</p>
            </div>
          ))}
        </motion.div>

        {/* FILTER BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3"
        >
          <input
            placeholder="Search by name, email, phone, or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
          />
          <select
            value={platform}
            onChange={e => setFilter("platform", e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white transition-all"
          >
            <option value="">All Platforms</option>
            {Object.entries(PLATFORMS).map(([id, p]) => (
              <option key={id} value={id}>{p.label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={e => setFilter("status", e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white transition-all"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          {(platform || status || search) && (
            <button
              onClick={() => { setPlatform(""); setStatus(""); setSearch(""); setPage(1); setSelected(null); }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </motion.div>

        {/* TABLE + DETAIL PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex gap-6 items-start"
        >
          {/* TABLE */}
          <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all ${selected ? "flex-1 min-w-0" : "w-full"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Sender</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">Message</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto" />
                    </td></tr>
                  ) : inquiries.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">No inquiries found</p>
                        <p className="text-sm mt-1">Messages from all platforms will appear here</p>
                      </div>
                    </td></tr>
                  ) : inquiries.map(item => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected?.id === item.id ? "bg-blue-50 hover:bg-blue-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                            {(item.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{item.name || "Unknown Sender"}</p>
                            {item.email && <p className="text-xs text-gray-500 mt-0.5">{item.email}</p>}
                            {item.phone && !item.email && <p className="text-xs text-gray-500 mt-0.5">{item.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><PlatformBadge platform={item.platform} /></td>
                      <td className="px-6 py-4 hidden md:table-cell max-w-xs">
                        <p className="text-sm text-gray-600 truncate">{item.message}</p>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">{timeAgo(item.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {item.email && (
                            <button onClick={() => { setReplyId(item.id); setReplyMessage(""); }} disabled={updating}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                              Reply
                            </button>
                          )}
                          {!item.email && item.status !== "replied" && (
                            <button onClick={() => handleStatusChange(item.id, "replied")} disabled={updating}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                              Reply
                            </button>
                          )}
                          {item.status !== "archived" && (
                            <button onClick={() => handleStatusChange(item.id, "archived")} disabled={updating}
                              className="px-3 py-1.5 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                              Archive
                            </button>
                          )}
                          {item.status === "archived" && (
                            <button onClick={() => handleStatusChange(item.id, "new")} disabled={updating}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                              Restore
                            </button>
                          )}
                          <button onClick={() => setDeleteId(item.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200">
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-6 px-6 border-t border-gray-200 bg-gray-50">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${page === i + 1 ? "bg-black text-white shadow-md" : "border border-gray-300 text-gray-700 hover:bg-white"}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            )}
          </div>

          {/* DETAIL PANEL */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="w-80 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-24"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <span className="font-semibold text-gray-900 text-sm">Inquiry Detail</span>
                  <button onClick={() => setSelected(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500">
                    ✕
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-600 shrink-0">
                      {(selected.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selected.name || "Unknown Sender"}</p>
                      <div className="mt-1"><PlatformBadge platform={selected.platform} /></div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selected.email && (
                      <div className="flex gap-2"><span className="text-gray-500 w-14 shrink-0">Email</span><span className="text-gray-900 break-all">{selected.email}</span></div>
                    )}
                    {selected.phone && (
                      <div className="flex gap-2"><span className="text-gray-500 w-14 shrink-0">Phone</span><span className="text-gray-900">{selected.phone}</span></div>
                    )}
                    <div className="flex gap-2"><span className="text-gray-500 w-14 shrink-0">Date</span><span className="text-gray-900">{new Date(selected.created_at).toLocaleString("en-PH")}</span></div>
                    <div className="flex gap-2"><span className="text-gray-500 w-14 shrink-0">Status</span><StatusBadge status={selected.status} /></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selected.message}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Update Status</p>
                    <div className="flex gap-2">
                      {["new", "replied", "archived"].map(s => (
                        <button key={s} onClick={() => handleStatusChange(selected.id, s)} disabled={updating || selected.status === s}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all disabled:opacity-50 ${selected.status === s ? "bg-black text-white shadow-md" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selected.email && (
                    <button onClick={() => { setReplyId(selected.id); setReplyMessage(""); }}
                      className="w-full py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      ✉ Send Email Reply
                    </button>
                  )}
                  <button onClick={() => setDeleteId(selected.id)}
                    className="w-full py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors">
                    Delete Inquiry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* REPLY MODAL */}
      <AnimatePresence>
        {replyId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setReplyId(null); setReplyMessage(""); }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-1">Send Reply</h3>
                <p className="text-gray-500 text-center text-sm mb-6">
                  Replying to: <span className="font-medium text-gray-700">{inquiries.find(i => i.id === replyId)?.email}</span>
                </p>
                <textarea
                  rows={6}
                  placeholder="Type your reply message here..."
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-all mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setReplyId(null); setReplyMessage(""); }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReply(replyId)}
                    disabled={replying || !replyMessage.trim()}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {replying ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <> ✉ Send Reply</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Delete Inquiry?</h3>
                <p className="text-gray-600 text-center mb-6">This inquiry will be permanently deleted and cannot be recovered.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(deleteId)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}