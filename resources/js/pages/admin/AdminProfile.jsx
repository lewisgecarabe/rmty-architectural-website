import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- CONFIG & PRESETS ---------------- */
const PAGE_SIZE = 6;
const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

function subjectTypeLabel(type) {
    const labels = {
        project: "Project",
        service: "Service",
        about_section: "About Us",
    };
    return labels[type] ?? type;
}

function actionLabel(action) {
    const labels = {
        created: "Created",
        updated: "Updated",
        deleted: "Deleted",
    };
    return labels[action] ?? action;
}

// Helper component for beautiful action badges
function ActionBadge({ action }) {
    const baseClass =
        "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border";

    switch (action) {
        case "created":
            return (
                <span
                    className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
                >
                    Created
                </span>
            );
        case "updated":
            return (
                <span
                    className={`${baseClass} border-blue-200 bg-blue-50 text-blue-700`}
                >
                    Updated
                </span>
            );
        case "deleted":
            return (
                <span
                    className={`${baseClass} border-red-200 bg-red-50 text-red-700`}
                >
                    Deleted
                </span>
            );
        default:
            return (
                <span
                    className={`${baseClass} border-neutral-200 bg-neutral-50 text-neutral-600`}
                >
                    {actionLabel(action)}
                </span>
            );
    }
}

