import React, { useState, useEffect, useCallback, useRef } from "react";
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

const PLATFORM_LABELS = {
    gmail: "Gmail",
    facebook: "Facebook",
    instagram: "Instagram",
    viber: "Viber",
    sms: "SMS",
    website: "Website",
};

const PLATFORM_COLORS = {
    gmail: "bg-red-50 text-red-600 border-red-100",
    facebook: "bg-blue-50 text-blue-600 border-blue-100",
    instagram: "bg-pink-50 text-pink-600 border-pink-100",
    viber: "bg-purple-50 text-purple-600 border-purple-100",
    sms: "bg-emerald-50 text-emerald-600 border-emerald-100",
    website: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

const STATUS_COLORS = {
    new: "bg-blue-50 text-blue-600 border-blue-100",
    replied: "bg-emerald-50 text-emerald-600 border-emerald-100",
    archived: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function canReply(inquiry) {
    if (["facebook", "instagram", "viber", "sms"].includes(inquiry.platform))
        return true;
    if (["gmail", "website"].includes(inquiry.platform) && inquiry.email)
        return true;
    return false;
}

export default function AdminInquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        platform: "",
        status: "",
    });
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [updating, setUpdating] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [replyId, setReplyId] = useState(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replying, setReplying] = useState(false);
    const [toast, setToast] = useState(null);

    const searchTimer = useRef(null);
    const pollTimer = useRef(null);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    const load = useCallback(
        async (p = 1, f = filters) => {
            try {
                setLoading(true);
                const params = new URLSearchParams({ page: p, per_page: 15 });
                if (f.platform) params.set("platform", f.platform);
                if (f.status) params.set("status", f.status);
                if (f.search) params.set("search", f.search);
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
        },
        [filters],
    );

    useEffect(() => {
        load(1, filters);
        pollTimer.current = setInterval(() => load(page, filters), 30000);
        return () => clearInterval(pollTimer.current);
    }, []); // eslint-disable-line

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
            const res = await apiFetch(`/inquiries/${id}`, {
                method: "PUT",
                body: JSON.stringify({ status }),
            });
            setInquiries((prev) => prev.map((i) => (i.id === id ? res : i)));
            if (selected?.id === id) setSelected(res);
            apiFetch("/inquiries/stats")
                .then(setStats)
                .catch(() => {});
            showToast(`Marked as ${status}`);
        } catch {
            setError("Failed to update.");
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete(id) {
        setUpdating(true);
        try {
            await apiFetch(`/inquiries/${id}`, { method: "DELETE" });
            setInquiries((prev) => prev.filter((i) => i.id !== id));
            if (selected?.id === id) setSelected(null);
            setDeleteId(null);
            apiFetch("/inquiries/stats")
                .then(setStats)
                .catch(() => {});
            showToast("Inquiry deleted.");
        } catch {
            setError("Failed to delete.");
        } finally {
            setUpdating(false);
        }
    }

    async function handleReply(id) {
        setReplying(true);
        try {
            const res = await apiFetch(`/inquiries/${id}/reply`, {
                method: "POST",
                body: JSON.stringify({ message: replyMsg }),
            });
            setInquiries((prev) =>
                prev.map((i) => (i.id === id ? res.inquiry : i)),
            );
            if (selected?.id === id) setSelected(res.inquiry);
            setReplyId(null);
            setReplyMsg("");
            apiFetch("/inquiries/stats")
                .then(setStats)
                .catch(() => {});
            showToast("Reply sent!");
        } catch {
            setError("Failed to send reply.");
        } finally {
            setReplying(false);
        }
    }

    const statCards = [
        {
            label: "Total Inquiries",
            value: stats.total ?? 0,
            icon: <InboxIcon className="w-5 h-5" />,
        },
        {
            label: "New Messages",
            value: stats.new ?? 0,
            icon: <SparklesIcon className="w-5 h-5" />,
        },
        {
            label: "Replied",
            value: stats.replied ?? 0,
            icon: <ReplyIcon className="w-5 h-5" />,
        },
        {
            label: "Archived",
            value: stats.archived ?? 0,
            icon: <ArchiveIcon className="w-5 h-5" />,
        },
    ];

    return (
        <div className="flex flex-col h-full gap-6 lg:gap-8 [font-family:var(--font-neue)]">
            {/* Header & Stats */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Manage all incoming communications across platforms.
                    </p>

                    <button
                        onClick={() => load(page, filters)}
                        className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm font-normal text-neutral-700 transition-all hover:bg-neutral-50 active:scale-95 cursor-pointer"
                    >
                        <RefreshIcon
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className="text-neutral-300">{s.icon}</div>
                            </div>
                            <p className="text-3xl font-black text-neutral-900 mt-2">
                                {s.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                        <SearchIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search messages, names, or emails..."
                        value={filters.search}
                        onChange={(e) => setFilter("search", e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                    />
                </div>

                <select
                    value={filters.platform}
                    onChange={(e) => setFilter("platform", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white min-w-[140px] appearance-none cursor-pointer"
                >
                    <option value="">All Platforms</option>
                    {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                            {v}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilter("status", e.target.value)}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white min-w-[140px] appearance-none cursor-pointer"
                >
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                </select>

                {(filters.search || filters.platform || filters.status) && (
                    <button
                        onClick={() => {
                            setFilters({
                                search: "",
                                platform: "",
                                status: "",
                            });
                            load(1, { search: "", platform: "", status: "" });
                        }}
                        className="rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm font-medium transition-all active:scale-95 cursor-pointer"
                    >
                        Clear
                    </button>
                )}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {error}
                </div>
            )}

            {/* Table & Detail Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Table Area */}
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 overflow-auto no-scrollbar">
                        {loading && inquiries.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                            </div>
                        ) : inquiries.length === 0 ? (
                            <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                                <InboxIcon className="w-12 h-12 text-neutral-300 mb-4" />
                                <p className="text-base font-bold text-neutral-900">
                                    No inquiries found
                                </p>
                                <p className="text-sm font-medium text-neutral-500 mt-1">
                                    Try adjusting your filters or check back
                                    later.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm shadow-neutral-100">
                                    <tr>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Sender
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Platform
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 hidden md:table-cell w-1/3">
                                            Message
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 text-right">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {inquiries.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() =>
                                                setSelected(
                                                    selected?.id === item.id
                                                        ? null
                                                        : item,
                                                )
                                            }
                                            className={`group cursor-pointer transition-colors hover:bg-neutral-50 ${
                                                selected?.id === item.id
                                                    ? "bg-neutral-50"
                                                    : ""
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">
                                                    {item.name || "Unknown"}
                                                </p>
                                                {item.email && (
                                                    <p className="text-xs font-medium text-neutral-500 truncate max-w-[150px] mt-0.5">
                                                        {item.email}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                        PLATFORM_COLORS[
                                                            item.platform
                                                        ] ??
                                                        "bg-neutral-50 text-neutral-600 border-neutral-200"
                                                    }`}
                                                >
                                                    {PLATFORM_LABELS[
                                                        item.platform
                                                    ] ?? item.platform}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <p className="text-sm font-medium text-neutral-600 truncate max-w-[250px] xl:max-w-[350px]">
                                                    {item.message}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                        STATUS_COLORS[
                                                            item.status
                                                        ] ?? ""
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <p className="text-xs font-medium text-neutral-500">
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                        },
                                                    )}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200 bg-neutral-50/50">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Page {meta.current_page} of {meta.last_page}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={meta.current_page === 1}
                                    onClick={() => {
                                        setPage((p) => p - 1);
                                        load(page - 1, filters);
                                    }}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={
                                        meta.current_page === meta.last_page
                                    }
                                    onClick={() => {
                                        setPage((p) => p + 1);
                                        load(page + 1, filters);
                                    }}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Animated Detail Panel */}
                <AnimatePresence>
                    {selected && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: "320px" }}
                            exit={{ opacity: 0, x: 20, width: 0 }}
                            transition={{
                                type: "spring",
                                bounce: 0,
                                duration: 0.4,
                            }}
                            className="flex-shrink-0"
                        >
                            <div className="w-[320px] h-full bg-white rounded-2xl border border-neutral-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
                                {/* Panel Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">
                                        Details
                                    </h3>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="text-neutral-400 hover:text-black transition-colors outline-none"
                                    >
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Panel Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">
                                            Sender
                                        </p>
                                        <p className="text-base font-black text-neutral-900">
                                            {selected.name || "Unknown"}
                                        </p>
                                        {selected.email && (
                                            <p className="text-sm font-medium text-neutral-600 mt-1">
                                                {selected.email}
                                            </p>
                                        )}
                                        {selected.phone && (
                                            <p className="text-sm font-medium text-neutral-600 mt-1">
                                                {selected.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Platform
                                            </p>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${PLATFORM_COLORS[selected.platform]}`}
                                            >
                                                {
                                                    PLATFORM_LABELS[
                                                        selected.platform
                                                    ]
                                                }
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Status
                                            </p>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[selected.status]}`}
                                            >
                                                {selected.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Received At
                                        </p>
                                        <p className="text-sm font-medium text-neutral-700">
                                            {new Date(
                                                selected.created_at,
                                            ).toLocaleString(undefined, {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Message
                                        </p>
                                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                                            <p className="text-sm font-medium text-neutral-800 leading-relaxed whitespace-pre-wrap">
                                                {selected.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Actions */}
                                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2">
                                    {canReply(selected) && (
                                        <button
                                            onClick={() => {
                                                setReplyId(selected.id);
                                                setReplyMsg("");
                                            }}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-neutral-800 active:scale-[0.98]"
                                        >
                                            <ReplyIcon className="w-4 h-4" />
                                            Reply
                                        </button>
                                    )}

                                    <div className="flex gap-2">
                                        {selected.status !== "archived" ? (
                                            <button
                                                onClick={() =>
                                                    handleStatus(
                                                        selected.id,
                                                        "archived",
                                                    )
                                                }
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 disabled:opacity-50"
                                            >
                                                <ArchiveIcon className="w-4 h-4" />
                                                Archive
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleStatus(
                                                        selected.id,
                                                        "new",
                                                    )
                                                }
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 disabled:opacity-50"
                                            >
                                                <RestoreIcon className="w-4 h-4" />
                                                Restore
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                setDeleteId(selected.id)
                                            }
                                            className="flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 transition-all hover:bg-red-100"
                                            title="Delete Inquiry"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {replyId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => {
                                setReplyId(null);
                                setReplyMsg("");
                            }}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl pointer-events-auto border border-neutral-100"
                            >
                                <h3 className="text-xl font-black text-neutral-900 mb-1">
                                    Compose Reply
                                </h3>
                                {(() => {
                                    const inq = inquiries.find(
                                        (i) => i.id === replyId,
                                    );
                                    const via = {
                                        gmail: "Gmail",
                                        facebook: "Facebook Messenger",
                                        instagram: "Instagram DM",
                                        viber: "Viber",
                                        sms: "SMS",
                                        website: "Email",
                                    };
                                    return (
                                        <p className="text-xs font-bold tracking-wider text-neutral-400 uppercase mb-6">
                                            Replying via {via[inq?.platform]}{" "}
                                            {inq?.email
                                                ? `to ${inq.email}`
                                                : inq?.name
                                                  ? `to ${inq.name}`
                                                  : ""}
                                        </p>
                                    );
                                })()}

                                <textarea
                                    rows={5}
                                    placeholder="Type your message here..."
                                    value={replyMsg}
                                    onChange={(e) =>
                                        setReplyMsg(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white resize-none mb-6"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setReplyId(null);
                                            setReplyMsg("");
                                        }}
                                        className="flex-1 rounded-xl border border-neutral-200/80 bg-white px-4 py-3.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleReply(replyId)}
                                        disabled={replying || !replyMsg.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0A0A0A] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-neutral-800 hover:shadow-black/40 disabled:opacity-50"
                                    >
                                        {replying ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            "Send Reply"
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {deleteId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setDeleteId(null)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl pointer-events-auto border border-neutral-100 text-center"
                            >
                                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                    <TrashIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">
                                    Delete Inquiry?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    This action cannot be undone and will
                                    permanently remove this message.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => handleDelete(deleteId)}
                                        disabled={updating}
                                        className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {updating
                                            ? "Deleting..."
                                            : "Yes, delete it"}
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 pointer-events-none"
                    >
                        <div
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-black/10 border ${
                                toast.type === "success"
                                    ? "bg-neutral-900 text-white border-neutral-800"
                                    : "bg-red-600 text-white border-red-700"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="w-5 h-5" />
                            ) : (
                                <CloseIcon className="w-5 h-5" />
                            )}
                            <p className="text-sm font-bold tracking-wide">
                                {toast.msg}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Minimal UI Icons
// ============================================================================

function SparklesIcon({ className = "w-4 h-4" }) {
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
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    );
}

function RefreshIcon({ className = "w-4 h-4" }) {
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
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    );
}

function SearchIcon({ className = "w-4 h-4" }) {
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
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

function InboxIcon({ className = "w-4 h-4" }) {
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
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
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

function ReplyIcon({ className = "w-4 h-4" }) {
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
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
    );
}

function ArchiveIcon({ className = "w-4 h-4" }) {
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
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    );
}

function RestoreIcon({ className = "w-4 h-4" }) {
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
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

function TrashIcon({ className = "w-4 h-4" }) {
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}

function CheckIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
