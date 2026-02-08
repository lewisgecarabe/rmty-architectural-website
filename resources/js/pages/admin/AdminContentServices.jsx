import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getServicesContent,
  setServicesContent,
  DEFAULT_CONTENT,
} from "../../stores/servicesContent";

export default function AdminContentServices() {
  const [content, setContent] = useState(() => getServicesContent());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(getServicesContent());
  }, []);

  const handleChange = (section, field, value) => {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleServiceChange = (index, field, value) => {
    setContent((prev) => ({
      ...prev,
      services: prev.services.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
    setSaved(false);
  };

  const handleAddService = () => {
    setContent((prev) => ({
      ...prev,
      services: [...prev.services, { title: "", content: "" }],
    }));
    setSaved(false);
  };

  const handleRemoveService = (index) => {
    if (content.services.length <= 1) return;
    setContent((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setServicesContent(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset to default content? This cannot be undone.")) {
      setContent(JSON.parse(JSON.stringify(DEFAULT_CONTENT)));
      setServicesContent(DEFAULT_CONTENT);
      setSaved(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Services Content Management
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Edit content displayed on the public{" "}
            <Link to="/services" className="text-neutral-700 underline hover:text-neutral-900">
              /services
            </Link>{" "}
            page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Hero Section */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600">
            Hero Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Title Line 1
              </label>
              <input
                type="text"
                value={content.hero?.titleLine1 ?? ""}
                onChange={(e) => handleChange("hero", "titleLine1", e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Title Line 2
              </label>
              <input
                type="text"
                value={content.hero?.titleLine2 ?? ""}
                onChange={(e) => handleChange("hero", "titleLine2", e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Hero Paragraph
              </label>
              <textarea
                value={content.hero?.paragraph ?? ""}
                onChange={(e) => handleChange("hero", "paragraph", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Section (RMTY Design Architects) */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600">
            Main Section
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Section Heading (use \n for line break)
              </label>
              <textarea
                value={content.section?.heading ?? ""}
                onChange={(e) => handleChange("section", "heading", e.target.value)}
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Section Paragraph
              </label>
              <textarea
                value={content.section?.paragraph ?? ""}
                onChange={(e) => handleChange("section", "paragraph", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Image Path
              </label>
              <input
                type="text"
                value={content.section?.image ?? ""}
                onChange={(e) => handleChange("section", "image", e.target.value)}
                placeholder="/images/SAMPLE PIC.png"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Location Tag
              </label>
              <input
                type="text"
                value={content.section?.locationTag ?? ""}
                onChange={(e) => handleChange("section", "locationTag", e.target.value)}
                placeholder="Tagaytay City"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </section>

        {/* Services Accordion Items */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-600">
              Services Accordion
            </h2>
            <button
              type="button"
              onClick={handleAddService}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              + Add Service
            </button>
          </div>
          <div className="space-y-4">
            {(content.services ?? []).map((item, index) => (
              <div
                key={index}
                className="rounded-md border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    Service {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(index)}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    disabled={content.services.length <= 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleServiceChange(index, "title", e.target.value)}
                    placeholder="e.g. ARCHITECTURE"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  />
                  <textarea
                    value={item.content}
                    onChange={(e) => handleServiceChange(index, "content", e.target.value)}
                    placeholder="Service description..."
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-600">
            CTA Section (See Other Projects)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                CTA Image Path
              </label>
              <input
                type="text"
                value={content.cta?.image ?? ""}
                onChange={(e) => handleChange("cta", "image", e.target.value)}
                placeholder="/images/SOP.png"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Button Text
              </label>
              <input
                type="text"
                value={content.cta?.linkText ?? ""}
                onChange={(e) => handleChange("cta", "linkText", e.target.value)}
                placeholder="SEE OTHER PROJECTS"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                CTA Tag (top-right label)
              </label>
              <input
                type="text"
                value={content.cta?.tag ?? ""}
                onChange={(e) => handleChange("cta", "tag", e.target.value)}
                placeholder="Architecture"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