/* ---------------- ANIMATED SELECT COMPONENT ---------------- */
const AnimatedSelect = ({
    value,
    onChange,
    options,
    placeholder,
    className = "py-3",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            )
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectedOption = options.find(
        (opt) => opt.id.toString() === value.toString(),
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`group w-full rounded-xl border px-4 bg-white text-sm font-medium outline-none transition-all cursor-pointer flex items-center justify-between select-none ${className} ${
                    isOpen
                        ? "border-neutral-900 ring-1 ring-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                }`}
            >
                <span
                    className={`capitalize transition-colors whitespace-nowrap truncate mr-3 ${
                        selectedOption && selectedOption.id !== ""
                            ? "text-neutral-900"
                            : "text-neutral-400 group-hover:text-neutral-900"
                    }`}
                >
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: smoothEase }}
                    className="flex items-center justify-center w-4 h-4 shrink-0 origin-center"
                >
                    <ChevronDown className="w-4 h-4 transition-colors text-neutral-400 group-hover:text-neutral-900" />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: smoothEase }}
                        className="absolute top-full left-0 z-[60] w-full mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                    }}
                                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black cursor-pointer transition-colors capitalize whitespace-nowrap truncate"
                                >
                                    {opt.name}
                                </div>
                            ))}
                            {options.length === 0 && (
                                <div className="px-4 py-3 text-xs text-neutral-400">
                                    No options found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function AdminProfile() {
    // --- Data State ---
    const [profile, setProfile] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // --- View State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [page, setPage] = useState(1);

    const fetchProfileData = async () => {
        setLoading(true);
        setError("");
        try {
            const token =
                localStorage.getItem("admin_token") ||
                localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await fetch("/sanctum/csrf-cookie", { credentials: "include" });

            const [meRes, activitiesRes] = await Promise.all([
                fetch("/api/admin/me", { credentials: "include", headers }),
                fetch("/api/admin/profile/activities", {
                    credentials: "include",
                    headers,
                }),
            ]);

            if (meRes.ok) {
                const meJson = await meRes.json();
                setProfile(meJson.data ?? null);
            }
            if (activitiesRes.ok) {
                const actJson = await activitiesRes.json();
                setActivities(Array.isArray(actJson.data) ? actJson.data : []);
            }
            if (!meRes.ok) {
                setError("Could not load profile.");
            }
        } catch {
            setError("Network error. Could not load profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    // Filter Options
    const typeOptions = [
        { id: "project", name: "Project" },
        { id: "service", name: "Service" },
        { id: "about_section", name: "About Us" },
    ];

    const actionOptions = [
        { id: "created", name: "Created" },
        { id: "updated", name: "Updated" },
        { id: "deleted", name: "Deleted" },
    ];

    /* ---------------- COMPUTED DATA & PAGINATION ---------------- */
    let displayedActivities = activities;

    if (searchTerm.trim() !== "") {
        const lower = searchTerm.toLowerCase();
        displayedActivities = displayedActivities.filter(
            (a) =>
                (a.subject_title || "").toLowerCase().includes(lower) ||
                subjectTypeLabel(a.subject_type)
                    .toLowerCase()
                    .includes(lower) ||
                actionLabel(a.action).toLowerCase().includes(lower),
        );
    }

    if (filterType !== "") {
        displayedActivities = displayedActivities.filter(
            (a) => a.subject_type === filterType,
        );
    }

    if (filterAction !== "") {
        displayedActivities = displayedActivities.filter(
            (a) => a.action === filterAction,
        );
    }

    const totalPages = Math.max(
        1,
        Math.ceil(displayedActivities.length / PAGE_SIZE),
    );
    const currentPage = Math.min(page, totalPages);
    const paginatedActivities = displayedActivities.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    if (error && !profile) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <CloseIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-1">
                    Failed to load
                </h3>
                <p className="text-sm font-medium text-red-700">
                    {error || "Profile not found."}
                </p>
            </div>
        );
    }

    const displayName = profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          profile.name ||
          "Admin"
        : "Admin";

    const avatarSrc =
        profile?.profile_photo_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.email || profile?.id || "admin")}`;

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 min-h-screen">
            {/* Header / Profile Card */}
            {!loading && profile && (
                <div className="mb-6 lg:mb-8 rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                    <img
                        src={avatarSrc}
                        alt="Profile"
                        className="h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full border border-neutral-200 object-cover"
                    />
                    <div className="text-center sm:text-left flex-1">
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
                            {displayName}
                        </h1>
                        <p className="mt-1 text-sm font-medium text-neutral-500">
                            {profile.email}
                        </p>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:ml-auto">
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-100 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200">
                            Administrator
                        </span>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-2xl font-black tracking-tight text-neutral-900 mb-1.5">
                    Activity Log
                </h2>
                <p className="text-sm font-medium text-neutral-500">
                    A history of content changes you've made across the
                    platform.
                </p>
            </div>

            {/* Toolbar: Filters & Actions */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center w-full flex-1">
                    {/* Search Input */}
                    <div className="relative w-full flex-1 min-w-0">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by title, action, or type..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium placeholder-neutral-400 text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 [font-family:inherit]"
                        />
                    </div>

                    {/* Dropdowns & Buttons Wrapper */}
                    <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3">
                        {/* Type Dropdown */}
                        <div className="w-full sm:w-36 z-50 shrink-0">
                            <AnimatedSelect
                                value={filterType}
                                placeholder="All Types"
                                options={typeOptions}
                                className="py-2.5"
                                onChange={(id) => {
                                    setFilterType(id);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Action Dropdown */}
                        <div className="w-full sm:w-40 z-40 shrink-0 mt-3 sm:mt-0 sm:ml-3">
                            <AnimatedSelect
                                value={filterAction}
                                placeholder="All Actions"
                                options={actionOptions}
                                className="py-2.5"
                                onChange={(id) => {
                                    setFilterAction(id);
                                    setPage(1);
                                }}
                            />
                        </div>

                        {/* Clear & Refresh Buttons */}
                        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3">
                            <AnimatePresence>
                                {(searchTerm || filterType || filterAction) && (
                                    <motion.div
                                        layout
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                            width: 0,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                            width: "auto",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                            width: 0,
                                        }}
                                        transition={{
                                            duration: 0.25,
                                            ease: smoothEase,
                                        }}
                                        className="overflow-hidden self-stretch sm:self-auto shrink-0 sm:!h-[42px]"
                                    >
                                        <motion.div
                                            initial={{ x: -20 }}
                                            animate={{ x: 0 }}
                                            exit={{ x: -20 }}
                                            className="pb-3 sm:pb-0 sm:pr-3 w-full h-full"
                                        >
                                            <button
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setFilterType("");
                                                    setFilterAction("");
                                                    setPage(1);
                                                }}
                                                className="w-full sm:w-auto text-red-400 rounded-xl bg-white border border-neutral-200 h-[42px] px-6 text-sm hover:text-red-600 font-medium transition-colors active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center"
                                            >
                                                Clear
                                            </button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={fetchProfileData}
                                className="w-full sm:w-[42px] h-[42px] shrink-0 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50 transition-colors flex justify-center items-center cursor-pointer overflow-hidden"
                                title="Refresh Logs"
                            >
                                <RefreshIcon
                                    className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white relative overflow-hidden">
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                key="table-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center p-8 gap-4 rounded-2xl"
                            >
                                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                    Fetching Logs
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        {!loading && paginatedActivities.length === 0 ? (
                            <div className="flex flex-col h-full min-h-[400px] items-center justify-center text-center p-8 gap-4">
                                <HistoryIcon className="w-12 h-12 text-neutral-300" />
                                <div>
                                    <p className="text-base font-bold text-neutral-900">
                                        No activities found
                                    </p>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">
                                        {searchTerm ||
                                        filterType ||
                                        filterAction
                                            ? "Try adjusting your search or filters."
                                            : "Any updates to projects, services, or about sections will appear here."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-neutral-50 border-b border-neutral-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Type
                                        </th>
                                        <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Action
                                        </th>
                                        <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase w-1/2">
                                            Title
                                        </th>
                                        <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">
                                            Date & Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginatedActivities.map((activity) => (
                                        <tr
                                            key={activity.id}
                                            className="group hover:bg-neutral-50 transition-colors h-[73px]"
                                        >
                                            <td className="py-4 px-6 align-middle">
                                                <span className="text-sm font-bold text-neutral-900 capitalize">
                                                    {subjectTypeLabel(
                                                        activity.subject_type,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <ActionBadge
                                                    action={activity.action}
                                                />
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <p className="text-sm font-medium text-neutral-600 truncate max-w-[200px] md:max-w-[300px]">
                                                    {activity.subject_title ||
                                                        "—"}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-right">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-bold text-neutral-900">
                                                        {new Date(
                                                            activity.created_at,
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-wide">
                                                        {new Date(
                                                            activity.created_at,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    {displayedActivities.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 mt-auto rounded-b-2xl">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Page {currentPage} of {totalPages} (
                                {displayedActivities.length} total)
                            </p>
                            {totalPages > 1 && (
                                <div className="flex gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-3 h-3" />
                                        Prev
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function HistoryIcon({ className = "w-4 h-4" }) {
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
            <polyline points="12 7 12 12 15 15" />
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

function ChevronDown({ className = "w-4 h-4" }) {
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
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

function ChevronLeft({ className = "w-4 h-4" }) {
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
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function ChevronRight({ className = "w-4 h-4" }) {
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
            <path d="M9 18l6-6-6-6" />
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
