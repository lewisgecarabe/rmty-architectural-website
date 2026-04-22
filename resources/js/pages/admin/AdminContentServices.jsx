import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const springTransition = { type: "spring", damping: 25, stiffness: 300 };

function normalizeBulletInput(value = "") {
    return value
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-•*]\s*/, ""))
        .join("\n");
}

/* ---------------- REUSABLE UI COMPONENTS ---------------- */
function InputField({
    label,
    value,
    onChange,
    placeholder,
    isTextArea = false,
    fullHeight = false,
    rows = 5,
    helperText = "",
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
                    rows={rows}
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

            {helperText ? (
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                    {helperText}
                </p>
            ) : null}
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
export default function AdminContentServices() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const defaultPageSlots = [
        {
            id: null,
            sort_order: 0,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
            is_published: true,
        },
        {
            id: null,
            sort_order: 1,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
            is_published: true,
        },
        {
            id: null,
            sort_order: 2,
            title: "",
            content: "",
            cover_image: null,
            preview: null,
            is_published: true,
        },
    ];

    const [pageConfig, setPageConfig] = useState(defaultPageSlots);
    const [services, setServices] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteIndex, setDeleteIndex] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchContent = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/services`, {
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (res.ok) {
                const data = await res.json();

                if (Array.isArray(data)) {
                    const mergedConfig = [...defaultPageSlots];
                    const accordionItems = [];

                    data.forEach((item) => {
                        const formatted = {
                            ...item,
                            sort_order: Number(item.sort_order),
                            cover_image: null,
                            preview: item.image
                                ? `${API_BASE}/storage/${item.image}`
                                : null,
                        };

                        if (formatted.sort_order >= 0 && formatted.sort_order < 3) {
                            mergedConfig[formatted.sort_order] = {
                                ...formatted,
                                sort_order: formatted.sort_order,
                                is_published: true,
                            };
                        } else {
                            accordionItems.push(formatted);
                        }
                    });

                    setPageConfig(mergedConfig);
                    setServices(
                        accordionItems.sort(
                            (a, b) => Number(a.sort_order) - Number(b.sort_order)
                        )
                    );
                }
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

    const handleConfigText = (index, field, value) => {
        setPageConfig((prev) =>
            prev.map((s, i) =>
                i === index
                    ? {
                          ...s,
                          [field]: value,
                          sort_order: index,
                          is_published: true,
                      }
                    : s
            )
        );
    };

    const handleConfigImage = (index, file) => {
        setPageConfig((prev) =>
            prev.map((s, i) =>
                i === index
                    ? {
                          ...s,
                          cover_image: file,
                          preview: URL.createObjectURL(file),
                          sort_order: index,
                          is_published: true,
                      }
                    : s
            )
        );
    };

    const handleText = (index, field, value) => {
        setServices((prev) =>
            prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
        );
    };

    const handleAddService = () => {
        const nextOrder =
            services.length > 0
                ? Math.max(...services.map((s) => Number(s.sort_order))) + 1
                : 3;

        setServices([
            {
                id: null,
                title: "",
                content: "",
                is_published: true,
                sort_order: nextOrder,
                cover_image: null,
                preview: null,
            },
            ...services,
        ]);

        const element = document.getElementById("accordion-editor-section");
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const clearForm = () => {
        setPageConfig((prev) =>
            prev.map((s, index) => ({
                ...s,
                title: "",
                content: "",
                cover_image: null,
                preview: null,
                sort_order: index,
                is_published: true,
            }))
        );

        setServices((prev) =>
            prev.map((s) => ({
                ...s,
                title: "",
                content: "",
                cover_image: null,
                preview: null,
            }))
        );
    };

    const triggerDelete = (index, id) => {
        if (!id) {
            setServices((prev) => prev.filter((_, i) => i !== index));
            return;
        }

        setDeleteId(id);
        setDeleteIndex(index);
    };

    const confirmDelete = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/services/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (res.ok) {
                setServices((prev) => prev.filter((_, i) => i !== deleteIndex));
                showToast("Service deleted successfully.");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to delete service.", "error");
        } finally {
            setSaving(false);
            setDeleteId(null);
            setDeleteIndex(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const fixedSections = pageConfig.map((section, index) => ({
                ...section,
                title: (section.title || "").trim(),
                content: (section.content || "").trim(),
                sort_order: index,
                is_published: true,
            }));

            const dynamicServices = services.map((section) => ({
                ...section,
                title: (section.title || "").trim(),
                content: normalizeBulletInput(section.content || ""),
                sort_order: Number(section.sort_order),
                is_published: Boolean(section.is_published),
            }));

            const allItems = [...fixedSections, ...dynamicServices];

            const promises = allItems.map(async (section) => {
                if (
                    !section.id &&
                    !section.title &&
                    !section.content &&
                    !section.cover_image &&
                    !section.preview
                ) {
                    return null;
                }

                const fd = new FormData();
                fd.append("sort_order", section.sort_order);
                fd.append("is_published", section.is_published ? 1 : 0);
                fd.append("title", section.title || "");
                fd.append("content", section.content || "");

                if (section.cover_image) {
                    fd.append("cover_image", section.cover_image);
                } else if (!section.preview && section.id) {
                    fd.append("cover_image", "REMOVE");
                }

                const url = section.id
                    ? `${API_BASE}/api/services/${section.id}`
                    : `${API_BASE}/api/services`;

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
                        errorData
                    );
                    throw new Error(
                        errorData.message ||
                            `Failed to save section ${section.sort_order}`
                    );
                }

                return res;
            });

            await Promise.all(promises);
            showToast("Services configuration saved.");
            await fetchContent();
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to save configuration", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Editor...
                </p>
            </div>
        );
    }

    const cardClass =
        "bg-white rounded-2xl border border-neutral-200 p-6 md:p-8";
    const sectionHeaderClass =
        "text-xl font-bold tracking-tight text-neutral-900 mb-6 border-b border-neutral-100 pb-4";

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 w-full mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage layout content and dynamic services list.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link
                        to="/services"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black"
                    >
                        View Site
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={clearForm}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-medium cursor-pointer transition-colors hover:bg-red-50 text-red-600 hover:border-red-200"
                    >
                        Clear Form
                    </motion.button>

                    <motion.button
                        whileHover={saving ? {} : { scale: 1.02 }}
                        whileTap={saving ? {} : { scale: 0.97 }}
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-70 cursor-pointer transition-colors hover:bg-neutral-800"
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
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Hero Section</h2>
                    <div className="flex flex-col gap-6">
                        <InputField
                            label="Hero Title"
                            value={pageConfig[0].title}
                            onChange={(e) =>
                                handleConfigText(0, "title", e.target.value)
                            }
                            placeholder="e.g. DESIGNING WITH INTENTIONS"
                        />
                        <InputField
                            label="Hero Content"
                            value={pageConfig[0].content}
                            onChange={(e) =>
                                handleConfigText(0, "content", e.target.value)
                            }
                            isTextArea={true}
                            placeholder="Write the hero content..."
                        />
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Intro & Main Image</h2>
                    <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                        <div className="xl:w-[400px] 2xl:w-[450px] flex-shrink-0 flex flex-col h-full">
                            <ImagePlaceholder
                                label="Main Left Image"
                                previewUrl={pageConfig[1].preview}
                                onChange={(f) => handleConfigImage(1, f)}
                            />
                        </div>
                        <div className="flex-1 space-y-6 flex flex-col justify-between">
                            <InputField
                                label="Intro Title"
                                value={pageConfig[1].title}
                                isTextArea={true}
                                onChange={(e) =>
                                    handleConfigText(1, "title", e.target.value)
                                }
                                placeholder="e.g. RMTY | ARCHITECTS"
                            />
                            <div className="flex-1 flex flex-col">
                                <InputField
                                    label="Intro Paragraph"
                                    value={pageConfig[1].content}
                                    onChange={(e) =>
                                        handleConfigText(1, "content", e.target.value)
                                    }
                                    isTextArea={true}
                                    fullHeight={true}
                                    placeholder="Write the intro paragraph..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Call to Action Banner</h2>
                    <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                        <div className="flex-1 flex flex-col gap-6">
                            <InputField
                                label="CTA Button Text"
                                value={pageConfig[2].title}
                                onChange={(e) =>
                                    handleConfigText(2, "title", e.target.value)
                                }
                                placeholder="e.g. SEE OTHER PROJECTS"
                            />
                            <InputField
                                label="CTA Tag (Top Right)"
                                value={pageConfig[2].content}
                                onChange={(e) =>
                                    handleConfigText(2, "content", e.target.value)
                                }
                                placeholder="e.g. Architecture"
                            />
                        </div>
                        <div className="xl:w-[400px] 2xl:w-[450px] flex-shrink-0 flex flex-col h-full">
                            <ImagePlaceholder
                                label="CTA Background Image"
                                previewUrl={pageConfig[2].preview}
                                onChange={(f) => handleConfigImage(2, f)}
                            />
                        </div>
                    </div>
                </div>

                <div
                    id="accordion-editor-section"
                    className="flex items-center justify-between pt-8 border-t border-neutral-200"
                >
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                            Services List
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            Manage the items inside the dynamic accordion.
                        </p>
                    </div>
                    <button
                        onClick={handleAddService}
                        className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer transition-colors hover:bg-neutral-50 text-neutral-900 whitespace-nowrap shrink-0"
                    >
                        + Add New Service
                    </button>
                </div>

                {services.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                        <p className="text-sm font-bold text-neutral-400 mb-4">
                            No services available.
                        </p>
                        <button
                            onClick={handleAddService}
                            className="px-6 py-2 rounded-xl bg-white border border-neutral-200 text-sm font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                            + Create the first one
                        </button>
                    </div>
                )}

                {services.map((service, index) => (
                    <div
                        key={service.id || `new-${index}`}
                        className={cardClass}
                    >
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
                            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                                {service.title || `Service Item #${index + 1}`}
                            </h2>
                            <button
                                onClick={() => triggerDelete(index, service.id)}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <TrashIcon className="w-4 h-4" /> Remove
                            </button>
                        </div>

                        <div className="flex flex-col xl:flex-row gap-8 items-stretch">
                            <div className="flex-1 space-y-6 flex flex-col justify-between">
                                <InputField
                                    label="Service Title"
                                    value={service.title}
                                    onChange={(e) =>
                                        handleText(index, "title", e.target.value)
                                    }
                                    placeholder="e.g. Architectural Design"
                                />
                                <div className="flex-1 flex flex-col">
                                    <InputField
                                        label="Service Details"
                                        value={service.content}
                                        onChange={(e) =>
                                            handleText(index, "content", e.target.value)
                                        }
                                        isTextArea={true}
                                        fullHeight={true}
                                        rows={6}
                                        helperText="Enter one detail per line. Each line will appear as a bullet on the main Services page."
                                        placeholder={`Residential Design\nCondominium Planning\nTownhouse Development\nCommercial Buildings`}
                                    />
                                </div>
                                <div className="pt-2 border-t border-neutral-100">
                                    <label className="flex items-center gap-3 cursor-pointer group w-max">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={service.is_published}
                                                onChange={(e) =>
                                                    handleText(
                                                        index,
                                                        "is_published",
                                                        e.target.checked
                                                    )
                                                }
                                                className="w-5 h-5 rounded-md border-2 border-neutral-300 appearance-none checked:bg-black checked:border-black transition-colors cursor-pointer"
                                            />
                                            <CheckIcon
                                                className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity ${service.is_published ? "opacity-100" : "opacity-0"}`}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-neutral-700 group-hover:text-black transition-colors select-none">
                                            Publish to website
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {deleteId && (
                    <motion.div
                        key="modal-delete"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => {
                                setDeleteId(null);
                                setDeleteIndex(null);
                            }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto shadow-2xl"
                        >
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <TrashIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">
                                Delete Permanently?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                This action cannot be undone. It will remove this service.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={confirmDelete}
                                    disabled={saving}
                                    className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {saving ? "Deleting..." : "Yes, delete it"}
                                </button>
                                <button
                                    onClick={() => {
                                        setDeleteId(null);
                                        setDeleteIndex(null);
                                    }}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5 text-white">
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

function TrashIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    );
}