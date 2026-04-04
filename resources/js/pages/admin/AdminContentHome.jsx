import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

/* ---------------- HELPERS ---------------- */
const springTransition = { type: "spring", damping: 25, stiffness: 300 };

/* ---------------- IMAGE PLACEHOLDER COMPONENT ---------------- */
function InputField({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    isTextArea = false,
}) {
    const inputClasses = `w-full rounded-xl border px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50/50 ${
        error
            ? "border-red-400 bg-red-50/50 focus:border-red-500 text-red-900"
            : "border-neutral-200 bg-white focus:border-neutral-900"
    }`;
    return (
        <div className="space-y-1.5 w-full flex flex-col h-full">
            <div className="flex justify-between items-center mb-1.5">
                {/* Removed the * since it's now optional */}
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
                {error && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                        Required
                    </span>
                )}
            </div>
            {isTextArea ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    rows={4}
                    className={`${inputClasses} resize-none flex-1`}
                />
            ) : (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={inputClasses}
                />
            )}
        </div>
    );
}

function ImagePlaceholder({ label, previewUrl, onChange, error }) {
    const fileInputRef = useRef(null);
    return (
        <div className="space-y-1.5 flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-1.5">
                {/* Removed the * since it's now optional */}
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
                {error && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                        Required
                    </span>
                )}
            </div>
            <label
                className={`relative flex flex-col items-center justify-center w-full flex-1 min-h-[220px] border border-dashed rounded-xl cursor-pointer overflow-hidden transition-all ${
                    error
                        ? "border-red-400 bg-red-50/50"
                        : "border-neutral-300 bg-neutral-50/50 hover:bg-neutral-100"
                }`}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt={label}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <UploadIcon className="w-6 h-6 text-white mb-2" />
                            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                                Change Image
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full text-neutral-400">
                        <UploadIcon
                            className={`w-6 h-6 mx-auto mb-2 ${error ? "text-red-400" : ""}`}
                        />
                        <p
                            className={`text-[11px] font-bold uppercase tracking-widest ${error ? "text-red-500" : ""}`}
                        >
                            Upload Image
                        </p>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) =>
                        e.target.files[0] && onChange(e.target.files[0])
                    }
                />
            </label>
        </div>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function AdminContentHome() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [form, setForm] = useState({
        hero_title_1: "",
        hero_title_2: "",
        featured_heading: "",
        featured_description: "",
        contact_heading: "",
        contact_email_label: "",
        contact_email: "",
        contact_phone_label: "",
        contact_phone: "",
        contact_address_label: "",
        contact_address: "",
        contact_cta: "",
    });

    const [files, setFiles] = useState({
        hero_image_1: null,
        hero_image_2: null,
        hero_image_3: null,
        contact_image: null,
    });
    const [previews, setPreviews] = useState({
        hero_image_1: null,
        hero_image_2: null,
        hero_image_3: null,
        contact_image: null,
    });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchContent = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/home-content`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) {
                const json = await res.json();
                const data = json?.data || {};
                setForm({
                    hero_title_1: data.hero_title_1 || "",
                    hero_title_2: data.hero_title_2 || "",
                    featured_heading: data.featured_heading || "",
                    featured_description: data.featured_description || "",
                    contact_heading: data.contact_heading || "",
                    contact_email_label: data.contact_email_label || "",
                    contact_email: data.contact_email || "",
                    contact_phone_label: data.contact_phone_label || "",
                    contact_phone: data.contact_phone || "",
                    contact_address_label: data.contact_address_label || "",
                    contact_address: data.contact_address || "",
                    contact_cta: data.contact_cta || "",
                });
                setPreviews({
                    hero_image_1: data.hero_image_1
                        ? `${API_BASE}/storage/${data.hero_image_1}`
                        : null,
                    hero_image_2: data.hero_image_2
                        ? `${API_BASE}/storage/${data.hero_image_2}`
                        : null,
                    hero_image_3: data.hero_image_3
                        ? `${API_BASE}/storage/${data.hero_image_3}`
                        : null,
                    contact_image: data.contact_image
                        ? `${API_BASE}/storage/${data.contact_image}`
                        : null,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setFormErrors({});
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFormErrors({ ...formErrors, [e.target.name]: false });
    };

    const handleImageChange = (k, f) => {
        setFiles({ ...files, [k]: f });
        setPreviews({ ...previews, [k]: URL.createObjectURL(f) });
        setFormErrors({ ...formErrors, [k]: false });
    };

    // OPTIONAL FIELDS VALIDATION
    const validateForm = () => {
        // Because the fields are optional, we don't throw errors anymore.
        setFormErrors({});
        return true;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) return; // Will always pass now

        setSaving(true);
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) =>
            formData.append(key, val || ""),
        );

        // --- EXPLICIT REMOVE COMMAND BLOCK ---
        [
            "hero_image_1",
            "hero_image_2",
            "hero_image_3",
            "contact_image",
        ].forEach((key) => {
            if (files[key]) {
                // If a new file is selected, send it
                formData.append(key, files[key]);
            } else if (!previews[key]) {
                // If the preview is empty (because you clicked Clear Form), send "REMOVE"
                formData.append(key, "REMOVE");
            }
        });

        try {
            const res = await fetch(`${API_BASE}/api/admin/home-content`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    Accept: "application/json",
                },
                body: formData,
            });
            if (res.ok) showToast("Changes Saved Successfully!", "success");
            else throw new Error("Server Error");
        } catch (err) {
            showToast("Failed to save", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Editor
                </p>
            </div>
        );

    const cardClass =
        "bg-white rounded-2xl border border-neutral-200 p-6 md:p-8";
    const sectionHeaderClass =
        "text-xl font-bold tracking-tight text-neutral-900 mb-6 border-b border-neutral-100 pb-4";

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 w-full mx-auto">
            {/* Header / Action Bar */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage landing page assets.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link
                        to="/"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black "
                    >
                        View Site
                    </Link>
                    {/* CLEAR FORM BUTTON */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                            setForm({
                                hero_title_1: "",
                                hero_title_2: "",
                                featured_heading: "",
                                featured_description: "",
                                contact_heading: "",
                                contact_email_label: "",
                                contact_email: "",
                                contact_phone_label: "",
                                contact_phone: "",
                                contact_address_label: "",
                                contact_address: "",
                                contact_cta: "",
                            });
                            setFiles({
                                hero_image_1: null,
                                hero_image_2: null,
                                hero_image_3: null,
                                contact_image: null,
                            });
                            setPreviews({
                                hero_image_1: null,
                                hero_image_2: null,
                                hero_image_3: null,
                                contact_image: null,
                            });
                            setFormErrors({});
                        }}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer transition-colors hover:bg-red-50 text-red-600 hover:border-red-200"
                    >
                        Clear Form
                    </motion.button>

                    {/* SAVE CONFIGURATION BUTTON */}
                    <motion.button
                        whileHover={saving ? {} : { scale: 1.02 }}
                        whileTap={saving ? {} : { scale: 0.97 }}
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-70 cursor-pointer transition-colors hover:bg-neutral-800"
                    >
                        {saving ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1,
                                        ease: "linear",
                                    }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                <span>Saving...</span>
                            </>
                        ) : (
                            "Save Configuration"
                        )}
                    </motion.button>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. HERO SECTION */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Hero Section</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <InputField
                            label="Title Line 1"
                            name="hero_title_1"
                            value={form.hero_title_1}
                            onChange={handleChange}
                            error={formErrors.hero_title_1}
                            placeholder="e.g. RMTY Designs"
                        />
                        <InputField
                            label="Title Line 2"
                            name="hero_title_2"
                            value={form.hero_title_2}
                            onChange={handleChange}
                            error={formErrors.hero_title_2}
                            placeholder="e.g. Studio"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ImagePlaceholder
                            label="Carousel Image 1"
                            previewUrl={previews.hero_image_1}
                            onChange={(f) =>
                                handleImageChange("hero_image_1", f)
                            }
                            error={formErrors.hero_image_1}
                        />
                        <ImagePlaceholder
                            label="Carousel Image 2"
                            previewUrl={previews.hero_image_2}
                            onChange={(f) =>
                                handleImageChange("hero_image_2", f)
                            }
                            error={formErrors.hero_image_2}
                        />
                        <ImagePlaceholder
                            label="Carousel Image 3"
                            previewUrl={previews.hero_image_3}
                            onChange={(f) =>
                                handleImageChange("hero_image_3", f)
                            }
                            error={formErrors.hero_image_3}
                        />
                    </div>
                </div>

                {/* 2. FEATURED PROJECTS */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>
                        Featured Projects Intro
                    </h2>
                    <div className="space-y-6">
                        <InputField
                            label="Section Heading"
                            name="featured_heading"
                            value={form.featured_heading}
                            onChange={handleChange}
                            error={formErrors.featured_heading}
                            placeholder="e.g. Design With Purpose"
                        />
                        <InputField
                            label="Section Description"
                            name="featured_description"
                            value={form.featured_description}
                            onChange={handleChange}
                            error={formErrors.featured_description}
                            isTextArea={true}
                            placeholder="Write a short paragraph..."
                        />
                    </div>
                </div>

                {/* 3. CONTACT SECTION */}
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Contact Section</h2>

                    <div className="space-y-6">
                        {/* Row 1: Headers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField
                                label="Section Heading"
                                name="contact_heading"
                                value={form.contact_heading}
                                onChange={handleChange}
                                error={formErrors.contact_heading}
                                placeholder="e.g. Contact Us"
                            />
                            <InputField
                                label="Call to Action Text"
                                name="contact_cta"
                                value={form.contact_cta}
                                onChange={handleChange}
                                error={formErrors.contact_cta}
                                placeholder="e.g. Let's Talk!"
                            />
                        </div>

                        {/* Row 2: Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-neutral-100 pt-6">
                            <InputField
                                label="Email Label"
                                name="contact_email_label"
                                value={form.contact_email_label}
                                onChange={handleChange}
                                error={formErrors.contact_email_label}
                                placeholder="e.g. Email Address"
                            />
                            <InputField
                                label="Email Value"
                                name="contact_email"
                                value={form.contact_email}
                                onChange={handleChange}
                                error={formErrors.contact_email}
                                placeholder="e.g. hello@studio.com"
                            />
                        </div>

                        {/* Row 3: Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-neutral-100 pt-6">
                            <InputField
                                label="Phone Label"
                                name="contact_phone_label"
                                value={form.contact_phone_label}
                                onChange={handleChange}
                                error={formErrors.contact_phone_label}
                                placeholder="e.g. Phone Number"
                            />
                            <InputField
                                label="Phone Value"
                                name="contact_phone"
                                value={form.contact_phone}
                                onChange={handleChange}
                                error={formErrors.contact_phone}
                                placeholder="e.g. +63 915 896 2275"
                            />
                        </div>

                        {/* Row 4: Address (Now a standard input, NO text area) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-neutral-100 pt-6">
                            <InputField
                                label="Address Label"
                                name="contact_address_label"
                                value={form.contact_address_label}
                                onChange={handleChange}
                                error={formErrors.contact_address_label}
                                placeholder="e.g. Office Location"
                            />
                            <InputField
                                label="Address Value"
                                name="contact_address"
                                value={form.contact_address}
                                onChange={handleChange}
                                error={formErrors.contact_address}
                                placeholder="e.g. 911 Josefina St, Sampaloc, Manila"
                            />
                        </div>

                        {/* Row 5: Full-Width Image Uploader */}
                        <div className="border-t border-neutral-100 pt-6">
                            <ImagePlaceholder
                                label="Contact Cover Image"
                                previewUrl={previews.contact_image}
                                onChange={(f) =>
                                    handleImageChange("contact_image", f)
                                }
                                error={formErrors.contact_image}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
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
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success" ? "bg-black text-white border-black" : "bg-red-600 text-white border-red-700"}`}
                        >
                            {toast.type === "success" ? (
                                <CheckIcon className="text-emerald-400" />
                            ) : (
                                <CloseIcon className="text-white" />
                            )}
                            <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5">
                                {toast.msg}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- ICONS ---------------- */
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
            className={`w-4 h-4 ${className}`}
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
function UploadIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}
