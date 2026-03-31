import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 6;

export default function AdminBookingConsultations() {
    const [consultations, setConsultations] = useState([]); // backend will fill later
    const [activeTab, setActiveTab] = useState("published");
    const [page, setPage] = useState(1);
    const [archiveId, setArchiveId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);

    // Action menu dropdown state for individual rows
    const [openMenuId, setOpenMenuId] = useState(null);

    // Close action dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    /* ---------------- COUNTS ---------------- */

    const totalCount = consultations.length;
    const viewedCount = consultations.filter((c) => c.is_viewed).length;
    const archivedCount = consultations.filter((c) => !c.is_published).length;

    /* ---------------- FILTER ---------------- */

    const published = consultations.filter((c) => c.is_published);
    const archived = consultations.filter((c) => !c.is_published);

    const displayed = activeTab === "published" ? published : archived;

    const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));

    const paginated = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statCards = [
        {
            label: "Total Consultations",
            value: totalCount,
            icon: <CalendarIcon className="w-5 h-5" />,
        },
        {
            label: "Viewed",
            value: viewedCount,
            icon: <EyeIcon className="w-5 h-5" />,
        },
        {
            label: "Archived",
            value: archivedCount,
            icon: <ArchiveIcon className="w-5 h-5" />,
        },
    ];

    // Dummy refresh function
    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 600);
    };

    return (
        <div className="flex flex-col h-full gap-6 lg:gap-8 [font-family:var(--font-neue)]">
            {/* Header & Stats */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Manage all consultation booking submissions.
                    </p>

                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm font-normal transition-all hover:bg-neutral-50 active:scale-95 cursor-pointer"
                    >
                        <RefreshIcon
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Filters & Tabs Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left: Tabs */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setActiveTab("published");
                            setPage(1);
                            setSelected(null);
                        }}
                        className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer ${
                            activeTab === "published"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white"
                        }`}
                    >
                        Published ({published.length})
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab("archived");
                            setPage(1);
                            setSelected(null);
                        }}
                        className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer ${
                            activeTab === "archived"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white"
                        }`}
                    >
                        Archived ({archived.length})
                    </button>
                </div>

                {/* Right: Search & Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                        />
                    </div>

                    {/* Project Type Filter */}
                    <div className="relative">
                        <select className="rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-neutral-700 outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-neutral-50 appearance-none cursor-pointer">
                            <option value="">All Projects</option>
                            <option value="residential">Residential</option>
                            <option value="commercial">Commercial</option>
                            <option value="master-planning">
                                Master Planning
                            </option>
                            <option value="interior">
                                Interior Architecture
                            </option>
                        </select>
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Table & Detail Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Table Area */}
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 overflow-auto no-scrollbar">
                        {loading && displayed.length === 0 ? (
                            <div className="flex h-full items-center justify-center p-8">
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                                <CalendarIcon className="w-12 h-12 text-neutral-300 mb-4" />
                                <p className="text-base font-bold text-neutral-900">
                                    No consultations found
                                </p>
                                <p className="text-sm font-medium text-neutral-500 mt-1">
                                    No records available for the selected tab.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm shadow-neutral-100">
                                    <tr>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Client
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200">
                                            Project Type
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 text-center">
                                            Date Requested
                                        </th>
                                        <th className="px-5 py-4 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase border-b border-neutral-200 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginated.map((c) => (
                                        <tr
                                            key={c.id}
                                            onClick={() =>
                                                setSelected(
                                                    selected?.id === c.id
                                                        ? null
                                                        : c,
                                                )
                                            }
                                            className={`group cursor-pointer transition-colors hover:bg-neutral-50 ${
                                                selected?.id === c.id
                                                    ? "bg-neutral-50"
                                                    : ""
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.first_name + " " + c.last_name)}&background=f3f4f6&color=000000&rounded=true`}
                                                        alt="Avatar"
                                                        className="w-8 h-8 rounded-full object-cover hidden sm:block"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">
                                                            {c.first_name}{" "}
                                                            {c.last_name}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[200px] mt-0.5 tracking-wide">
                                                            {c.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                                    {c.project_type || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <p className="text-sm font-medium text-neutral-600">
                                                    {c.consultation_date ||
                                                        "Not Specified"}
                                                </p>
                                            </td>
                                            <td
                                                className="px-5 py-4 text-right relative"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(
                                                            openMenuId === c.id
                                                                ? null
                                                                : c.id,
                                                        );
                                                    }}
                                                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors outline-none"
                                                >
                                                    <KebabIcon className="w-5 h-5" />
                                                </button>

                                                {/* Action Dropdown */}
                                                <AnimatePresence>
                                                    {openMenuId === c.id && (
                                                        <motion.div
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.95,
                                                                y: -10,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                                y: 0,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.95,
                                                                y: -10,
                                                            }}
                                                            transition={{
                                                                duration: 0.15,
                                                            }}
                                                            className="absolute right-10 top-10 z-50 w-40 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-neutral-100 py-2 rounded-xl"
                                                        >
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setSelected(
                                                                        c,
                                                                    );
                                                                    setOpenMenuId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                                                            >
                                                                View Details
                                                            </button>
                                                            {activeTab ===
                                                            "published" ? (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setArchiveId(
                                                                            c.id,
                                                                        );
                                                                        setOpenMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                                                >
                                                                    Archive
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        // TODO: Add actual restore logic
                                                                        setOpenMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                                                >
                                                                    Restore
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200 bg-neutral-50/50">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
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
                                            Client
                                        </p>
                                        <p className="text-base font-black text-neutral-900">
                                            {selected.first_name}{" "}
                                            {selected.last_name}
                                        </p>
                                        <p className="text-sm font-medium text-neutral-600 mt-1">
                                            {selected.email}
                                        </p>
                                        {selected.phone && (
                                            <p className="text-sm font-medium text-neutral-600 mt-1">
                                                {selected.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Project Type
                                            </p>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                                {selected.project_type || "N/A"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Date
                                            </p>
                                            <span className="text-sm font-medium text-neutral-700">
                                                {selected.consultation_date ||
                                                    "Not Specified"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Panel Actions */}
                                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2">
                                    {activeTab === "published" ? (
                                        <button
                                            onClick={() =>
                                                setArchiveId(selected.id)
                                            }
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50"
                                        >
                                            <ArchiveIcon className="w-4 h-4" />
                                            Archive Record
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                // TODO: Restore logic
                                                setSelected(null);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50"
                                        >
                                            <RestoreIcon className="w-4 h-4" />
                                            Restore Record
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Archive Modal */}
            <AnimatePresence>
                {archiveId && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setArchiveId(null)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none [font-family:var(--font-neue)]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl pointer-events-auto border border-neutral-100 text-center"
                            >
                                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                                    <ArchiveIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">
                                    Archive Consultation?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    You are moving this consultation to the
                                    archive. You can restore it later.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            // TODO: Trigger Archive API
                                            setArchiveId(null);
                                            setSelected(null);
                                        }}
                                        className="w-full rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-neutral-800"
                                    >
                                        Confirm Archive
                                    </button>
                                    <button
                                        onClick={() => setArchiveId(null)}
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
        </div>
    );
}

// ============================================================================
// Minimal UI Icons
// ============================================================================

function CalendarIcon({ className = "w-4 h-4" }) {
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function EyeIcon({ className = "w-4 h-4" }) {
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function ArchiveIcon({ className = "w-4 h-4" }) {
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
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

function SearchIcon({ className = "w-4 h-4" }) {
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
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
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

function CloseIcon({ className = "w-4 h-4" }) {
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function KebabIcon({ className = "w-5 h-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}
