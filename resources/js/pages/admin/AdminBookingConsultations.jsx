import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "/api";
export default function AdminBookingConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 });
  const [activeTab, setActiveTab] = useState("active");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [archiveId, setArchiveId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [toast, setToast] = useState("");

  const totalCount = meta.total;
  const viewedCount = consultations.filter((c) => c.is_viewed).length;
  const archivedCount = consultations.filter((c) => c.status === "archived").length;

  /* ---------------- FETCH ---------------- */

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const params = {
        page,
        status: activeTab === "archived" ? "archived" : "active",
      };
      const { data } = await axios.get(`${API_BASE}/consultations`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setConsultations(data.data);
      setMeta({
        total: data.total,
        current_page: data.current_page,
        last_page: data.last_page,
      });
    } catch {
      showToast("Failed to load consultations.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  /* ---------------- TOAST ---------------- */

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ---------------- VIEW ---------------- */

  const handleView = async (consultation) => {
    setViewItem(consultation);
    if (!consultation.is_viewed) {
      try {
        const token = localStorage.getItem("admin_token");
        await axios.patch(
          `${API_BASE}/consultations/${consultation.id}/viewed`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setConsultations((prev) =>
          prev.map((c) =>
            c.id === consultation.id ? { ...c, is_viewed: true } : c
          )
        );
      } catch {
        // silently fail — not critical
      }
    }
  };

  /* ---------------- ARCHIVE ---------------- */

  const handleArchiveConfirm = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.patch(
        `${API_BASE}/consultations/${archiveId}/status`,
        { status: "archived" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setArchiveId(null);
      showToast("Consultation archived successfully.");
      fetchConsultations();
    } catch {
      showToast("Failed to archive consultation.");
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Booking Consultation Management</h1>
          <p className="text-gray-600 mt-2">Manage consultation submissions</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">Total Consultations</p>
            <h2 className="text-4xl font-bold mt-2">{totalCount}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">Viewed</p>
            <h2 className="text-4xl font-bold mt-2 text-blue-600">{viewedCount}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">Archived</p>
            <h2 className="text-4xl font-bold mt-2 text-gray-700">{archivedCount}</h2>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab("active"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "active" ? "bg-black text-white" : "bg-white border"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => { setActiveTab("archived"); setPage(1); }}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "archived" ? "bg-black text-white" : "bg-white border"
            }`}
          >
            Archived
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Project Type</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && consultations.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    No consultations available.
                  </td>
                </tr>
              )}
              {!loading &&
                consultations.map((c) => (
                  <tr
                    key={c.id}
                    className={!c.is_viewed ? "bg-blue-50" : ""}
                  >
                    <td className="px-6 py-4 font-medium">
                      {c.first_name} {c.last_name}
                      {!c.is_viewed && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                    <td className="px-6 py-4 text-sm">{c.project_type}</td>
                    <td className="px-6 py-4 text-sm">{c.consultation_date}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        c.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : c.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : c.status === "declined"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleView(c)}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                      >
                        View
                      </button>
                      {activeTab !== "archived" && (
                        <button
                          onClick={() => setArchiveId(c.id)}
                          className="px-4 py-2 bg-gray-700 text-white rounded text-sm"
                        >
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={meta.current_page === 1}
            className="px-4 py-2 border rounded disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 border rounded ${
                meta.current_page === p ? "bg-black text-white" : ""
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page === meta.last_page}
            className="px-4 py-2 border rounded disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full text-sm shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {viewItem && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setViewItem(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold">Consultation Details</h3>
                  <button
                    onClick={() => setViewItem(null)}
                    className="text-gray-400 hover:text-black text-2xl leading-none"
                  >
                    &times;
                  </button>
                </div>
                <div className="space-y-4 text-sm">
                  <Row label="Name" value={`${viewItem.first_name} ${viewItem.last_name}`} />
                  <Row label="Email" value={viewItem.email} />
                  <Row label="Phone" value={viewItem.phone} />
                  <Row label="Location" value={viewItem.location} />
                  <Row label="Project Type" value={viewItem.project_type} />
                  <Row label="Consultation Date" value={viewItem.consultation_date} />
                  <Row label="Status" value={viewItem.status} />
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Project Details</p>
                    <p className="text-gray-800 leading-relaxed">{viewItem.project_details}</p>
                  </div>
                  {viewItem.file_paths && viewItem.file_paths.length > 0 && (
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Attached Files</p>
                      <ul className="space-y-1">
                        {viewItem.file_paths.map((path, i) => (
                          <li key={i}>
                          
                          < a
                              href={path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm"
                            >
                              File {i + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewItem(null)}
                    className="px-6 py-2 bg-black text-white rounded-lg text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ARCHIVE CONFIRM MODAL */}
      <AnimatePresence>
        {archiveId && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setArchiveId(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full">
                <h3 className="text-xl font-bold mb-2">Archive Consultation?</h3>
                <p className="text-gray-500 text-sm mb-6">
                  This will move the consultation to the archived tab. You can still view it there.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setArchiveId(null)}
                    className="px-6 py-2 border rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleArchiveConfirm}
                    className="px-6 py-2 bg-orange-600 text-white rounded text-sm"
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

function Row({ label, value }) {
  return (
    <div className="flex gap-4">
      <p className="text-gray-500 font-medium w-36 shrink-0">{label}</p>
      <p className="text-gray-800 capitalize">{value}</p>
    </div>
  );
}