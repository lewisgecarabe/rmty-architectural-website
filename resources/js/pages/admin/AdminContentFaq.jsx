import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const springTransition = { type: "spring", damping: 25, stiffness: 300 };

const EMPTY_ITEM = {
    id: null,
    category: "General",
    question: "",
    answer: "",
    is_published: true,
    sort_order: 0,
};

const DEFAULT_FAQS = [
    {
        category: "Scope",
        question: "What types of projects does RMTY handle?",
        answer: "RMTY handles residential, commercial, interior architecture, and planning-focused projects. We tailor each design to the client's goals, budget, and site conditions.",
        is_published: true,
        sort_order: 0,
    },
    {
        category: "Getting Started",
        question: "How do I start a project with RMTY?",
        answer: "You can start by sending an inquiry through the Contact page or booking a consultation through the Appointment page. We then schedule a discussion to understand your requirements.",
        is_published: true,
        sort_order: 1,
    },
    {
        category: "Process",
        question: "Do you offer full design-to-construction support?",
        answer: "Yes. RMTY can support your project from concept development and design documentation up to construction coordination, depending on your selected scope.",
        is_published: true,
        sort_order: 2,
    },
    {
        category: "Timeline",
        question: "How long does a typical design process take?",
        answer: "Timelines vary by project size and complexity. Smaller residential work can move faster, while larger or multi-phase projects require longer planning and approvals.",
        is_published: true,
        sort_order: 3,
    },
    {
        category: "Process",
        question: "Can I request revisions during the design process?",
        answer: "Yes. Revisions are part of the process. We align design options with your feedback while maintaining technical and planning feasibility.",
        is_published: true,
        sort_order: 4,
    },
    {
        category: "Consultation",
        question: "How are consultations scheduled?",
        answer: "Consultations are scheduled through the Appointment page. Once submitted, our team confirms your preferred schedule through email or phone.",
        is_published: true,
        sort_order: 5,
    },
];

