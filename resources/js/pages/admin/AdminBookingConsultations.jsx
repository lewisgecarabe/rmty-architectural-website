import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 6;

export default function AdminBookingConsultations() {
  const [consultations] = useState([]); // backend will fill later
  const [activeTab, setActiveTab] = useState("published");
  const [page, setPage] = useState(1);
  const [archiveId, setArchiveId] = useState(null);
  const [successMessage] = useState("");

  /* ---------------- COUNTS ---------------- */

  const totalCount = consultations.length;
  const viewedCount = consultations.filter(c => c.is_viewed).length;
  const archivedCount = consultations.filter(c => !c.is_published).length;

  /* ---------------- FILTER ---------------- */

  const published = consultations.filter((c) => c.is_published);
  const archived = consultations.filter((c) => !c.is_published);

  const displayed =
    activeTab === "published" ? published : archived;

  const totalPages = Math.max(
    1,
    Math.ceil(displayed.length / PAGE_SIZE)
  );

  const paginated = displayed.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            Booking Consultation Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage consultation submissions
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">
              Total Consultations
            </p>
            <h2 className="text-4xl font-bold mt-2">
              {totalCount}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">
              Viewed
            </p>
            <h2 className="text-4xl font-bold mt-2 text-blue-600">
              {viewedCount}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border">
            <p className="text-gray-500 text-sm">
              Archived
            </p>
            <h2 className="text-4xl font-bold mt-2 text-gray-700">
              {archivedCount}
            </h2>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setActiveTab("published");
              setPage(1);
            }}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "published"
                ? "bg-black text-white"
                : "bg-white border"
            }`}
          >
            Published ({published.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("archived");
              setPage(1);
            }}
            className={`px-6 py-3 rounded-lg font-semibold ${
              activeTab === "archived"
                ? "bg-black text-white"
                : "bg-white border"
            }`}
          >
            Archived ({archived.length})
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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {paginated.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    No consultations available.
                  </td>
                </tr>
              )}

              {paginated.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-6 py-4">{c.email}</td>
                  <td className="px-6 py-4">{c.project_type}</td>
                  <td className="px-6 py-4">{c.consultation_date}</td>

                  <td className="px-6 py-4 text-right space-x-2">
                    {/* VIEWED BUTTON (UI ONLY) */}
                    <button className="px-4 py-2 bg-blue-600 text-white rounded">
                      View
                    </button>

                    {/* ARCHIVE BUTTON (UI ONLY) */}
                    <button
                      onClick={() => setArchiveId(c.id)}
                      className="px-4 py-2 bg-gray-700 text-white rounded"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-8">
          <button
            disabled
            className="px-4 py-2 border rounded text-gray-400 cursor-not-allowed"
          >
            Prev
          </button>

          <button className="px-4 py-2 bg-black text-white rounded">
            1
          </button>

          <button
            disabled
            className="px-4 py-2 border rounded text-gray-400 cursor-not-allowed"
          >
            Next
          </button>
        </div>

      </div>

      {/* ARCHIVE MODAL UI ONLY */}
      <AnimatePresence>
        {archiveId && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50"
              onClick={() => setArchiveId(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="bg-white p-8 rounded-xl shadow-xl">
                <h3 className="text-xl font-bold mb-4">
                  Archive Consultation?
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setArchiveId(null)}
                    className="px-6 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-2 bg-orange-600 text-white rounded">
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