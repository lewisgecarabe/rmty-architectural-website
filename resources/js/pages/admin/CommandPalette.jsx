import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Standard Framer Motion transition
const springTransition = { type: "spring", damping: 25, stiffness: 300 };

export default function CommandPalette({ isOpen, onClose }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Focus input automatically when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Real API Search Logic with Debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        const fetchSearchResults = async () => {
            try {
                const token =
                    localStorage.getItem("admin_token") ||
                    localStorage.getItem("token");
                const res = await fetch(
                    `/api/admin/search?q=${encodeURIComponent(query)}`,
                    {
                        headers: {
                            Accept: "application/json",
                            ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                        },
                    },
                );

                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const delayDebounceFn = setTimeout(() => {
            fetchSearchResults();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Group the real results coming from Laravel
    const groupedResults = results.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item);
        return acc;
    }, {});

    const handleSelect = (to) => {
        onClose();
        navigate(to);
    };

    // ─────────────────────────────────────────
    // DYNAMIC MINIMALIST ICON MAPPER
    // ─────────────────────────────────────────
    const getMinimalistIcon = (item) => {
        const { type, label } = item;
        const iconClass =
            "w-[18px] h-[18px] text-neutral-400 group-hover:text-neutral-900 transition-colors duration-300";

        if (type === "Projects") return <FolderIcon className={iconClass} />;
        if (type === "Inquiries") return <InboxIcon className={iconClass} />;
        if (type === "Consultations")
            return <CalendarIcon className={iconClass} />;
        if (type === "Users & Admins")
            return <UsersIcon className={iconClass} />;
        if (type === "System Logs")
            return <ActivityIcon className={iconClass} />;
        if (type === "Services" || type === "Categories")
            return <LayersIcon className={iconClass} />;

        // Navigation mapping based on label keywords
        const labelLower = label.toLowerCase();
        if (labelLower.includes("home"))
            return <HomeIcon className={iconClass} />;
        if (labelLower.includes("setting"))
            return <SettingsIcon className={iconClass} />;
        if (labelLower.includes("contact"))
            return <ContactIcon className={iconClass} />;

        // Default fallback icon
        return <DocumentIcon className={iconClass} />;
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] p-4 [font-family:var(--font-neue)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div
                        className="absolute inset-0 bg-neutral-900/40 cursor-pointer"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={springTransition}
                        className="relative w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[70vh]"
                    >
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-100/60">
                            <SearchIcon className="w-5 h-5 text-neutral-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search projects, clients, or pages..."
                                className="w-full bg-transparent text-lg font-medium text-neutral-900 placeholder-neutral-400 outline-none"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="px-2 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-[10px] font-bold text-neutral-400 tracking-widest">
                                    ESC
                                </span>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-3 no-scrollbar flex-1">
                            {!query && (
                                <div className="p-10 text-center text-neutral-400">
                                    <p className="text-sm font-medium">
                                        Type something to search...
                                    </p>
                                </div>
                            )}

                            {isSearching && query && (
                                <div className="p-10 text-center text-neutral-500">
                                    <p className="text-sm font-medium animate-pulse">
                                        Searching...
                                    </p>
                                </div>
                            )}

                            {!isSearching && query && results.length === 0 && (
                                <div className="p-10 text-center text-neutral-500">
                                    <p className="text-sm font-medium">
                                        No results found for "{query}"
                                    </p>
                                </div>
                            )}

                            {!isSearching &&
                                Object.entries(groupedResults).map(
                                    ([type, items]) => (
                                        <div
                                            key={type}
                                            className="mb-6 last:mb-2"
                                        >
                                            <div className="px-4 py-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                                                {type}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {items.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() =>
                                                            handleSelect(
                                                                item.to,
                                                            )
                                                        }
                                                        className="flex items-center gap-4 px-4 py-3.5 rounded-2xl mx-1 hover:bg-neutral-50 text-left transition-all duration-300 outline-none focus:bg-neutral-50 cursor-pointer group"
                                                    >
                                                        {/* Minimalist Icon Rendered Here */}
                                                        <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-neutral-200 group-hover:border-neutral-300 transition-colors">
                                                            {getMinimalistIcon(
                                                                item,
                                                            )}
                                                        </span>

                                                        <span className="text-sm font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors flex-1 truncate">
                                                            {item.label}
                                                        </span>

                                                        {/* Subtle arrow on hover */}
                                                        <ArrowRightIcon className="w-4 h-4 text-neutral-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

// ─────────────────────────────────────────
// MINIMALIST SVG ICON LIBRARY
// ─────────────────────────────────────────

function SearchIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <circle cx="11" cy="11" r="7" />
            <path
                d="M21 21l-4.35-4.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function FolderIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function InboxIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function CalendarIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function UsersIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="9"
                cy="7"
                r="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ActivityIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <polyline
                points="22 12 18 12 15 21 9 3 6 12 2 12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function LayersIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <polygon
                points="12 2 2 7 12 12 22 7 12 2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 12 12 17 22 12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 17 12 22 22 17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function HomeIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="9 22 9 12 15 12 15 22"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function SettingsIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ContactIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="22,6 12,13 2,6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function DocumentIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="14 2 14 8 20 8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="10"
                y1="9"
                x2="8"
                y2="9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ArrowRightIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="12 5 19 12 12 19"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
