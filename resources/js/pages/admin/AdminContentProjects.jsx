import { useEffect, useState } from "react";
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

  // Tracks existing gallery images while editing (so we can remove them individually)
  const [existingGallery, setExistingGallery] = useState([]);
  // imageId → true while that image is being deleted
  const [deletingImageId, setDeletingImageId] = useState(null);

  const [activeTab, setActiveTab] = useState("published");
  const [successMessage, setSuccessMessage] = useState("");

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const init = async () => {
      await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
      await fetchAll();
    };
    init();
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

    // Build existing gallery with id + url so we can delete individually
    // project.images contains the raw image objects with id + image_path
    // project.gallery_images contains the full URLs in the same order
    const existing = (project.images ?? []).map((img, i) => ({
      id:  img.id,
      url: project.gallery_images?.[i] ?? img.image_path,
    }));
    setExistingGallery(existing);

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Remove a single existing gallery image immediately via API */
  const handleRemoveGalleryImage = async (imageId) => {
    if (!editing) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/projects/${editing.id}/gallery/${imageId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAuthHeaders(), Accept: "application/json" },
      });
      if (res.ok) {
        setExistingGallery(prev => prev.filter(img => img.id !== imageId));
        // Also update the editing object so the count in the label stays in sync
        setEditing(prev => ({
          ...prev,
          gallery_images: prev.gallery_images?.filter((_, i) =>
            (prev.images?.[i]?.id ?? null) !== imageId
          ) ?? [],
          images: prev.images?.filter(img => img.id !== imageId) ?? [],
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

    setSuccessMessage(editing ? "Project Updated Successfully" : "Project Created Successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleArchive = async (id) => setDeleteId(id);

  const confirmArchive = async () => {
    if (!deleteId) return;
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("is_published", 0);
    await fetch(`/api/projects/${deleteId}`, {
      method: "POST", body: fd, credentials: "include", headers: getAuthHeaders(),
    });
    setSuccessMessage("Project Archived Successfully");
    fetchProjects();
    setDeleteId(null);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRestore = async (id) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("is_published", 1);
    await fetch(`/api/projects/${id}`, {
      method: "POST", body: fd, credentials: "include", headers: getAuthHeaders(),
    });
    setSuccessMessage("Project Restored Successfully");
    fetchProjects();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  /* ---------------- COMPUTED DATA ---------------- */
  const publishedProjects = projects.filter(p => p.is_published);
  const archivedProjects  = projects.filter(p => !p.is_published);
  const displayedProjects = activeTab === "published" ? publishedProjects : archivedProjects;

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(displayedProjects.length / PAGE_SIZE);
  const paginated  = displayedProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Projects Content...</p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* SUCCESS MESSAGE */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Projects Content Management</h1>
            <p className="text-gray-600 mt-2">Manage your projects and content</p>
          </div>
          <div className="flex gap-3">
            <Link to="/projects" className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all hover:shadow-md">
              View Site
            </Link>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg flex items-center gap-2"
            >
              {showForm ? <><span>✕</span><span>Close</span></> : <><span>+</span><span>New Project</span></>}
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{projects.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{publishedProjects.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Archived</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{archivedProjects.length}</p>
          </div>
        </motion.div>

        {/* FORM */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? "Edit Project" : "Create New Project"}
                </h2>
                {editing && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Editing</span>
                )}
              </div>

              <div className="space-y-5">

                {/* TITLE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    required
                    placeholder="Enter project title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* LOCATION */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    placeholder="Project location"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    rows="4"
                    placeholder="Project description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none resize-none"
                  />
                </div>

                {/* IMAGES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* COVER IMAGE */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="text-center">
                        {!form.cover_image && editing?.cover_image ? (
                          <img
                            src={editing.cover_image}
                            alt="Current cover"
                            className="w-16 h-16 object-cover rounded-lg mx-auto mb-1 border border-gray-200"
                          />
                        ) : (
                          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                        <p className="text-sm text-gray-600">
                          {form.cover_image ? form.cover_image.name : editing?.cover_image ? "Click to replace" : "Click to upload"}
                        </p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={e => setForm({ ...form, cover_image: e.target.files[0] })} />
                    </label>
                  </div>

                  {/* GALLERY IMAGES */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gallery Images
                      {existingGallery.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({existingGallery.length} existing)
                        </span>
                      )}
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          {form.gallery.length > 0
                            ? `${form.gallery.length} new file(s) selected`
                            : existingGallery.length > 0
                              ? "Click to add more images"
                              : "Click to upload"}
                        </p>
                      </div>
                      <input type="file" className="hidden" multiple accept="image/*" onChange={e => setForm({ ...form, gallery: [...e.target.files] })} />
                    </label>

                    {/* EXISTING GALLERY THUMBNAILS WITH REMOVE BUTTON */}
                    {existingGallery.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Existing images — click × to remove</p>
                        <div className="flex flex-wrap gap-2">
                          {existingGallery.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.url}
                                alt="Gallery"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(img.id)}
                                disabled={deletingImageId === img.id}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                                title="Remove image"
                              >
                                {deletingImageId === img.id ? (
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NEW FILES PREVIEW */}
                    {form.gallery.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">New files to upload</p>
                        <div className="flex flex-wrap gap-2">
                          {form.gallery.map((file, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border-2 border-blue-300"
                              />
                              <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, gallery: f.gallery.filter((_, idx) => idx !== i) }))}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all hover:shadow-lg" type="submit">
                  {editing ? "Update Project" : "Create Project"}
                </button>
                <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* TABS */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab("published"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "published" ? "bg-black text-white shadow-md" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Published ({publishedProjects.length})
          </button>
          <button
            onClick={() => { setActiveTab("archived"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "archived" ? "bg-black text-white shadow-md" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Archived ({archivedProjects.length})
          </button>
        </div>

        {/* TABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Gallery</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">
                          {activeTab === "published" ? "No published projects" : "No archived projects"}
                        </p>
                        <p className="text-sm mt-1">
                          {activeTab === "published" ? "Create your first project to get started" : "Archived projects will appear here"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map(p => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.cover_image ? (
                            <img src={p.cover_image} alt={p.title} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <span className="font-semibold text-gray-900">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {p.category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {p.gallery_images?.length ?? 0} photo(s)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.is_published ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {activeTab === "published" ? (
                            <>
                              <button onClick={() => handleEdit(p)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                Edit
                              </button>
                              <button onClick={() => handleArchive(p.id)} className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Archive
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleRestore(p.id)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-6 px-6 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`px-4 py-2 rounded-lg font-medium transition-all ${page === i + 1 ? "bg-black text-white shadow-md" : "border border-gray-300 text-gray-700 hover:bg-white"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          )}
        </motion.div>

      </div>

      {/* ARCHIVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Archive Project?</h3>
                <p className="text-gray-600 text-center mb-6">The project will be moved to Archived and hidden from the website. You can restore it later.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={confirmArchive} className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors">Archive</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}