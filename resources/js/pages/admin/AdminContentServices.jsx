import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

const PAGE_SIZE = 6;

export default function AdminContentServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    is_published: true,
  });
  const [activeTab, setActiveTab] = useState("published");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      await fetch("/sanctum/csrf-cookie", { credentials: "include" });
      await fetchServices();
    };
    init();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", { credentials: "include", headers: getAuthHeaders() });
      const data = res.ok ? await res.json() : [];
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", content: "", is_published: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (service) => {
    setEditing(service);
    setForm({
      title: service.title,
      content: service.content || "",
      is_published: service.is_published,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    fd.append("is_published", form.is_published ? 1 : 0);

    const url = editing ? `/api/services/${editing.id}` : "/api/services";
    if (editing) fd.append("_method", "PUT");

    const res = await fetch(url, {
      method: "POST",
      body: fd,
      credentials: "include",
      headers: { ...getAuthHeaders(), Accept: "application/json" },
    });

    if (!res.ok) {
      alert("Something went wrong");
      return;
    }

    await fetchServices();
    resetForm();
    setSuccessMessage(editing ? "Service Updated Successfully" : "Service Created Successfully");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleArchive = (id) => setDeleteId(id);

  const confirmArchive = async () => {
    if (!deleteId) return;
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("is_published", 0);
    await fetch(`/api/services/${deleteId}`, {
      method: "POST",
      body: fd,
      credentials: "include",
      headers: getAuthHeaders(),
    });
    setSuccessMessage("Service Archived Successfully");
    fetchServices();
    setDeleteId(null);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleRestore = async (id) => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("is_published", 1);
    await fetch(`/api/services/${id}`, {
      method: "POST",
      body: fd,
      credentials: "include",
      headers: getAuthHeaders(),
    });
    setSuccessMessage("Service Restored Successfully");
    fetchServices();
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const publishedServices = services.filter((s) => s.is_published);
  const archivedServices = services.filter((s) => !s.is_published);
  const displayedServices = activeTab === "published" ? publishedServices : archivedServices;
  const totalPages = Math.ceil(displayedServices.length / PAGE_SIZE);
  const paginated = displayedServices.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading Services Content...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Services Content Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your services and content</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/services"
              className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all hover:shadow-md"
            >
              View Site
            </Link>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) resetForm();
              }}
              className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg flex items-center gap-2"
            >
              {showForm ? (
                <>
                  <span>✕</span>
                  <span>Close</span>
                </>
              ) : (
                <>
                  <span>+</span>
                  <span>New Service</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Total Services</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{services.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{publishedServices.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">Archived</p>
            <p className="text-3xl font-bold text-gray-600 mt-1">{archivedServices.length}</p>
          </div>
        </motion.div>

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
                  {editing ? "Edit Service" : "Create New Service"}
                </h2>
                {editing && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Editing
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    required
                    placeholder="e.g. ARCHITECTURE"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                  <textarea
                    rows="4"
                    placeholder="Service description..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    Published (visible on site)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all hover:shadow-lg"
                  type="submit"
                >
                  {editing ? "Update Service" : "Create Service"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab("published"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "published"
                ? "bg-black text-white shadow-md"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Published ({publishedServices.length})
          </button>
          <button
            onClick={() => { setActiveTab("archived"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "archived"
                ? "bg-black text-white shadow-md"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Archived ({archivedServices.length})
          </button>
        </div>

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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">
                          {activeTab === "published" ? "No published services" : "No archived services"}
                        </p>
                        <p className="text-sm mt-1">
                          {activeTab === "published"
                            ? "Create your first service to get started"
                            : "Archived services will appear here"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((s) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{s.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {s.content || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {s.is_published ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {activeTab === "published" ? (
                            <>
                              <button
                                onClick={() => handleEdit(s)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleArchive(s.id)}
                                className="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                Archive
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(s.id)}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-6 px-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      page === i + 1
                        ? "bg-black text-white shadow-md"
                        : "border border-gray-300 text-gray-700 hover:bg-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">Archive Service?</h3>
                <p className="text-gray-600 text-center mb-6">
                  The service will be moved to Archived and hidden from the website. You can restore it later.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmArchive}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
