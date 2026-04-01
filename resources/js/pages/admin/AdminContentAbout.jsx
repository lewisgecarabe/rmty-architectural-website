import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 6;

const SECTION_OPTIONS = [
    { id: 0, name: "Hero Section" },
    { id: 1, name: "Purpose (Left Text)" },
    { id: 2, name: "Purpose (Center Text)" },
    { id: 3, name: "Purpose (Image Area)" },
    { id: 4, name: "Mission" },
    { id: 5, name: "Vision" },
    { id: 6, name: "About the Artist" },
];

function imageUrl(path) {
    if (!path) return null;
    return path.startsWith("http") ? path : `/storage/${path}`;
}

/* ---------------- ANIMATION PRESETS ---------------- */
const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const drawerTransition = { type: "spring", damping: 30, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

/* ---------------- ANIMATED SELECT COMPONENT ---------------- */
const AnimatedSelect = ({
    value,
    onChange,
    options,
    placeholder,
    error,
    label,
    required,
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
            {label && (
                <div className="flex justify-between mb-1.5">
                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                        {label} {required && "*"}
                    </label>
                    {error && (
                        <span className="text-[10px] font-bold text-red-500 uppercase">
                            {error}
                        </span>
                    )}
                </div>
            )}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`group w-full rounded-xl border px-4 bg-white text-sm font-medium outline-none transition-all cursor-pointer flex items-center justify-between select-none ${className} ${
                    error
                        ? "border-red-400 bg-red-50/50 text-red-900"
                        : isOpen
                          ? "border-neutral-900 ring-1 ring-neutral-900"
                          : "border-neutral-200 hover:border-neutral-300"
                }`}
            >
                <span
                    className={`capitalize transition-colors whitespace-nowrap truncate mr-3 ${
                        selectedOption && selectedOption.id !== ""
                            ? "text-black"
                            : "text-neutral-400 group-hover:text-black"
                    }`}
                >
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: smoothEase }}
                    className="flex items-center justify-center w-4 h-4 shrink-0 origin-center"
                >
                    <ChevronDown
                        className={`w-4 h-4 transition-colors ${error ? "text-red-400" : "text-neutral-400 group-hover:text-black"}`}
                    />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: smoothEase }}
                        className="absolute top-full left-0 z-[60] w-full mt-2 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-lg shadow-neutral-200/20"
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-1">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        onChange(opt.id);
                                        setIsOpen(false);
                                    }}
                                    className="px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-black cursor-pointer transition-colors capitalize whitespace-nowrap truncate"
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