function InputField({
    label,
    value,
    onChange,
    placeholder,
    isTextArea = false,
    rows = 4,
}) {
    const inputClasses =
        "w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium bg-white outline-none transition-all hover:bg-neutral-50/50 focus:border-neutral-900";

    return (
        <div className="space-y-1.5 w-full flex flex-col">
            <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                {label}
            </label>

            {isTextArea ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${inputClasses} resize-none`}
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

export default function AdminContentFaq() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [deleteInfo, setDeleteInfo] = useState({ id: null, index: null });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchFaqs = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/faqs`, {
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                const normalized = Array.isArray(data)
                    ? data
                          .map((item, index) => ({
                              ...item,
                              category: item.category || "General",
                              question: item.question || "",
                              answer: item.answer || "",
                              is_published: Boolean(item.is_published),
                              sort_order: Number.isFinite(Number(item.sort_order))
                                  ? Number(item.sort_order)
                                  : index,
                          }))
                          .sort((a, b) => a.sort_order - b.sort_order)
                    : [];

                if (normalized.length > 0) {
                    setFaqs(normalized);
                } else {
                    setFaqs(DEFAULT_FAQS.map((item) => ({ ...item, id: null })));
                }
            } else {
                setFaqs(DEFAULT_FAQS.map((item) => ({ ...item, id: null })));
            }
        } catch (err) {
            console.error("Failed to fetch FAQs:", err);
            setFaqs(DEFAULT_FAQS.map((item) => ({ ...item, id: null })));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleField = (index, field, value) => {
        setFaqs((prev) =>
            prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
        );
    };

    const handleAddFaq = () => {
        const nextOrder =
            faqs.length > 0
                ? Math.max(...faqs.map((f) => Number(f.sort_order || 0))) + 1
                : 0;

        setFaqs((prev) => [{ ...EMPTY_ITEM, sort_order: nextOrder }, ...prev]);

        const element = document.getElementById("faq-editor-section");
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const clearForm = () => {
        setFaqs((prev) =>
            prev.map((faq, index) => ({
                ...faq,
                category: "General",
                question: "",
                answer: "",
                is_published: true,
                sort_order: Number(faq.sort_order ?? index),
            })),
        );
    };

    const triggerDelete = (index, id) => {
        if (!id) {
            setFaqs((prev) => prev.filter((_, i) => i !== index));
            return;
        }

        setDeleteInfo({ id, index });
    };

    const confirmDelete = async () => {
        const { id, index } = deleteInfo;
        if (!id) return;

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/api/faqs/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (!res.ok) {
                throw new Error("Failed to delete FAQ.");
            }

            setFaqs((prev) => prev.filter((_, i) => i !== index));
            showToast("FAQ deleted successfully.");
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to delete FAQ.", "error");
        } finally {
            setSaving(false);
            setDeleteInfo({ id: null, index: null });
        }
    };

    const handleSubmit = async () => {
        setSaving(true);

        try {
            const normalizedFaqs = faqs.map((faq, index) => ({
                ...faq,
                category: (faq.category || "General").trim() || "General",
                question: (faq.question || "").trim(),
                answer: (faq.answer || "").trim(),
                sort_order: Number(faq.sort_order ?? index),
                is_published: Boolean(faq.is_published),
            }));

            const promises = normalizedFaqs.map(async (faq) => {
                if (!faq.id && !faq.question && !faq.answer) {
                    return null;
                }

                const fd = new FormData();
                fd.append("category", faq.category);
                fd.append("question", faq.question);
                fd.append("answer", faq.answer);
                fd.append("is_published", faq.is_published ? 1 : 0);
                fd.append("sort_order", faq.sort_order);

                const url = faq.id
                    ? `${API_BASE}/api/faqs/${faq.id}`
                    : `${API_BASE}/api/faqs`;

                if (faq.id) {
                    fd.append("_method", "PUT");
                }

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
                    throw new Error(errorData.message || "Failed to save FAQ item.");
                }

                return res.json();
            });

            await Promise.all(promises);
            showToast("FAQ content saved.");
            await fetchFaqs();
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to save FAQ content.", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading FAQ Editor...
                </p>
            </div>
        );
    }

    const cardClass = "bg-white rounded-2xl border border-neutral-200 p-6 md:p-8";

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 w-full mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage public FAQ entries, categories, order, and publish state.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link
                        to="/faq"
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
                            "Save FAQ Content"
                        )}
                    </motion.button>
                </div>
            </div>

            <div
                id="faq-editor-section"
                className="flex items-center justify-between pt-8 border-t border-neutral-200 mb-6"
            >
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                        FAQ Items
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        Keep answers short, clear, and client-friendly.
                    </p>
                </div>
                <button
                    onClick={handleAddFaq}
                    className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer transition-colors hover:bg-neutral-50 text-neutral-900 whitespace-nowrap shrink-0"
                >
                    + Add New FAQ
                </button>
            </div>

            {faqs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                    <p className="text-sm font-bold text-neutral-400 mb-4">No FAQs yet.</p>
                    <button
                        onClick={handleAddFaq}
                        className="px-6 py-2 rounded-xl bg-white border border-neutral-200 text-sm font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                        + Create first FAQ
                    </button>
                </div>
            )}

            <div className="space-y-5">
                {faqs.map((faq, index) => (
                    <div key={faq.id || `new-${index}`} className={cardClass}>
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
                            <h3 className="text-xl font-bold tracking-tight text-neutral-900">
                                {faq.question || `FAQ Item #${index + 1}`}
                            </h3>
                            <button
                                onClick={() => triggerDelete(index, faq.id)}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <TrashIcon className="w-4 h-4" /> Remove
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                            <div className="lg:col-span-2">
                                <InputField
                                    label="Category"
                                    value={faq.category}
                                    onChange={(e) =>
                                        handleField(index, "category", e.target.value)
                                    }
                                    placeholder="e.g. Process"
                                />
                            </div>

                            <div className="lg:col-span-4">
                                <InputField
                                    label="Question"
                                    value={faq.question}
                                    onChange={(e) =>
                                        handleField(index, "question", e.target.value)
                                    }
                                    placeholder="Write a clear frequently asked question"
                                />
                            </div>

                            <div className="lg:col-span-6">
                                <InputField
                                    label="Answer"
                                    value={faq.answer}
                                    onChange={(e) =>
                                        handleField(index, "answer", e.target.value)
                                    }
                                    isTextArea
                                    rows={5}
                                    placeholder="Write a clear and concise answer"
                                />
                            </div>

                            <div className="lg:col-span-6 pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer group w-max">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            checked={faq.is_published}
                                            onChange={(e) =>
                                                handleField(index, "is_published", e.target.checked)
                                            }
                                            className="w-5 h-5 rounded-md border-2 border-neutral-300 appearance-none checked:bg-black checked:border-black transition-colors cursor-pointer"
                                        />
                                        <CheckIcon
                                            className={`absolute w-3.5 h-3.5 text-white pointer-events-none transition-opacity ${faq.is_published ? "opacity-100" : "opacity-0"}`}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-neutral-700 group-hover:text-black transition-colors select-none">
                                        Publish to website
                                    </span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                        Sort Order
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={faq.sort_order}
                                        onChange={(e) =>
                                            handleField(
                                                index,
                                                "sort_order",
                                                Number(e.target.value || 0),
                                            )
                                        }
                                        className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium bg-white outline-none focus:border-neutral-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {deleteInfo.id && (
                    <motion.div
                        key="modal-delete"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setDeleteInfo({ id: null, index: null })}
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
                                This action cannot be undone.
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
                                    onClick={() => setDeleteInfo({ id: null, index: null })}
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
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
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
