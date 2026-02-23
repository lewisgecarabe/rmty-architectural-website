import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

function imageUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `/storage/${path}`;
}

const IMAGE_SLOTS = [
  { sortOrder: 0, name: "Hero Image", description: "Large image at the top of the About page." },
  { sortOrder: 3, name: "Purpose Image", description: "Image on the right in the Our Purpose section." },
  { sortOrder: 4, name: "Mission Image", description: "Image in the Mission block." },
  { sortOrder: 5, name: "Vision Image", description: "Image in the Vision block." },
  { sortOrder: 6, name: "Artist Image", description: "Large image in the About the Artist section." },
];

const DEFAULT_TITLES = {
  0: "ABOUT US",
  3: "Purpose Image",
  4: "Mission",
  5: "Vision",
  6: "About the Artist",
};

export default function AdminContentAbout() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [popup, setPopup] = useState({ open: false, slot: null, section: null, file: null });
  const previewUrlRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      await fetch("/sanctum/csrf-cookie", { credentials: "include" });
      await fetchSections();
    };
    init();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/about", { credentials: "include", headers: getAuthHeaders() });
      const data = res.ok ? await res.json() : [];
      setSections(Array.isArray(data) ? data : []);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const getSectionBySort = (sortOrder) =>
    sections.find((s) => Number(s.sort_order) === sortOrder) ?? null;

  const openPopup = (slot, file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(file);
    const section = getSectionBySort(slot.sortOrder);
    setPopup({ open: true, slot, section, file });
  };

  const closePopup = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPopup({ open: false, slot: null, section: null, file: null });
    setUploadingSlot(null);
  };

  const handleImageChange = (slot, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openPopup(slot, file);
    e.target.value = "";
  };

  const confirmUpdateImage = async () => {
    if (!popup.slot || !popup.file) return;
    const { slot, section, file } = popup;
    setUploadingSlot(slot.sortOrder);

    const fd = new FormData();
    fd.append("cover_image", file);

    if (section) {
      fd.append("_method", "PUT");
      const res = await fetch(`/api/about/${section.id}`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: { ...getAuthHeaders(), Accept: "application/json" },
      });
      if (!res.ok) {
        alert("Something went wrong");
        setUploadingSlot(null);
        return;
      }
    } else {
      fd.append("title", DEFAULT_TITLES[slot.sortOrder] ?? slot.name);
      fd.append("content", "");
      fd.append("sort_order", slot.sortOrder);
      fd.append("is_published", 1);
      const res = await fetch("/api/about", {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: { ...getAuthHeaders(), Accept: "application/json" },
      });
      if (!res.ok) {
        alert("Something went wrong");
        setUploadingSlot(null);
        return;
      }
    }

    await fetchSections();
    setSuccessMessage(`${slot.name} updated successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);
    closePopup();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading About Content...</p>
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
              About Us — Images
            </h1>
            <p className="text-gray-600 mt-2">Change hero, purpose, mission, vision, and artist images only.</p>
          </div>
          <Link
            to="/about"
            className="px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all hover:shadow-md"
          >
            View Site
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {IMAGE_SLOTS.map((slot) => {
            const section = getSectionBySort(slot.sortOrder);
            const currentImage = section?.image;
            const isUploading = uploadingSlot === slot.sortOrder;
            return (
              <motion.div
                key={slot.sortOrder}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">{slot.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                </div>
                <div className="p-5">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    {currentImage ? (
                      <img
                        src={imageUrl(currentImage)}
                        alt={slot.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <label className="mt-4 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-600">
                      {isUploading ? "Updating…" : "Click to choose image"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleImageChange(slot, e)}
                    />
                  </label>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {popup.open && popup.slot && popup.file && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
            >
              <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Update {popup.slot.name}?</h3>
                <p className="text-sm text-gray-600 mb-4">{popup.slot.description}</p>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6">
                  <img
                    src={previewUrlRef.current}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmUpdateImage}
                    disabled={uploadingSlot !== null}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {uploadingSlot === popup.slot.sortOrder ? "Updating…" : "Update image"}
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
