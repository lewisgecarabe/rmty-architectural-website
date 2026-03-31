import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

/* ---------------- CONFIG ---------------- */
const PAGE_SIZE = 6;

/* ---------------- COMPONENT ---------------- */
export default function AdminContentProjects() {
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState(null);

    const [form, setForm] = useState({
        title: "",
        category_id: "",
        location: "",
        description: "",
        cover_image: null,
        gallery: [],
        is_published: true,
    });

    const [existingGallery, setExistingGallery] = useState([]);
    const [deletingImageId, setDeletingImageId] = useState(null);

    const [activeTab, setActiveTab] = useState("published");
    const [successMessage, setSuccessMessage] = useState("");

    // Action menu dropdown state for individual rows
    const [openMenuId, setOpenMenuId] = useState(null);
    const [selected, setSelected] = useState(null);

    /* ---------------- FETCH ---------------- */
    useEffect(() => {
        const init = async () => {
            await fetch("/sanctum/csrf-cookie", { credentials: "include" });
            await fetchAll();
        };
        init();
    }, []);

    // Close action dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchProjects(), fetchCategories()]);
        setLoading(false);
    };

    const fetchProjects = async () => {
        const res = await fetch("/api/admin/projects", {
            credentials: "include",
            headers: getAuthHeaders(),
        });
        const data = await res.json();
        setProjects(data);
    };

    const fetchCategories = async () => {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
    };

    /* ---------------- FORM ---------------- */
    const resetForm = () => {
        setForm({
            title: "",
            category_id: "",
            location: "",
            description: "",
            cover_image: null,
            gallery: [],
            is_published: true,
        });
        setEditing(null);
        setExistingGallery([]);
        setShowForm(false);
    };

    const handleEdit = (project) => {
        setEditing(project);
        setForm({
            title: project.title,
            category_id: project.category_id,
            location: project.location || "",
            description: project.description || "",
            cover_image: null,
            gallery: [],
            is_published: project.is_published,
        });

        const existing = (project.images ?? []).map((img, i) => ({
            id: img.id,
            url: project.gallery_images?.[i] ?? img.image_path,
        }));
        setExistingGallery(existing);

        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleRemoveGalleryImage = async (imageId) => {
        if (!editing) return;
        setDeletingImageId(imageId);
        try {
            const res = await fetch(
                `/api/projects/${editing.id}/gallery/${imageId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        ...getAuthHeaders(),
                        Accept: "application/json",
                    },
                },
            );
            if (res.ok) {
                setExistingGallery((prev) =>
                    prev.filter((img) => img.id !== imageId),
                );
                setEditing((prev) => ({
                    ...prev,
                    gallery_images:
                        prev.gallery_images?.filter(
                            (_, i) =>
                                (prev.images?.[i]?.id ?? null) !== imageId,
                        ) ?? [],
                    images:
                        prev.images?.filter((img) => img.id !== imageId) ?? [],
                }));
            } else {
                alert("Failed to delete image. Please try again.");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setDeletingImageId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("category_id", form.category_id);
        fd.append("location", form.location);
        fd.append("description", form.description);
        fd.append("is_published", form.is_published ? 1 : 0);

        if (form.cover_image) {
            fd.append("cover_image", form.cover_image);
        }

        if (form.gallery.length > 0) {
            form.gallery.forEach((file) => {
                fd.append("gallery[]", file);
            });
        }

        const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
        if (editing) fd.append("_method", "PUT");

        const res = await fetch(url, {
            method: "POST",
            body: fd,
            credentials: "include",
            headers: { ...getAuthHeaders(), Accept: "application/json" },
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("Submit error:", err);
            alert("Something went wrong. Check console for details.");
            return;
        }

        await fetchProjects();
        resetForm();

        setSuccessMessage(
            editing
                ? "Project Updated Successfully"
                : "Project Created Successfully",
        );
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleArchive = async (id) => setDeleteId(id);

    const confirmArchive = async () => {
        if (!deleteId) return;
        const fd = new FormData();
        fd.append("_method", "PUT");
        fd.append("is_published", 0);
        await fetch(`/api/projects/${deleteId}`, {
            method: "POST",
            body: fd,
            credentials: "include",
            headers: getAuthHeaders(),
        });
        setSuccessMessage("Project Archived Successfully");
        fetchProjects();
        setDeleteId(null);
        if (selected?.id === deleteId) setSelected(null);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleRestore = async (id) => {
        const fd = new FormData();
        fd.append("_method", "PUT");
        fd.append("is_published", 1);
        await fetch(`/api/projects/${id}`, {
            method: "POST",
            body: fd,
            credentials: "include",
            headers: getAuthHeaders(),
        });
        setSuccessMessage("Project Restored Successfully");
        fetchProjects();
        if (selected?.id === id) setSelected(null);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    /* ---------------- COMPUTED DATA ---------------- */
    const publishedProjects = projects.filter((p) => p.is_published);
    const archivedProjects = projects.filter((p) => !p.is_published);
    const displayedProjects =
        activeTab === "published" ? publishedProjects : archivedProjects;

    /* ---------------- PAGINATION ---------------- */
    const totalPages = Math.max(
        1,
        Math.ceil(displayedProjects.length / PAGE_SIZE),
    );
    const paginated = displayedProjects.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE,
    );

    const statCards = [
        {
            label: "Total Projects",
            value: projects.length,
            icon: <FolderIcon className="w-5 h-5 text-neutral-300" />,
        },
        {
            label: "Published",
            value: publishedProjects.length,
            icon: <EyeIcon className="w-5 h-5 text-neutral-300" />,
        },
        {
            label: "Archived",
            value: archivedProjects.length,
            icon: <ArchiveIcon className="w-5 h-5 text-neutral-300" />,
        },
    ];

    if (loading && projects.length === 0) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center [font-family:var(--font-neue)]">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        // NOTE: We removed `h-full` and `overflow-hidden` so the page naturally scrolls
        // when the form pushes the table down.
        <div className="flex flex-col gap-6 lg:gap-8 pb-12 [font-family:var(--font-neue)] min-h-screen">
            {/* Header & Subtitle */}
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Manage your portfolio projects and content.
                    </p>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/projects"
                            className="flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm font-bold text-neutral-700 transition-all hover:bg-neutral-50 active:scale-95 cursor-pointer"
                        >
                            <EyeIcon className="w-4 h-4" />
                            View Site
                        </Link>
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                if (showForm) resetForm();
                            }}
                            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 active:scale-95 cursor-pointer"
                        >
                            {showForm ? "Cancel" : "+ New Project"}
                        </button>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div>{s.icon}</div>
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
                    <motion.form
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl p-6 md:p-8 border border-neutral-200 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                                {editing
                                    ? "Edit Project"
                                    : "Create New Project"}
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
                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                        Title *
                                    </label>
                                    <input
                                        required
                                        placeholder="Enter project title"
                                        value={form.title}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                title: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                                    />
                                </div>

                                {/* CATEGORY */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                        Category *
                                    </label>
                                    <select
                                        required
                                        value={form.category_id}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                category_id: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="">
                                            Select a category
                                        </option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-neutral-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* LOCATION */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                    Location
                                </label>
                                <input
                                    placeholder="Project location"
                                    value={form.location}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            location: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                    Description
                                </label>
                                <textarea
                                    rows="4"
                                    placeholder="Project description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            description: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white resize-none"
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

                            {/* IMAGE UPLOADS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                                {/* COVER IMAGE */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                        Cover Image
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-36 border border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors">
                                        <div className="text-center p-4">
                                            {!form.cover_image &&
                                            editing?.cover_image ? (
                                                <img
                                                    src={editing.cover_image}
                                                    alt="Current cover"
                                                    className="w-16 h-16 object-cover rounded-lg mx-auto mb-2 border border-neutral-200"
                                                />
                                            ) : (
                                                <UploadIcon className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                                            )}
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                                                {form.cover_image
                                                    ? form.cover_image.name
                                                    : editing?.cover_image
                                                      ? "Replace Image"
                                                      : "Upload Image"}
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    cover_image:
                                                        e.target.files[0],
                                                })
                                            }
                                        />
                                    </label>
                                </div>

                                {/* GALLERY IMAGES */}
                                <div className="space-y-1.5">
                                    <label className="flex justify-between items-center text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                                        <span>Gallery Images</span>
                                        {existingGallery.length > 0 && (
                                            <span className="text-neutral-400 normal-case tracking-normal">
                                                ({existingGallery.length}{" "}
                                                Existing)
                                            </span>
                                        )}
                                    </label>
                                    <label className="flex flex-col items-center justify-center w-full h-36 border border-dashed border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100 rounded-xl cursor-pointer transition-colors">
                                        <div className="text-center p-4">
                                            <ImagesIcon className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                                                {form.gallery.length > 0
                                                    ? `${form.gallery.length} New Selected`
                                                    : "Upload Gallery"}
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    gallery: [
                                                        ...form.gallery,
                                                        ...e.target.files,
                                                    ],
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* GALLERY PREVIEWS */}
                            {(existingGallery.length > 0 ||
                                form.gallery.length > 0) && (
                                <div className="pt-4 space-y-4">
                                    {existingGallery.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2">
                                                Existing Gallery
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {existingGallery.map((img) => (
                                                    <div
                                                        key={img.id}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={img.url}
                                                            alt="Gallery"
                                                            className="w-16 h-16 object-cover rounded-xl border border-neutral-200"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveGalleryImage(
                                                                    img.id,
                                                                )
                                                            }
                                                            disabled={
                                                                deletingImageId ===
                                                                img.id
                                                            }
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-neutral-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                                                            title="Remove image"
                                                        >
                                                            {deletingImageId ===
                                                            img.id ? (
                                                                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <CloseIcon className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {form.gallery.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2">
                                                New Uploads
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                {form.gallery.map((file, i) => (
                                                    <div
                                                        key={i}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(
                                                                file,
                                                            )}
                                                            alt={`New ${i + 1}`}
                                                            className="w-16 h-16 object-cover rounded-xl border-2 border-black"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setForm(
                                                                    (f) => ({
                                                                        ...f,
                                                                        gallery:
                                                                            f.gallery.filter(
                                                                                (
                                                                                    _,
                                                                                    idx,
                                                                                ) =>
                                                                                    idx !==
                                                                                    i,
                                                                            ),
                                                                    }),
                                                                )
                                                            }
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-neutral-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 cursor-pointer"
                                                        >
                                                            <CloseIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* FORM ACTIONS */}
                            <div className="flex gap-3 pt-6 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-black transition-colors hover:bg-neutral-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-black px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-neutral-800 cursor-pointer"
                                >
                                    {editing
                                        ? "Update Project"
                                        : "Create Project"}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Filters */}
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
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                    Published ({publishedProjects.length})
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
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                    Archived ({archivedProjects.length})
                </button>
            </div>

            {/* Table & Detail Layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Table Area */}
                <div className="flex-1 w-full rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                        {paginated.length === 0 ? (
                            <div className="flex flex-col h-40 items-center justify-center text-center p-8">
                                <FolderIcon className="w-12 h-12 text-neutral-300 mb-4" />
                                <p className="text-base font-bold text-neutral-900">
                                    No projects found
                                </p>
                                <p className="text-sm font-medium text-neutral-500 mt-1">
                                    You don't have any projects in this tab yet.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-white border-b border-neutral-100">
                                    <tr>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Title
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                            Category
                                        </th>
                                        <th className="py-4 px-5 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase hidden md:table-cell">
                                            Gallery
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
                                    {paginated.map((p) => (
                                        <tr
                                            key={p.id}
                                            onClick={() =>
                                                setSelected(
                                                    selected?.id === p.id
                                                        ? null
                                                        : p,
                                                )
                                            }
                                            className={`group cursor-pointer transition-colors hover:bg-neutral-50 ${
                                                selected?.id === p.id
                                                    ? "bg-neutral-50"
                                                    : ""
                                            }`}
                                        >
                                            <td className="py-4 px-5 align-middle">
                                                <div className="flex items-center gap-4">
                                                    {p.cover_image ? (
                                                        <img
                                                            src={p.cover_image}
                                                            alt={p.title}
                                                            className="w-10 h-10 object-cover rounded-lg border border-neutral-200"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                                                            <ImagesIcon className="w-4 h-4 text-neutral-300" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-900 truncate max-w-[200px]">
                                                            {p.title}
                                                        </p>
                                                        {p.location && (
                                                            <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[200px] mt-0.5 tracking-wide">
                                                                {p.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-middle">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                                    {p.category?.name ||
                                                        "Uncategorized"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 align-middle hidden md:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <ImagesIcon className="w-4 h-4 text-neutral-400" />
                                                    <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">
                                                        {p.gallery_images
                                                            ?.length ??
                                                            p.images?.length ??
                                                            0}{" "}
                                                        Photo(s)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-5 align-middle">
                                                {p.is_published ? (
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
                                            </td>
                                            <td
                                                className="py-4 px-5 align-middle text-right"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex justify-end mt-0.5">
                                                    <button
                                                        onClick={() =>
                                                            setOpenMenuId(
                                                                openMenuId ===
                                                                    p.id
                                                                    ? null
                                                                    : p.id,
                                                            )
                                                        }
                                                        className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 transition-colors outline-none"
                                                    >
                                                        <KebabIcon className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Frameless Action Dropdown */}
                                                <AnimatePresence>
                                                    {openMenuId === p.id && (
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
                                                            className="absolute right-8 top-10 z-50 w-40 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-neutral-100 py-2 rounded-xl"
                                                        >
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(
                                                                        p,
                                                                    );
                                                                    setOpenMenuId(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                                            >
                                                                Edit Project
                                                            </button>
                                                            {activeTab ===
                                                            "published" ? (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleArchive(
                                                                            p.id,
                                                                        );
                                                                        setOpenMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                                >
                                                                    Archive
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleRestore(
                                                                            p.id,
                                                                        );
                                                                        setOpenMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
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
                        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100 bg-neutral-50/50">
                            <p className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-bold tracking-widest text-black uppercase transition-colors hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Animated Detail Panel (Sticky on Desktop) */}
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
                            className="flex-shrink-0 lg:sticky lg:top-4"
                        >
                            <div className="w-[320px] bg-white rounded-2xl border border-neutral-200 flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]">
                                {/* Panel Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">
                                        Project Details
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
                                        {selected.cover_image ? (
                                            <img
                                                src={selected.cover_image}
                                                alt={selected.title}
                                                className="w-full h-36 object-cover rounded-xl border border-neutral-200 mb-4"
                                            />
                                        ) : (
                                            <div className="w-full h-36 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-center mb-4">
                                                <ImagesIcon className="w-8 h-8 text-neutral-300" />
                                            </div>
                                        )}
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">
                                            Title
                                        </p>
                                        <p className="text-xl font-black text-neutral-900 leading-tight">
                                            {selected.title || "Untitled"}
                                        </p>
                                        {selected.location && (
                                            <p className="text-sm font-medium text-neutral-600 mt-1">
                                                {selected.location}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Category
                                            </p>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                                {selected.category?.name ||
                                                    "Uncategorized"}
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
                                            Description
                                        </p>
                                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                                            <p className="text-sm font-medium text-neutral-800 leading-relaxed whitespace-pre-wrap">
                                                {selected.description ||
                                                    "No description provided."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detail Panel Gallery Previews */}
                                    {((selected.gallery_images &&
                                        selected.gallery_images.length > 0) ||
                                        (selected.images &&
                                            selected.images.length > 0)) && (
                                        <div>
                                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">
                                                Gallery
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {(
                                                    selected.gallery_images ||
                                                    selected.images
                                                ).map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={
                                                            typeof img ===
                                                            "string"
                                                                ? img
                                                                : img.image_path
                                                        }
                                                        alt={`Gallery ${i}`}
                                                        className="w-14 h-14 object-cover rounded-lg border border-neutral-200"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Panel Actions */}
                                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            handleEdit(selected);
                                            setSelected(null);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-neutral-800 active:scale-[0.98]"
                                    >
                                        Edit Project
                                    </button>

                                    <div className="flex gap-2">
                                        {activeTab === "published" ? (
                                            <button
                                                onClick={() => {
                                                    handleArchive(selected.id);
                                                    setSelected(null);
                                                }}
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 disabled:opacity-50"
                                            >
                                                <ArchiveIcon className="w-4 h-4" />
                                                Archive
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    handleRestore(selected.id);
                                                    setSelected(null);
                                                }}
                                                disabled={updating}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 disabled:opacity-50"
                                            >
                                                <RestoreIcon className="w-4 h-4" />
                                                Restore
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                setDeleteId(selected.id);
                                            }}
                                            className="flex-shrink-0 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 transition-all hover:bg-red-100"
                                            title="Delete Project"
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

            {/* DELETE/ARCHIVE MODAL */}
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
                        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none [font-family:var(--font-neue)]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="w-full max-w-sm rounded-[2rem] bg-white p-8 pointer-events-auto border border-neutral-100 text-center"
                            >
                                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                                    <ArchiveIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 mb-2">
                                    Archive Project?
                                </h3>
                                <p className="text-sm font-medium text-neutral-500 mb-8">
                                    The project will be hidden from the website.
                                    You can restore it later.
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={confirmArchive}
                                        disabled={updating}
                                        className="w-full rounded-full bg-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {updating
                                            ? "Archiving..."
                                            : "Yes, archive it"}
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
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-10 right-10 z-50 pointer-events-none"
                    >
                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl border bg-black text-white border-black">
                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                            <p className="text-[11px] font-bold tracking-widest uppercase">
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

function KebabIcon({ className = "w-5 h-5" }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
        </svg>
    );
}
