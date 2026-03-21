import React, { useState, useEffect, useCallback, useRef } from "react";

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

const PLATFORM_LABELS = {
  gmail: "Gmail", facebook: "Facebook", instagram: "Instagram",
  viber: "Viber", sms: "SMS", website: "Website",
};

const PLATFORM_COLORS = {
  gmail: "bg-red-100 text-red-700", facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700", viber: "bg-purple-100 text-purple-700",
  sms: "bg-green-100 text-green-700", website: "bg-neutral-100 text-neutral-700",
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  replied: "bg-green-100 text-green-700",
  archived: "bg-neutral-100 text-neutral-500",
};

function canReply(inquiry) {
  if (["facebook","instagram","viber","sms"].includes(inquiry.platform)) return true;
  if (["gmail","website"].includes(inquiry.platform) && inquiry.email) return true;
  return false;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [filters,   setFilters]   = useState({ search: "", platform: "", status: "" });
  const [page,      setPage]      = useState(1);
  const [meta,      setMeta]      = useState({});
  const [updating,  setUpdating]  = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const [replyId,   setReplyId]   = useState(null);
  const [replyMsg,  setReplyMsg]  = useState("");
  const [replying,  setReplying]  = useState(false);
  const [toast,     setToast]     = useState(null);
  const searchTimer = useRef(null);
  const pollTimer   = useRef(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async (p = 1, f = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: p, per_page: 15 });
      if (f.platform) params.set("platform", f.platform);
      if (f.status)   params.set("status",   f.status);
      if (f.search)   params.set("search",   f.search);
      const [data, statsData] = await Promise.all([
        apiFetch(`/inquiries?${params}`),
        apiFetch("/inquiries/stats"),
      ]);
      setInquiries(data.data);
      setMeta(data);
      setStats(statsData);
      setError(null);
    } catch (e) {
      setError("Failed to load inquiries.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load(1, filters);
    pollTimer.current = setInterval(() => load(page, filters), 30000);
    return () => clearInterval(pollTimer.current);
  }, []);

  function setFilter(key, val) {
    const f = { ...filters, [key]: val };
    setFilters(f);
    setPage(1);
    if (key === "search") {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => load(1, f), 400);
    } else {
      load(1, f);
    }
  }

  async function handleStatus(id, status) {
    setUpdating(true);
    try {
      const res = await apiFetch(`/inquiries/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setInquiries(prev => prev.map(i => i.id === id ? res : i));
      if (selected?.id === id) setSelected(res);
      apiFetch("/inquiries/stats").then(setStats).catch(() => {});
      showToast(`Marked as ${status}`);
    } catch { setError("Failed to update."); }
    finally { setUpdating(false); }
  }

  async function handleDelete(id) {
    setUpdating(true);
    try {
      await apiFetch(`/inquiries/${id}`, { method: "DELETE" });
      setInquiries(prev => prev.filter(i => i.id !== id));
      if (selected?.id === id) setSelected(null);
      setDeleteId(null);
      apiFetch("/inquiries/stats").then(setStats).catch(() => {});
      showToast("Inquiry deleted.");
    } catch { setError("Failed to delete."); }
    finally { setUpdating(false); }
  }

  async function handleReply(id) {
    setReplying(true);
    try {
      const res = await apiFetch(`/inquiries/${id}/reply`, { method: "POST", body: JSON.stringify({ message: replyMsg }) });
      setInquiries(prev => prev.map(i => i.id === id ? res.inquiry : i));
      if (selected?.id === id) setSelected(res.inquiry);
      setReplyId(null);
      setReplyMsg("");
      apiFetch("/inquiries/stats").then(setStats).catch(() => {});
      showToast("Reply sent!");
    } catch { setError("Failed to send reply."); }
    finally { setReplying(false); }
  }

  const statCards = [
    { label: "Total",    value: stats.total    ?? 0 },
    { label: "New",      value: stats.new      ?? 0 },
    { label: "Replied",  value: stats.replied  ?? 0 },
    { label: "Archived", value: stats.archived ?? 0 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Inquiries</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage all incoming inquiries across platforms</p>
        </div>
        <button onClick={() => load(page, filters)}
          className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition">
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">{s.label}</p>
            <p className="text-2xl font-semibold text-neutral-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search..." value={filters.search}
          onChange={e => setFilter("search", e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-neutral-400" />
        <select value={filters.platform} onChange={e => setFilter("platform", e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-neutral-400">
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilter("status", e.target.value)}
          className="px-3 py-2 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-neutral-400">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        {(filters.search || filters.platform || filters.status) && (
          <button onClick={() => { setFilters({ search: "", platform: "", status: "" }); load(1, { search: "", platform: "", status: "" }); }}
            className="px-3 py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition">
            Clear
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {/* Table + Detail Panel */}
      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <p className="text-sm">No inquiries found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Sender</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 hidden md:table-cell">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {inquiries.map(item => (
                  <tr key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)}
                    className={`cursor-pointer hover:bg-neutral-50 transition ${selected?.id === item.id ? "bg-neutral-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-900 truncate max-w-[120px]">{item.name || "Unknown"}</p>
                      {item.email && <p className="text-xs text-neutral-500 truncate max-w-[120px]">{item.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[item.platform] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {PLATFORM_LABELS[item.platform] ?? item.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-neutral-600 truncate max-w-[200px]">{item.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[item.status] ?? ""}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1.5 flex-wrap">
                        {canReply(item) && (
                          <button onClick={() => { setReplyId(item.id); setReplyMsg(""); }} disabled={updating}
                            className="px-2.5 py-1 bg-neutral-900 text-white text-xs rounded hover:bg-neutral-800 transition disabled:opacity-50">
                            Reply
                          </button>
                        )}
                        {item.status !== "archived" && (
                          <button onClick={() => handleStatus(item.id, "archived")} disabled={updating}
                            className="px-2.5 py-1 border border-neutral-200 text-neutral-600 text-xs rounded hover:bg-neutral-50 transition disabled:opacity-50">
                            Archive
                          </button>
                        )}
                        {item.status === "archived" && (
                          <button onClick={() => handleStatus(item.id, "new")} disabled={updating}
                            className="px-2.5 py-1 border border-neutral-200 text-neutral-600 text-xs rounded hover:bg-neutral-50 transition disabled:opacity-50">
                            Restore
                          </button>
                        )}
                        <button onClick={() => setDeleteId(item.id)} disabled={updating}
                          className="px-2.5 py-1 border border-red-200 text-red-600 text-xs rounded hover:bg-red-50 transition disabled:opacity-50">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <p className="text-xs text-neutral-500">Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-1">
                <button disabled={meta.current_page === 1} onClick={() => { setPage(p => p - 1); load(page - 1, filters); }}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-600 text-xs rounded hover:bg-neutral-50 disabled:opacity-40">
                  Previous
                </button>
                <button disabled={meta.current_page === meta.last_page} onClick={() => { setPage(p => p + 1); load(page + 1, filters); }}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-600 text-xs rounded hover:bg-neutral-50 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 bg-white rounded-lg border border-neutral-200 p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Inquiry Details</h3>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-600 text-lg leading-none">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500">Sender</p>
                <p className="text-sm font-medium text-neutral-900">{selected.name || "Unknown"}</p>
                {selected.email && <p className="text-xs text-neutral-500">{selected.email}</p>}
                {selected.phone && <p className="text-xs text-neutral-500">{selected.phone}</p>}
              </div>
              <div>
                <p className="text-xs text-neutral-500">Platform</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[selected.platform]}`}>
                  {PLATFORM_LABELS[selected.platform]}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Status</p>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Message</p>
                <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Received</p>
                <p className="text-xs text-neutral-700">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              {canReply(selected) && (
                <button onClick={() => { setReplyId(selected.id); setReplyMsg(""); }}
                  className="w-full py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition">
                  Reply
                </button>
              )}
              {selected.status !== "archived" && (
                <button onClick={() => handleStatus(selected.id, "archived")} disabled={updating}
                  className="w-full py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition disabled:opacity-50">
                  Archive
                </button>
              )}
              {selected.status === "archived" && (
                <button onClick={() => handleStatus(selected.id, "new")} disabled={updating}
                  className="w-full py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition disabled:opacity-50">
                  Restore
                </button>
              )}
              <button onClick={() => setDeleteId(selected.id)}
                className="w-full py-2 border border-red-200 text-red-600 text-sm rounded-md hover:bg-red-50 transition">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setReplyId(null); setReplyMsg(""); }} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Send Reply</h3>
              {(() => {
                const inq = inquiries.find(i => i.id === replyId);
                const via = { gmail: "Gmail", facebook: "Facebook Messenger", instagram: "Instagram DM", viber: "Viber", sms: "SMS", website: "Email" };
                return <p className="text-xs text-neutral-500 mb-4">Sending via {via[inq?.platform]} {inq?.email ? `→ ${inq.email}` : inq?.name ? `→ ${inq.name}` : ""}</p>;
              })()}
              <textarea rows={5} placeholder="Type your reply..."
                value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-neutral-400 resize-none mb-4" />
              <div className="flex gap-2">
                <button onClick={() => { setReplyId(null); setReplyMsg(""); }}
                  className="flex-1 py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition">
                  Cancel
                </button>
                <button onClick={() => handleReply(replyId)} disabled={replying || !replyMsg.trim()}
                  className="flex-1 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {replying ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Delete Inquiry</h3>
              <p className="text-sm text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2 border border-neutral-200 text-neutral-600 text-sm rounded-md hover:bg-neutral-50 transition">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)} disabled={updating}
                  className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition disabled:opacity-50">
                  {updating ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${toast.type === "success" ? "bg-neutral-900" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}