/* ---------------- COMPONENT ---------------- */
export default function AdminContentAbout() {
    const [sections, setSections] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const [page, setPage] = useState(1);

    // Separated state for Archiving, Deleting, and Bulk Actions
    const [archiveId, setArchiveId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAction, setBulkAction] = useState(null);

    const [form, setForm] = useState({
        title: "",
        sort_order: "",
        content: "",
        cover_image: null,
        is_published: true,
    });

    const [formErrors, setFormErrors] = useState({});

    const [activeTab, setActiveTab] = useState("published");
    const [successMessage, setSuccessMessage] = useState("");
    const [updating, setUpdating] = useState(false);

    const [selected, setSelected] = useState(null);

    // --- UI State for Filters ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSection, setFilterSection] = useState("");

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        const init = async () => {
            await fetch("/sanctum/csrf-cookie", { credentials: "include" });
            await fetchSections();
        };
        init();
    }, []);

    // Clear bulk selections if tab, search, or page changes
    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab, page, searchTerm, filterSection]);

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/about", {
                credentials: "include",
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setSections(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
            setSections([]);
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- BULK SELECTION ---------------- */
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginated.map((s) => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    /* ---------------- FORM & VALIDATION ---------------- */
    const resetForm = () => {
        setForm({
            title: "",
            sort_order: "",
            content: "",
            cover_image: null,
            is_published: true,
        });
        setEditing(null);
        setFormErrors({});
        setShowForm(false);
    };

    const validateForm = () => {
        const errors = {};
        if (!form.title.trim()) errors.title = "Title is required";
        if (form.sort_order === "") errors.sort_order = "Section is required";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEdit = (section) => {
        setEditing(section);
        setFormErrors({});
        setForm({
            title: section.title,
            sort_order:
                section.sort_order !== null
                    ? section.sort_order.toString()
                    : "",
            content: section.content || "",
            cover_image: null,
            is_published: section.is_published,
        });

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("sort_order", form.sort_order);
        fd.append("content", form.content);
        fd.append("is_published", form.is_published ? 1 : 0);

        if (form.cover_image) {
            fd.append("cover_image", form.cover_image);
        }

        const url = editing ? `/api/about/${editing.id}` : "/api/about";
        if (editing) fd.append("_method", "PUT");

        setUpdating(true);
        try {
            const res = await fetch(url, {
                method: "POST",
                body: fd,
                credentials: "include",
                headers: { ...getAuthHeaders(), Accept: "application/json" },
            });

            if (!res.ok) throw new Error("Failed to submit");

            await fetchSections();
            resetForm();
            setSuccessMessage(
                editing
                    ? "Section Updated Successfully"
                    : "Section Created Successfully",
            );
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Submit error:", err);
            alert("Something went wrong. Check console for details.");
        } finally {
            setUpdating(false);
        }
    };

    /* ---------------- BULK ACTIONS ---------------- */
    const confirmBulkAction = async () => {
        setUpdating(true);
        try {
            if (bulkAction === "archive" || bulkAction === "restore") {
                const is_published = bulkAction === "restore" ? 1 : 0;
                await Promise.all(
                    selectedIds.map((id) => {
                        const fd = new FormData();
                        fd.append("_method", "PUT");
                        fd.append("is_published", is_published);
                        return fetch(`/api/about/${id}`, {
                            method: "POST",
                            body: fd,
                            credentials: "include",
                            headers: getAuthHeaders(),
                        });
                    }),
                );
                setSuccessMessage(
                    `Sections ${bulkAction === "restore" ? "Restored" : "Archived"} Successfully`,
                );
            } else if (bulkAction === "delete") {
                await Promise.all(
                    selectedIds.map((id) =>
                        fetch(`/api/about/${id}`, {
                            method: "DELETE",
                            credentials: "include",
                            headers: getAuthHeaders(),
                        }),
                    ),
                );
                setSuccessMessage("Sections Deleted Permanently");
            }
            await fetchSections();
        } catch (e) {
            console.error(e);
            alert("An error occurred during bulk action.");
        } finally {
            setUpdating(false);
            setBulkAction(null);
            setSelectedIds([]);
            if (selected && selectedIds.includes(selected.id))
                setSelected(null);
            setTimeout(() => setSuccessMessage(""), 3000);
        }
    };

    /* ---------------- SINGLE ACTIONS ---------------- */
    const confirmArchive = async () => {
        if (!archiveId) return;
        setUpdating(true);
        try {
            const fd = new FormData();
            fd.append("_method", "PUT");
            fd.append("is_published", 0);
            await fetch(`/api/about/${archiveId}`, {
                method: "POST",
                body: fd,
                credentials: "include",
                headers: getAuthHeaders(),
            });
            setSuccessMessage("Section Archived Successfully");
            await fetchSections();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
            setArchiveId(null);
            if (selected?.id === archiveId) setSelected(null);
            setTimeout(() => setSuccessMessage(""), 3000);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setUpdating(true);
        try {
            await fetch(`/api/about/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
                headers: getAuthHeaders(),
            });
            setSuccessMessage("Section Deleted Permanently");
            await fetchSections();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
            setDeleteId(null);
            if (selected?.id === deleteId) setSelected(null);
            setTimeout(() => setSuccessMessage(""), 3000);
        }
    };

    const handleRestore = async (id) => {
        setUpdating(true);
        try {
            const fd = new FormData();
            fd.append("_method", "PUT");
            fd.append("is_published", 1);
            await fetch(`/api/about/${id}`, {
                method: "POST",
                body: fd,
                credentials: "include",
                headers: getAuthHeaders(),
            });
            setSuccessMessage("Section Restored Successfully");
            await fetchSections();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
            if (selected?.id === id) setSelected(null);
            setTimeout(() => setSuccessMessage(""), 3000);
        }
    };

    /* ---------------- COMPUTED DATA & FILTERING ---------------- */
    const publishedSections = sections.filter((s) => s.is_published);
    const archivedSections = sections.filter((s) => !s.is_published);
    let displayedSections =
        activeTab === "published" ? publishedSections : archivedSections;

    if (searchTerm.trim() !== "") {
        const lower = searchTerm.toLowerCase();
        displayedSections = displayedSections.filter(
            (s) =>
                s.title?.toLowerCase().includes(lower) ||
                s.content?.toLowerCase().includes(lower),
        );
    }

    if (filterSection !== "") {
        displayedSections = displayedSections.filter(
            (s) => s.sort_order?.toString() === filterSection.toString(),
        );
    }

    /* ---------------- PAGINATION ---------------- */
    const totalPages = Math.max(
        1,
        Math.ceil(displayedSections.length / PAGE_SIZE),
    );
    const paginated = displayedSections.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    );

    const statCards = [
        {
            label: "Total Sections",
            value: sections.length,
            icon: <FolderIcon className="w-5 h-5 text-neutral-300" />,
        },
        {
            label: "Published",
            value: publishedSections.length,
            icon: <EyeIcon className="w-5 h-5 text-neutral-300" />,
        },
        {
            label: "Archived",
            value: archivedSections.length,
            icon: <ArchiveIcon className="w-5 h-5 text-neutral-300" />,
        },
    ];

    const getSectionName = (sortOrder) => {
        const opt = SECTION_OPTIONS.find((o) => o.id === Number(sortOrder));
        return opt ? opt.name : "Unknown Section";
    };

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10">
            {/* Header & Stats */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Manage your About Us page content and imagery.
                    </p>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/about"
                            className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-50 hover:text-black hover:border-neutral-300 active:scale-95"
                        >
                            View Site
                        </Link>
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                if (showForm) resetForm();
                            }}
                            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 active:scale-95 cursor-pointer"
                        >
                            {showForm ? "Cancel" : "+ New Section"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px]"
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

            {/* FORM */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        key="about-form-wrapper"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: smoothEase }}
                        className="overflow-hidden"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-200 mb-6"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                                    {editing
                                        ? "Edit Section"
                                        : "Create New Section"}
                                </h2>
                                {editing && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold uppercase tracking-widest">
                                        Editing
                                    </span>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* TITLE */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between mb-1.5">
                                            <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                Title *
                                            </label>
                                            {formErrors.title && (
                                                <span className="text-[10px] font-bold text-red-500 uppercase">
                                                    {formErrors.title}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            placeholder="e.g. About the Artist"
                                            value={form.title}
                                            onChange={(e) => {
                                                setForm({
                                                    ...form,
                                                    title: e.target.value,
                                                });
                                                if (formErrors.title)
                                                    setFormErrors({
                                                        ...formErrors,
                                                        title: null,
                                                    });
                                            }}
                                            className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white ${
                                                formErrors.title
                                                    ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                    : "border-neutral-200 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                            }`}
                                        />
                                    </div>

                                    {/* SECTION SLOT (Animated Select) */}
                                    <div className="w-full">
                                        <AnimatedSelect
                                            label="Section Slot"
                                            required={true}
                                            placeholder="Select where this appears"
                                            value={form.sort_order}
                                            options={SECTION_OPTIONS}
                                            error={formErrors.sort_order}
                                            className="py-3"
                                            onChange={(id) => {
                                                setForm({
                                                    ...form,
                                                    sort_order: id,
                                                });
                                                if (formErrors.sort_order)
                                                    setFormErrors({
                                                        ...formErrors,
                                                        sort_order: null,
                                                    });
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between mb-1.5">
                                        <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                            Content
                                        </label>
                                        {formErrors.content && (
                                            <span className="text-[10px] font-bold text-red-500 uppercase">
                                                {formErrors.content}
                                            </span>
                                        )}
                                    </div>
                                    <textarea
                                        rows="6"
                                        placeholder="Detailed content for this section..."
                                        value={form.content}
                                        onChange={(e) => {
                                            setForm({
                                                ...form,
                                                content: e.target.value,
                                            });
                                            if (formErrors.content)
                                                setFormErrors({
                                                    ...formErrors,
                                                    content: null,
                                                });
                                        }}
                                        className={`w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-white resize-none ${
                                            formErrors.content
                                                ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                                : "border-neutral-200 bg-neutral-50/50 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                                        }`}
                                    />
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        id="is_published"
                                        checked={form.is_published}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                is_published: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                                    />
                                    <label
                                        htmlFor="is_published"
                                        className="text-sm font-bold text-neutral-700 cursor-pointer select-none"
                                    >
                                        Publish immediately
                                    </label>
                                </div>

                                {/* SINGLE IMAGE UPLOAD */}
                                <div className="pt-6 border-t border-neutral-100">
                                    <div className="space-y-1.5 flex flex-col max-w-xl">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                                Section Image
                                            </label>
                                            {formErrors.cover_image && (
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                                    {formErrors.cover_image}
                                                </span>
                                            )}
                                        </div>
                                        <label
                                            className={`relative flex flex-col items-center justify-center w-full min-h-[200px] border border-dashed rounded-xl cursor-pointer overflow-hidden transition-all ${
                                                formErrors.cover_image
                                                    ? "border-red-400 bg-red-50/50 hover:bg-red-50"
                                                    : "border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100"
                                            }`}
                                        >
                                            {form.cover_image ||
                                            editing?.image ? (
                                                <>
                                                    <img
                                                        src={
                                                            form.cover_image
                                                                ? URL.createObjectURL(
                                                                      form.cover_image,
                                                                  )
                                                                : imageUrl(
                                                                      editing.image,
                                                                  )
                                                        }
                                                        alt="Cover preview"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <UploadIcon className="w-6 h-6 text-white mb-2" />
                                                        <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                                                            Change Image
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <UploadIcon
                                                        className={`w-6 h-6 mx-auto mb-2 ${formErrors.cover_image ? "text-red-400" : "text-neutral-400"}`}
                                                    />
                                                    <p
                                                        className={`text-[11px] font-bold uppercase tracking-widest ${formErrors.cover_image ? "text-red-500" : "text-neutral-500"}`}
                                                    >
                                                        Upload Image
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    setForm({
                                                        ...form,
                                                        cover_image:
                                                            e.target.files[0],
                                                    });
                                                    if (formErrors.cover_image)
                                                        setFormErrors({
                                                            ...formErrors,
                                                            cover_image: null,
                                                        });
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* FORM ACTIONS */}
                                <div className="flex gap-3 pt-6 border-t border-neutral-100">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 rounded-xl bg-black px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                                    >
                                        {updating
                                            ? "Saving..."
                                            : editing
                                              ? "Update Section"
                                              : "Create Section"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar: Tabs & Filters */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
                {/* Tabs */}
                <div className="flex gap-3 w-full lg:w-auto shrink-0">
                    <button
                        onClick={() => {
                            setActiveTab("published");
                            setPage(1);
                            setSelected(null);
                        }}
                        className={`flex-1 lg:flex-none rounded-xl border px-5 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer ${
                            activeTab === "published"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                        }`}
                    >
                        Published ({publishedSections.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("archived");
                            setPage(1);
                            setSelected(null);
                        }}
                        className={`flex-1 lg:flex-none rounded-xl border px-5 py-2.5 text-sm font-medium transition-all focus:outline-none cursor-pointer ${
                            activeTab === "archived"
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:border-neutral-300"
                        }`}
                    >
                        Archived ({archivedSections.length})
                    </button>
                </div>

                {/* Filters OR Bulk Actions */}
                <AnimatePresence mode="wait">
                    {selectedIds.length > 0 ? (
                        <motion.div
                            key="bulk-actions"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2, ease: smoothEase }}
                            className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto bg-neutral-50 px-4 py-2.5 sm:py-0 sm:h-[42px] rounded-xl border border-neutral-200 justify-end"
                        >
                            <span className="text-sm font-bold text-neutral-700 sm:mr-2 whitespace-nowrap">
                                {selectedIds.length} Selected
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {activeTab === "published" ? (
                                    <button
                                        onClick={() => setBulkAction("archive")}
                                        className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-700 hover:border-black hover:text-black transition-all cursor-pointer whitespace-nowrap"
                                    >
                                        Archive All
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() =>
                                                setBulkAction("restore")
                                            }
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            Restore All
                                        </button>
                                        <button
                                            onClick={() =>
                                                setBulkAction("delete")
                                            }
                                            className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            Delete All
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-1.5 text-neutral-400 hover:text-black transition-colors cursor-pointer rounded-lg hover:bg-neutral-200 ml-1 shrink-0"
                                    title="Clear Selection"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="filters"
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: smoothEase }}
                            className="flex flex-col sm:flex-row items-center w-full flex-1 justify-end"
                        >
                            {/* SEARCH BAR */}
                            <motion.div
                                layout
                                className="relative w-full flex-1 min-w-0 mt-3 sm:mt-0"
                            >
                                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search sections..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium placeholder-neutral-400 text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 [font-family:inherit]"
                                />
                            </motion.div>

                            {/* DROPDOWN */}
                            <motion.div
                                layout
                                className="w-full sm:w-auto min-w-[11rem] sm:max-w-[50%] shrink-0 mt-3 sm:mt-0 sm:ml-3"
                            >
                                <AnimatedSelect
                                    value={filterSection}
                                    placeholder="All Sections"
                                    options={SECTION_OPTIONS}
                                    className="py-2.5"
                                    onChange={(id) => {
                                        setFilterSection(id);
                                        setPage(1);
                                    }}
                                />
                            </motion.div>

                            {/* ACTION BUTTONS (Clear & Refresh) */}
                            <motion.div
                                layout
                                className="flex flex-col sm:flex-row items-center w-full sm:w-auto mt-3 sm:mt-0 sm:ml-3"
                            >
                                <AnimatePresence>
                                    {(searchTerm || filterSection !== "") && (
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
                                                transition={{
                                                    duration: 0.25,
                                                    ease: smoothEase,
                                                }}
                                                className="pb-3 sm:pb-0 sm:pr-3 w-full h-full"
                                            >
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm("");
                                                        setFilterSection("");
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

                                <motion.button
                                    layout
                                    transition={{
                                        duration: 0.25,
                                        ease: smoothEase,
                                    }}
                                    onClick={fetchSections}
                                    className="w-full sm:w-[42px] h-[42px] shrink-0 rounded-xl border border-neutral-200 bg-white text-neutral-400 hover:text-black transition-colors flex justify-center items-center cursor-pointer overflow-hidden"
                                    title="Refresh Table"
                                >
                                    <RefreshIcon
                                        className={`w-4 h-4 shrink-0 ${loading ? "animate-spin text-black" : ""}`}
                                    />
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Table & Detail Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
                {/* Table Area */}
                <div className="flex-1 flex flex-col rounded-2xl border border-neutral-200 bg-white relative overflow-hidden">
                    {/* TABLE-ONLY LOADING OVERLAY */}
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
                                    Fetching Content
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        {!loading && paginated.length === 0 ? (
                            <div className="flex flex-col h-full min-h-[400px] items-center justify-center text-center p-8 gap-4">
                                <FolderIcon className="w-12 h-12 text-neutral-300" />
                                <div>
                                    <p className="text-base font-bold text-neutral-900">
                                        No sections found
                                    </p>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">
                                        {searchTerm || filterSection !== ""
                                            ? "No sections match your current filters."
                                            : "You don't have any content in this tab yet."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-neutral-50 border-b border-neutral-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-4 px-5 w-12 align-middle">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    paginated.length > 0 &&
                                                    selectedIds.length ===
                                                        paginated.length
                                                }
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Title
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Section Slot
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase w-1/3 hidden lg:table-cell">
                                            Content Preview
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Status
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginated.map((s) => (
                                        <tr
                                            key={s.id}
                                            onClick={() => setSelected(s)}
                                            className={`group cursor-pointer transition-colors hover:bg-neutral-50 h-[73px] ${
                                                selected?.id === s.id
                                                    ? "bg-neutral-50"
                                                    : ""
                                            }`}
                                        >
                                            <td
                                                className="py-4 px-5 align-middle"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(
                                                        s.id,
                                                    )}
                                                    onChange={() =>
                                                        handleSelect(s.id)
                                                    }
                                                    className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-4 px-5 align-middle">
                                                <div className="flex items-center gap-4">
                                                    {s.image ? (
                                                        <img
                                                            src={imageUrl(
                                                                s.image,
                                                            )}
                                                            alt={s.title}
                                                            className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                                                            <ImagesIcon className="w-4 h-4 text-neutral-300" />
                                                        </div>
                                                    )}
                                                    <p className="text-sm font-bold text-neutral-900 truncate max-w-[180px]">
                                                        {s.title}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-middle">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-white text-neutral-600 border-neutral-200 mt-1 capitalize">
                                                    {getSectionName(
                                                        s.sort_order,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 align-middle hidden lg:table-cell">
                                                <p className="text-[12px] font-medium text-neutral-500 truncate max-w-[200px] xl:max-w-[300px]">
                                                    {s.content || "—"}
                                                </p>
                                            </td>
                                            <td className="py-4 px-5 align-middle">
                                                {s.is_published ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700 mt-1">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{" "}
                                                        Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-neutral-200 bg-neutral-100 text-neutral-500 mt-1">
                                                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>{" "}
                                                        Archived
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className="py-4 px-5 align-middle text-right"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex justify-end gap-2 mt-1">
                                                    <button
                                                        onClick={() =>
                                                            handleEdit(s)
                                                        }
                                                        className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-700 transition-all hover:border-black hover:text-black cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    {activeTab ===
                                                    "published" ? (
                                                        <button
                                                            onClick={() =>
                                                                setArchiveId(
                                                                    s.id,
                                                                )
                                                            }
                                                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 cursor-pointer"
                                                        >
                                                            Archive
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleRestore(
                                                                        s.id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:border-blue-400 hover:text-blue-700 cursor-pointer"
                                                            >
                                                                Restore
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setDeleteId(
                                                                        s.id,
                                                                    )
                                                                }
                                                                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-all hover:border-red-400 hover:text-red-700 cursor-pointer"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50/50 mt-auto rounded-b-2xl">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                    Prev
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase transition-colors hover:border-neutral-300 hover:text-black disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDE-DRAWER PANEL FOR ABOUT DETAILS */}
            <AnimatePresence>
                {selected && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="detail-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[70] cursor-pointer"
                            onClick={() => setSelected(null)}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="detail-drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={drawerTransition}
                            className="fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-white z-[80] flex flex-col border-l border-neutral-200 [font-family:var(--font-neue)]"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">
                                    Section Details
                                </h3>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="text-neutral-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                <div>
                                    {selected.image ? (
                                        <img
                                            src={imageUrl(selected.image)}
                                            alt={selected.title}
                                            className="w-full h-48 object-cover rounded-xl border border-neutral-200 mb-4"
                                        />
                                    ) : (
                                        <div className="w-full h-48 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center mb-4">
                                            <ImagesIcon className="w-8 h-8 text-neutral-300" />
                                        </div>
                                    )}
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">
                                        Title
                                    </p>
                                    <p className="text-2xl font-black text-neutral-900 leading-tight">
                                        {selected.title || "Untitled"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Section Slot
                                        </p>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-white text-neutral-600 border-neutral-200">
                                            {getSectionName(
                                                selected.sort_order,
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                            Status
                                        </p>
                                        {selected.is_published ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-neutral-200 bg-neutral-100 text-neutral-500">
                                                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                                                Archived
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                        Content
                                    </p>
                                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                                        <p className="text-sm font-medium text-neutral-800 leading-relaxed whitespace-pre-wrap">
                                            {selected.content ||
                                                "No content provided."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 space-y-3 shrink-0">
                                <button
                                    onClick={() => {
                                        handleEdit(selected);
                                        setSelected(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
                                >
                                    Edit Section
                                </button>

                                <div className="flex gap-2">
                                    {activeTab === "published" ? (
                                        <button
                                            onClick={() => {
                                                setArchiveId(selected.id);
                                                setSelected(null);
                                            }}
                                            disabled={updating}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:border-neutral-300 disabled:opacity-50 cursor-pointer"
                                        >
                                            <ArchiveIcon className="w-4 h-4" />{" "}
                                            Archive
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleRestore(selected.id);
                                                setSelected(null);
                                            }}
                                            disabled={updating}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:border-neutral-300 disabled:opacity-50 cursor-pointer"
                                        >
                                            <RestoreIcon className="w-4 h-4" />{" "}
                                            Restore
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            setDeleteId(selected.id);
                                            setSelected(null);
                                        }}
                                        className="flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 text-red-600 transition-all hover:border-red-400 hover:text-red-700 px-4 py-3.5 cursor-pointer"
                                        title="Delete Section"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* SINGLE ARCHIVE MODAL */}
            <AnimatePresence>
                {archiveId && (
                    <motion.div
                        key="modal-archive"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setArchiveId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto"
                        >
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                                <ArchiveIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">
                                Archive Section?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                This content will be hidden from the website.
                                You can restore it later.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={confirmArchive}
                                    disabled={updating}
                                    className="w-full rounded-full bg-black px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                                >
                                    {updating
                                        ? "Archiving..."
                                        : "Yes, archive it"}
                                </button>
                                <button
                                    onClick={() => setArchiveId(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SINGLE DELETE PERMANENTLY MODAL */}
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
                            onClick={() => setDeleteId(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto"
                        >
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <TrashIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2">
                                Delete Permanently?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                This action cannot be undone and will
                                permanently remove this section.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={confirmDelete}
                                    disabled={updating}
                                    className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                                >
                                    {updating
                                        ? "Deleting..."
                                        : "Yes, delete it"}
                                </button>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BULK ACTION MODAL */}
            <AnimatePresence>
                {bulkAction && (
                    <motion.div
                        key="modal-bulk"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 [font-family:var(--font-neue)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="absolute inset-0 bg-black/20 cursor-pointer"
                            onClick={() => setBulkAction(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={springTransition}
                            className="relative w-full max-w-sm rounded-[2rem] bg-white p-8 border border-neutral-100 text-center pointer-events-auto"
                        >
                            <div
                                className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${bulkAction === "delete" ? "bg-red-50 text-red-600" : bulkAction === "archive" ? "bg-neutral-100 text-neutral-600" : "bg-blue-50 text-blue-600"}`}
                            >
                                {bulkAction === "delete" ? (
                                    <TrashIcon className="w-6 h-6" />
                                ) : bulkAction === "archive" ? (
                                    <ArchiveIcon className="w-6 h-6" />
                                ) : (
                                    <RestoreIcon className="w-6 h-6" />
                                )}
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 mb-2 capitalize">
                                {bulkAction} {selectedIds.length} items?
                            </h3>
                            <p className="text-sm font-medium text-neutral-500 mb-8">
                                {bulkAction === "delete"
                                    ? "This action cannot be undone and will permanently remove these items."
                                    : bulkAction === "archive"
                                      ? "These items will be hidden from the website."
                                      : "These items will be restored to the website."}
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={confirmBulkAction}
                                    disabled={updating}
                                    className={`w-full rounded-full px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer ${bulkAction === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-neutral-800"}`}
                                >
                                    {updating
                                        ? "Processing..."
                                        : `Yes, ${bulkAction} all`}
                                </button>
                                <button
                                    onClick={() => setBulkAction(null)}
                                    className="w-full rounded-full bg-transparent px-4 py-3.5 text-sm font-bold text-neutral-400 transition-all hover:text-neutral-900 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        key="toast-success"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={springTransition}
                        className="fixed bottom-10 right-10 z-[110] pointer-events-none [font-family:var(--font-neue)]"
                    >
                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border bg-black text-white border-black">
                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5">
                                {successMessage}
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

function FolderIcon({ className = "w-4 h-4" }) {
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
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

function TrashIcon({ className = "w-4 h-4" }) {
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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function UploadIcon({ className = "w-4 h-4" }) {
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}

function ImagesIcon({ className = "w-4 h-4" }) {
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
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
