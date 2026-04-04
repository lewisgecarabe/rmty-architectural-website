import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

const springTransition = { type: "spring", damping: 25, stiffness: 300 };

/* ---------------- REUSABLE UI COMPONENTS ---------------- */
function InputField({
    label,
    value,
    onChange,
    placeholder,
    isTextArea = false,
    fullHeight = false,
}) {
    const inputClasses =
        "w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium bg-white outline-none transition-all hover:bg-neutral-50/50 focus:border-neutral-900";

    return (
        <div
            className={`space-y-1.5 w-full flex flex-col ${fullHeight ? "h-full" : ""}`}
        >
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
            </div>
            {isTextArea ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={5}
                    className={`${inputClasses} resize-none ${fullHeight ? "flex-1" : ""}`}
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={inputClasses}
                />
            )}
        </div>
    );
}

function ImagePlaceholder({ label, previewUrl, onChange }) {
    const fileInputRef = useRef(null);
    return (
        <div className="space-y-1.5 flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
            </div>
            <label className="relative flex flex-col items-center justify-center w-full flex-1 min-h-[220px] border border-dashed rounded-xl cursor-pointer overflow-hidden transition-all border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100 group">
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt={label}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <UploadIcon className="w-6 h-6 text-white mb-2" />
                            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                                Change Image
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full text-neutral-400 group-hover:text-neutral-600 transition-colors">
                        <UploadIcon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">
                            Upload Image
                        </p>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                        e.target.files[0] && onChange(e.target.files[0])
                    }
                />
            </label>
        </div>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function AdminContentAbout() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const defaultSections = [
        {
            id: null,
            sort_order: 0,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Hero
        {
            id: null,
            sort_order: 1,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Purpose Left Text
        {
            id: null,
            sort_order: 2,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Purpose Center Text
        {
            id: null,
            sort_order: 3,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Purpose Image Area
        {
            id: null,
            sort_order: 4,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Mission
        {
            id: null,
            sort_order: 5,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Vision
        {
            id: null,
            sort_order: 6,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
        }, // Artist
    ];

    const [sections, setSections] = useState(defaultSections);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchContent = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/about`, {
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                const merged = [...defaultSections];
                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        const index = merged.findIndex(
                            (s) => s.sort_order === Number(item.sort_order),
                        );
                        if (index !== -1) {
                            merged[index] = {
                                ...merged[index],
                                id: item.id,
                                title: item.title || "",
                                content: item.content || "",
                                preview: item.image
                                    ? `${API_BASE}/storage/${item.image}`
                                    : null,
                            };
                        }
                    });
                }
                setSections(merged);
            }
        } catch (err) {
            console.error("Failed to fetch:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleText = (sort_order, field, value) => {
        setSections((prev) =>
            prev.map((s) =>
                s.sort_order === sort_order ? { ...s, [field]: value } : s,
            ),
        );
    };

    const handleImage = (sort_order, file) => {
        setSections((prev) =>
            prev.map((s) =>
                s.sort_order === sort_order
                    ? {
                          ...s,
                          cover_image: file,
                          preview: URL.createObjectURL(file),
                      }
                    : s,
            ),
        );
    };

    // THE FIX: Clear the content, but keep the database ID intact so Laravel knows what to delete!
    const clearForm = () => {
        {
            setSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    title: "",
                    content: "",
                    cover_image: null,
                    preview: null,
                })),
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const promises = sections.map(async (section) => {
                // If it's a completely blank, unsaved section, skip it.
                // But if it HAS an ID (because the user just cleared it), we MUST send it!
                if (
                    !section.id &&
                    !section.title &&
                    !section.content &&
                    !section.cover_image &&
                    !section.preview
                )
                    return null;

                const fd = new FormData();
                fd.append("sort_order", section.sort_order);
                fd.append("is_published", 1);

                fd.append("title", section.title || "");
                fd.append("content", section.content || "");

                if (section.cover_image) {
                    fd.append("cover_image", section.cover_image);
                } else if (!section.preview) {
                    fd.append("cover_image", "REMOVE");
                }

                const url = section.id
                    ? `${API_BASE}/api/about/${section.id}`
                    : `${API_BASE}/api/about`;

                if (section.id) fd.append("_method", "PUT");

                const res = await fetch(url, {
                    method: "POST",
                    body: fd,
                    credentials: "include",
                    headers: {
                        ...getAuthHeaders(),
                        Accept: "application/json",
                    },
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error(
                        `Laravel rejected Section ${section.sort_order}:`,
                        errorData,
                    );
                    throw new Error(
                        errorData.message ||
                            `Failed to save section ${section.sort_order}`,
                    );
                }

                return res;
            });

            await Promise.all(promises);

            showToast("About Page Configuration Saved!");
            await fetchContent();
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to save configuration", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Editor...
                </p>
            </div>
        );

    const cardClass =
        "bg-white rounded-2xl border border-neutral-200 p-6 md:p-8";
    const sectionHeaderClass =
        "text-xl font-bold tracking-tight text-neutral-900 mb-6 border-b border-neutral-100 pb-4";

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 w-full mx-auto">
            {/* Action Bar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage content and imagery for the About page.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link
                        to="/about"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black "
                    >
                        View Site
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={clearForm}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer transition-colors hover:bg-red-50 text-red-600 hover:border-red-200"
                    >
                        Clear Form
                    </motion.button>

                    <motion.button
                        whileHover={saving ? {} : { scale: 1.02 }}
                        whileTap={saving ? {} : { scale: 0.97 }}
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-70 cursor-pointer transition-colors hover:bg-neutral-800"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            "Save Configuration"
                        )}
                    </motion.button>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. HERO SECTION (Slot 0) */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Hero Section</h2>
                    <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                        <div className="flex-1 space-y-6 flex flex-col justify-between">
                            <InputField
                                label="Hero Title"
                                value={sections[0].title}
                                onChange={(e) =>
                                    handleText(0, "title", e.target.value)
                                }
                                placeholder="e.g. ABOUT US"
                            />
                            <div className="flex-1 flex flex-col">
                                <InputField
                                    label="Hero Content"
                                    value={sections[0].content}
                                    onChange={(e) =>
                                        handleText(0, "content", e.target.value)
                                    }
                                    isTextArea={true}
                                    fullHeight={true}
                                    placeholder="Write the hero introduction..."
                                />
                            </div>
                        </div>
                        <div className="xl:w-[400px] 2xl:w-[450px] flex-shrink-0 flex flex-col h-full">
                            <ImagePlaceholder
                                label="Hero Cover Image"
                                previewUrl={sections[0].preview}
                                onChange={(f) => handleImage(0, f)}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. OUR PURPOSE (Slots 1, 2, 3) */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Our Purpose</h2>

                    <div className="space-y-6">
                        {/* Top Row: Left Paragraph */}
                        <InputField
                            label="Left Paragraph"
                            value={sections[1].content}
                            onChange={(e) =>
                                handleText(1, "content", e.target.value)
                            }
                            isTextArea={true}
                            placeholder="Shorter paragraph on the left..."
                        />

                        {/* Bottom Row: Center Paragraph & Image */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t border-neutral-100 pt-6">
                            <InputField
                                label="Center Paragraph"
                                value={sections[2].content}
                                onChange={(e) =>
                                    handleText(2, "content", e.target.value)
                                }
                                isTextArea={true}
                                fullHeight={true}
                                placeholder="Longer descriptive paragraph in the center..."
                            />

                            <ImagePlaceholder
                                label="Purpose Image"
                                previewUrl={sections[3].preview}
                                onChange={(f) => handleImage(3, f)}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. MISSION & VISION (Slots 4, 5) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Mission */}
                    <div className={cardClass}>
                        <h2 className={sectionHeaderClass}>Mission</h2>
                        <div className="flex flex-col gap-6">
                            <InputField
                                label="Mission Title"
                                value={sections[4].title}
                                onChange={(e) =>
                                    handleText(4, "title", e.target.value)
                                }
                                placeholder="e.g. MISSION"
                            />

                            <div className="h-[240px] w-full shrink-0">
                                <ImagePlaceholder
                                    label="Mission Image"
                                    previewUrl={sections[4].preview}
                                    onChange={(f) => handleImage(4, f)}
                                />
                            </div>

                            <InputField
                                label="Mission Content"
                                value={sections[4].content}
                                onChange={(e) =>
                                    handleText(4, "content", e.target.value)
                                }
                                isTextArea={true}
                                placeholder="Describe your mission..."
                            />
                        </div>
                    </div>

                    {/* Vision */}
                    <div className={cardClass}>
                        <h2 className={sectionHeaderClass}>Vision</h2>
                        <div className="flex flex-col gap-6">
                            <InputField
                                label="Vision Title"
                                value={sections[5].title}
                                onChange={(e) =>
                                    handleText(5, "title", e.target.value)
                                }
                                placeholder="e.g. VISION"
                            />

                            <div className="h-[240px] w-full shrink-0">
                                <ImagePlaceholder
                                    label="Vision Image"
                                    previewUrl={sections[5].preview}
                                    onChange={(f) => handleImage(5, f)}
                                />
                            </div>

                            <InputField
                                label="Vision Content"
                                value={sections[5].content}
                                onChange={(e) =>
                                    handleText(5, "content", e.target.value)
                                }
                                isTextArea={true}
                                placeholder="Describe your vision..."
                            />
                        </div>
                    </div>
                </div>

                {/* 4. ABOUT THE ARTIST (Slot 6) */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>About The Artist</h2>
                    <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                        <div className="xl:w-[400px] 2xl:w-[450px] flex-shrink-0 flex flex-col h-full">
                            <ImagePlaceholder
                                label="Artist Profile Image"
                                previewUrl={sections[6].preview}
                                onChange={(f) => handleImage(6, f)}
                            />
                        </div>
                        <div className="flex-1 space-y-6 flex flex-col justify-between">
                            <InputField
                                label="Section Title"
                                value={sections[6].title}
                                onChange={(e) =>
                                    handleText(6, "title", e.target.value)
                                }
                                placeholder="e.g. ABOUT THE ARTIST"
                            />
                            <div className="flex-1 flex flex-col">
                                <InputField
                                    label="Artist Biography"
                                    value={sections[6].content}
                                    onChange={(e) =>
                                        handleText(6, "content", e.target.value)
                                    }
                                    isTextArea={true}
                                    fullHeight={true}
                                    placeholder="Write the artist biography here..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={springTransition}
                        className="fixed bottom-10 right-10 z-[110] pointer-events-none"
                    >
                        <div
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success" ? "bg-black text-white border-black" : "bg-red-600 text-white border-red-700"}`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <CloseIcon className="w-4 h-4 text-white" />
                            )}
                            <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5">
                                {toast.msg}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
function CheckIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={`w-4 h-4 ${className}`}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}
function UploadIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}
function CloseIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={className}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
