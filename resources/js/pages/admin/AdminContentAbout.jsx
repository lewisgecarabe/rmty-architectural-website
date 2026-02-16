import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SLOTS = [
  {
    key: 0,
    label: "1. Hero",
    description: "Main title, hero image, and intro paragraph (with year on the right).",
    fields: ["title", "content", "image", "published"],
  },
  {
    key: 1,
    label: "2. Purpose — Left text",
    description: "Short paragraph under “Our Purpose” (left column).",
    fields: ["content", "published"],
  },
  {
    key: 2,
    label: "3. Purpose — Center text",
    description: "Longer paragraph (center column).",
    fields: ["content", "published"],
  },
  {
    key: 3,
    label: "4. Purpose — Image",
    description: "Image in the “Our Purpose” section (right column).",
    fields: ["image", "published"],
  },
  {
    key: 4,
    label: "5. Mission",
    description: "Mission heading, image, and text.",
    fields: ["content", "image", "published"],
  },
  {
    key: 5,
    label: "6. Vision",
    description: "Vision heading, image, and text.",
    fields: ["content", "image", "published"],
  },
  {
    key: 6,
    label: "7. About the Artist",
    description: "Artist image, heading, and paragraphs (use two line breaks for second paragraph).",
    fields: ["title", "content", "image", "published"],
  },
];

const SLOT_TITLES = [
  "Hero",
  "Purpose (Left)",
  "Purpose (Center)",
  "Purpose Image",
  "Mission",
  "Vision",
  "About the Artist",
];

function imageUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `/storage/${path}`;
}

const emptySlotForm = () => ({
  title: "",
  content: "",
  cover_image: null,
  is_published: true,
});

export default function AdminContentAbout() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotForms, setSlotForms] = useState(() => SLOTS.map(() => emptySlotForm()));
  const [savingSlot, setSavingSlot] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const init = async () => {
      await fetch("/sanctum/csrf-cookie", { credentials: "include" });
      await fetchSections();
    };
    init();
  }, []);

  useEffect(() => {
    if (!Array.isArray(sections)) return;
    setSlotForms((prev) =>
      SLOTS.map((slot, i) => {
        const section = sections.find((s) => Number(s.sort_order) === i) ?? null;
        if (!section) return prev[i] ?? emptySlotForm();
        return {
          title: section.title ?? "",
          content: section.content ?? "",
          cover_image: null,
          is_published: section.is_published ?? true,
        };
      })
    );
  }, [sections]);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/about", { credentials: "include" });
      const data = res.ok ? await res.json() : [];
      setSections(Array.isArray(data) ? data : []);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const getSectionBySlotIndex = (i) =>
    sections.find((s) => Number(s.sort_order) === i) ?? null;

  const updateSlotForm = (slotIndex, updates) => {
    setSlotForms((prev) =>
      prev.map((form, i) => (i === slotIndex ? { ...form, ...updates } : form))
    );
  };

  const saveSlot = async (slotIndex) => {
    const form = slotForms[slotIndex];
    const section = getSectionBySlotIndex(slotIndex);
    const fd = new FormData();

    const title = form.title?.trim() || SLOT_TITLES[slotIndex];
    fd.append("title", title);
    fd.append("content", form.content ?? "");
    fd.append("is_published", form.is_published ? 1 : 0);
    fd.append("sort_order", slotIndex);
    if (form.cover_image) fd.append("cover_image", form.cover_image);

    setSavingSlot(slotIndex);

    const url = section ? `/api/about/${section.id}` : "/api/about";
    if (section) {
      fd.append("_method", "PUT");
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        alert("Something went wrong saving this section.");
        return;
      }
      await fetchSections();
      setSuccessMessage(`"${SLOT_TITLES[slotIndex]}" saved.`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setSavingSlot(null);
    }
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
      <div className="max-w-4xl mx-auto">
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
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            About Us Content
          </h1>
          <p className="text-gray-600 mt-2">
            Edit each part of the About page below. Changes match the layout on the site.
          </p>
          <Link
            to="/about"
            className="inline-block mt-4 px-5 py-2.5 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 border border-gray-200 transition-all hover:shadow-md"
          >
            View About Page →
          </Link>
        </motion.div>

        <div className="space-y-6">
          {SLOTS.map((slot, slotIndex) => {
            const form = slotForms[slotIndex] ?? emptySlotForm();
            const section = getSectionBySlotIndex(slotIndex);
            const isSaving = savingSlot === slotIndex;

            return (
              <motion.section
                key={slot.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: slotIndex * 0.03 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-900">{slot.label}</h2>
                  <p className="text-sm text-gray-600 mt-0.5">{slot.description}</p>
                </div>

                <div className="p-6 space-y-4">
                  {slot.fields.includes("title") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateSlotForm(slotIndex, { title: e.target.value })}
                        placeholder={slotIndex === 0 ? "ABOUT US" : slotIndex === 6 ? "ABOUT THE ARTIST." : ""}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                      />
                    </div>
                  )}

                  {slot.fields.includes("content") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                      <textarea
                        rows={slotIndex === 6 ? 5 : 3}
                        value={form.content}
                        onChange={(e) => updateSlotForm(slotIndex, { content: e.target.value })}
                        placeholder="Enter text for this section..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
                      />
                      {slotIndex === 6 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Use two line breaks to separate the two paragraphs on the page.
                        </p>
                      )}
                    </div>
                  )}

                  {slot.fields.includes("image") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                      {section?.image && !form.cover_image && (
                        <div className="mb-2">
                          <img
                            src={imageUrl(section.image)}
                            alt=""
                            className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <p className="text-xs text-gray-500 mt-1">Current image (upload a new file to replace)</p>
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <span className="text-sm text-gray-600">
                          {form.cover_image ? form.cover_image.name : "Click to upload image"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            updateSlotForm(slotIndex, { cover_image: e.target.files[0] ?? null })
                          }
                        />
                      </label>
                    </div>
                  )}

                  {slot.fields.includes("published") && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`published-${slotIndex}`}
                        checked={form.is_published}
                        onChange={(e) =>
                          updateSlotForm(slotIndex, { is_published: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                      <label htmlFor={`published-${slotIndex}`} className="text-sm font-medium text-gray-700">
                        Published (show on site)
                      </label>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => saveSlot(slotIndex)}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save this section"}
                    </button>
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
