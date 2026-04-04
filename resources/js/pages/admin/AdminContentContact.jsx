import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

const springTransition = { type: "spring", damping: 25, stiffness: 300 };

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS = [
    "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
    "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

function InputField({
    label,
    name,
    value,
    onChange,
    placeholder,
    isTextArea = false,
    type = "text",
}) {
    const inputClasses =
        "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50/50 focus:border-neutral-900";

    return (
        <div className="space-y-1.5 w-full flex flex-col h-full">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
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
                    type={type}
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

function SelectField({ label, name, value, onChange, options, placeholder }) {
    const selectClasses =
        "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-all hover:bg-neutral-50/50 focus:border-neutral-900";

    return (
        <div className="space-y-1.5 w-full flex flex-col h-full">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
            </div>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className={selectClasses}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ImagePlaceholder({ label, previewUrl, onChange }) {
    const fileInputRef = useRef(null);

    return (
        <div className="space-y-1.5 flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-500 uppercase">
                    {label}
                </label>
            </div>

            <label className="relative flex flex-col items-center justify-center w-full min-h-[260px] border border-dashed border-neutral-300 rounded-xl cursor-pointer overflow-hidden transition-all bg-neutral-50/50 hover:bg-neutral-100">
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
                        <UploadIcon className="w-6 h-6 mx-auto mb-2" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">
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

export default function AdminContentContact() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const [form, setForm] = useState({
        page_heading: "",
        page_description: "",
        location_label: "",
        address_line_1: "",
        address_line_2: "",
        office_day_from: "Monday",
        office_day_to: "Friday",
        office_time_from: "09:00",
        office_time_to: "18:00",
        phone: "",
        email: "",
    });

    const [files, setFiles] = useState({
        hero_image: null,
    });

    const [previews, setPreviews] = useState({
        hero_image: null,
    });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchContent = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/contact-content`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                const json = await res.json();
                const data = json?.data || {};

                setForm({
                    page_heading: data.page_heading || "",
                    page_description: data.page_description || "",
                    location_label: data.location_label || "",
                    address_line_1: data.address_line_1 || "",
                    address_line_2: data.address_line_2 || "",
                    office_day_from: data.office_day_from || "Monday",
                    office_day_to: data.office_day_to || "Friday",
                    office_time_from: data.office_time_from || "09:00",
                    office_time_to: data.office_time_to || "18:00",
                    phone: data.phone || "",
                    email: data.email || "",
                });

                setPreviews({
                    hero_image: data.hero_image
                        ? `${API_BASE}/storage/${data.hero_image}`
                        : null,
                });
            } else {
                showToast("Failed to load content", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Failed to load content", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (key, file) => {
        setFiles({ ...files, [key]: file });
        setPreviews({ ...previews, [key]: URL.createObjectURL(file) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);

        const formData = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            formData.append(key, value || "");
        });

        if (files.hero_image) {
            formData.append("hero_image", files.hero_image);
        } else if (!previews.hero_image) {
            formData.append("hero_image", "REMOVE");
        }

        try {
            const res = await fetch(`${API_BASE}/api/admin/contact-content`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    Accept: "application/json",
                },
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Save failed");
            }

            showToast("Changes Saved Successfully!", "success");
            fetchContent();
        } catch (err) {
            console.error(err);
            showToast("Failed to save", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center h-64 gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Editor
                </p>
            </div>
        );
    }

    const cardClass =
        "bg-white rounded-2xl border border-neutral-200 p-6 md:p-8";
    const sectionHeaderClass =
        "text-xl font-bold tracking-tight text-neutral-900 mb-6 border-b border-neutral-100 pb-4";

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10 w-full mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <p className="text-sm text-neutral-500 mt-1">
                        Manage contact page content.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Link
                        to="/contact"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black"
                    >
                        View Site
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => {
                            setForm({
                                page_heading: "",
                                page_description: "",
                                location_label: "",
                                address_line_1: "",
                                address_line_2: "",
                                office_day_from: "Monday",
                                office_day_to: "Friday",
                                office_time_from: "09:00",
                                office_time_to: "18:00",
                                phone: "",
                                email: "",
                            });
                            setFiles({ hero_image: null });
                            setPreviews({ hero_image: null });
                        }}
                        className="flex-1 md:flex-none px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer transition-colors hover:bg-red-50 text-red-600 hover:border-red-200"
                    >
                        Clear Form
                    </motion.button>

                    <motion.button
                        whileHover={saving ? {} : { scale: 1.02 }}
                        whileTap={saving ? {} : { scale: 0.97 }}
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-70 cursor-pointer transition-colors hover:bg-neutral-800"
                    >
                        {saving ? "Saving..." : "Save Configuration"}
                    </motion.button>
                </div>
            </div>

            <div className="space-y-8">
                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Contact Intro</h2>

                    <div className="grid grid-cols-1 gap-6">
                        <InputField
                            label="Page Heading"
                            name="page_heading"
                            value={form.page_heading}
                            onChange={handleChange}
                            placeholder="e.g. Connect"
                        />

                        <InputField
                            label="Page Description"
                            name="page_description"
                            value={form.page_description}
                            onChange={handleChange}
                            isTextArea={true}
                            placeholder="e.g. At vero eos et accusamus et iusto odio dignissimos"
                        />
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Contact Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Location Label"
                            name="location_label"
                            value={form.location_label}
                            onChange={handleChange}
                            placeholder="e.g. Metro Manila"
                        />

                        <InputField
                            label="Phone"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="e.g. 0932 454 9434"
                        />

                        <InputField
                            label="Address Line 1"
                            name="address_line_1"
                            value={form.address_line_1}
                            onChange={handleChange}
                            placeholder="e.g. 911 Josefina II, Sampaloc, Manila, 1008"
                        />

                        <InputField
                            label="Address Line 2"
                            name="address_line_2"
                            value={form.address_line_2}
                            onChange={handleChange}
                            placeholder="e.g. Metro Manila"
                        />

                        <div className="md:col-span-2">
                            <InputField
                                label="Email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="e.g. rmty.architects@gmail.com"
                            />
                        </div>
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Office Hours</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField
                            label="Day From"
                            name="office_day_from"
                            value={form.office_day_from}
                            onChange={handleChange}
                            options={DAYS_OF_WEEK}
                        />

                        <SelectField
                            label="Day To"
                            name="office_day_to"
                            value={form.office_day_to}
                            onChange={handleChange}
                            options={DAYS_OF_WEEK}
                        />

                        <SelectField
                            label="Time From"
                            name="office_time_from"
                            value={form.office_time_from}
                            onChange={handleChange}
                            options={TIME_OPTIONS}
                        />

                        <SelectField
                            label="Time To"
                            name="office_time_to"
                            value={form.office_time_to}
                            onChange={handleChange}
                            options={TIME_OPTIONS}
                        />
                    </div>
                </div>

                <div className={cardClass}>
                    <h2 className={sectionHeaderClass}>Right-side Image</h2>

                    <ImagePlaceholder
                        label="Contact Image"
                        previewUrl={previews.hero_image}
                        onChange={(file) => handleImageChange("hero_image", file)}
                    />
                </div>
            </div>

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
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
                                toast.type === "success"
                                    ? "bg-black text-white border-black"
                                    : "bg-red-600 text-white border-red-700"
                            }`}
                        >
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