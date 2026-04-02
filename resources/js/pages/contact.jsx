import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
    const [inquiryType, setInquiryType] = useState("general");
    const isConsultation = inquiryType === "consultation";

    const buttonText = useMemo(() => {
        return isConsultation ? "BOOK A CONSULTATION" : "SUBMIT INQUIRY";
    }, [isConsultation]);

    // Tracked form values
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [projectType, setProjectType] = useState("");
    const [consultationMessage, setConsultationMessage] = useState("");
    const [consultationDate, setConsultationDate] = useState("");
    const [consultationTime, setConsultationTime] = useState("");
    const [consultationFiles, setConsultationFiles] = useState([]);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [formKey, setFormKey] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isConsultation) {
            setSubmitError("General inquiry submission is not connected yet.");
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setSubmitError("Please fill in your name and email before submitting.");
            return;
        }

        setSubmitting(true);
        setSubmitError("");
        setSubmitSuccess(false);

        try {
            const formData = new FormData();
            formData.append("first_name", firstName.trim());
            formData.append("last_name", lastName.trim());
            formData.append("email", email.trim());

            if (phone.trim()) formData.append("phone", phone.trim());
            if (location.trim()) formData.append("location", location.trim());
            if (projectType) formData.append("project_type", projectType);
            if (consultationMessage.trim()) {
                formData.append("message", consultationMessage.trim());
            }
            
            if (consultationDate) {
            const datetime = consultationTime
                ? `${consultationDate}T${consultationTime}`
                : consultationDate;
            formData.append("consultation_date", datetime);
            }

            consultationFiles.forEach((file) => {
                formData.append("attachments[]", file);
            });

            const res = await fetch("/api/consultations", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
                body: formData,
            });

            if (res.ok) {

                Swal.fire({
                    title: "Booking Under Review",
                    text: "Your consultation request has been received and is now under review. We’ll send you a confirmation text once it’s approved.",
                    icon: "success",
                    confirmButtonText: "OK",

                    //  DESIGN CUSTOMIZATION
                    background: "#ffffff",
                    color: "#000000",
                    confirmButtonColor: "#000000",

                    // Rounded clean look (matches your UI)
                    customClass: {
                        popup: "rounded-2xl px-6 py-8",
                        title: "text-lg font-bold tracking-wide",
                        confirmButton: "rounded-full px-6 py-3 text-xs tracking-widest"
                    }
                });

                setSubmitSuccess(true);
                setFirstName("");
                setLastName("");
                setEmail("");
                setPhone("");
                setLocation("");
                setProjectType("");
                setConsultationMessage("");
                setConsultationDate("");
                setConsultationFiles([]);
                setFormKey((k) => k + 1);
            } else {
                const data = await res.json().catch(() => ({}));
                setSubmitError(
                    data.message || "Submission failed. Please try again.",
                );
            }
        } catch {
            setSubmitError("Network error. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-white">
            <div className="mx-auto max-w-screen-2xl px-6 pb-12 pt-32 md:pb-16 md:pt-40 [font-family:var(--font-neue)]">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                            Connect
                        </h1>

                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
                            At vero eos et accusamus et iusto odio dignissimos
                        </p>

                        <div className="mt-10 space-y-8 text-[13px] tracking-wide text-gray-600">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.15em] text-black uppercase mb-3">
                                    Metro Manila
                                </p>
                                <p className="leading-relaxed">
                                    911 Josefina II, Sampaloc, Manila, 1008
                                    <br />
                                    Metro Manila
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span>9AM–6PM (Mon–Fri)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span>0932 454 9434</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-black uppercase mb-3">
                                    Email
                                </p>
                                <div className="max-w-xs border-b border-gray-200 pb-3">
                                    <span className="text-black">
                                        rmty.architects@gmail.com
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-none bg-gray-100">
                        <img
                            src="/images/PLACEHOLDER.png"
                            alt="Interior design"
                            className="h-[300px] w-full object-cover md:h-[380px]"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-8 left-8 right-8">
                            <p className="text-2xl font-normal tracking-tight text-white md:text-3xl">
                                EVERY DESIGN
                            </p>
                            <p className="text-xl font-normal text-white/80 md:text-2xl">
                                WITH PURPOSE
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#f7f7f8] border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-24">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                        <div className="[font-family:var(--font-neue)]">
                            <h2 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                                Contact <br /> Form
                            </h2>
                        </div>

                        <div>
                            <motion.form
                                key={`contact-form-${formKey}`}
                                layout
                                className="mx-auto w-full max-w-2xl [font-family:var(--font-neue)]"
                                onSubmit={handleSubmit}
                            >
                                <div className="mb-14">
                                    <p className="flex text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                                        Inquiry Type
                                    </p>

                                    <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                                        <button
                                            type="button"
                                            onClick={() => setInquiryType("general")}
                                            className={`relative rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.15em] uppercase cursor-pointer transition-colors duration-300 ${
                                                inquiryType === "general"
                                                    ? "text-white"
                                                    : "text-gray-500 hover:text-black"
                                            }`}
                                        >
                                            {inquiryType === "general" && (
                                                <motion.div
                                                    layoutId="activePill"
                                                    className="absolute inset-0 rounded-full bg-black"
                                                    transition={{
                                                        type: "spring",
                                                        bounce: 0.2,
                                                        duration: 0.6,
                                                    }}
                                                />
                                            )}
                                            <span className="relative z-10">
                                                General Inquiry
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setInquiryType("consultation")}
                                            className={`relative rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.15em] uppercase cursor-pointer transition-colors duration-300 ${
                                                inquiryType === "consultation"
                                                    ? "text-white"
                                                    : "text-gray-500 hover:text-black"
                                            }`}
                                        >
                                            {inquiryType === "consultation" && (
                                                <motion.div
                                                    layoutId="activePill"
                                                    className="absolute inset-0 rounded-full bg-black"
                                                    transition={{
                                                        type: "spring",
                                                        bounce: 0.2,
                                                        duration: 0.6,
                                                    }}
                                                />
                                            )}
                                            <span className="relative z-10">
                                                Book Consultation
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <UnderlineInput
                                            label="First Name"
                                            placeholder="Enter your first name"
                                            value={firstName}
                                            onValueChange={setFirstName}
                                        />
                                        <UnderlineInput
                                            label="Last Name"
                                            placeholder="Enter your last name"
                                            value={lastName}
                                            onValueChange={setLastName}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <UnderlineInput
                                            label="Email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onValueChange={setEmail}
                                        />
                                        <UnderlineInput
                                            label="Phone"
                                            type="tel"
                                            isPhone
                                            placeholder="Enter your 11-digit phone number"
                                            value={phone}
                                            onValueChange={setPhone}
                                        />
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {inquiryType === "general" ? (
                                            <motion.div
                                                key="general-fields"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: "easeOut",
                                                }}
                                            >
                                                <GeneralMessageField />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="consultation-fields"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -15 }}
                                                transition={{
                                                    duration: 0.3,
                                                    ease: "easeOut",
                                                }}
                                                className="space-y-8"
                                            >
                                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                                    <UnderlineInput
                                                        label="Location"
                                                        placeholder="Enter project location"
                                                        value={location}
                                                        onValueChange={setLocation}
                                                    />
                                                    <UnderlineInput
                                                        label="Project Type"
                                                        options={[
                                                            "Residential",
                                                            "Commercial",
                                                            "Master Planning",
                                                            "Interior Architecture",
                                                        ]}
                                                        value={projectType}
                                                        onValueChange={setProjectType}
                                                    />
                                                </div>

                                                <ConsultationMessageField
                                                    value={consultationMessage}
                                                    onValueChange={setConsultationMessage}
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* First row: Date + Time side by side */}
                                                <UnderlineInput
                                                    label="Consultation Date"
                                                    type="date"
                                                    value={consultationDate}
                                                    onValueChange={setConsultationDate}
                                                />

                                                <UnderlineInput
                                                    label="Consultation Time"
                                                    type="time"
                                                    value={consultationTime}
                                                    onValueChange={setConsultationTime}
                                                />

                                                {/* Second row: Wide FileDrop spanning both columns */}
                                                <div className="md:col-span-2">
                                                    <FileDrop
                                                    label="Additional Information"
                                                    files={consultationFiles}
                                                    onFilesChange={setConsultationFiles}
                                                    />
                                                </div>
                                                </div>

                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        
                                        
                                        {submitError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[11px] font-bold tracking-wider text-red-700 uppercase"
                                            >
                                                {submitError}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <motion.div layout className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full rounded-full bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? "SUBMITTING..." : buttonText}
                                        </button>
                                    </motion.div>
                                </div>
                            </motion.form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------- INPUT COMPONENT ---------------- */

function UnderlineInput({
    label,
    type = "text",
    options,
    isPhone,
    placeholder,
    value = "",
    onValueChange,
}) {
    const [error, setError] = useState("");

    const isNameField = label === "First Name" || label === "Last Name";

    const handleChange = (e) => {
        let inputValue = e.target.value;

        if (isNameField) {
            inputValue = inputValue.replace(/[^A-Za-z\s]/g, "");
            inputValue = inputValue.replace(/\s{2,}/g, " ");

            if (!inputValue.trim()) {
                setError(`${label} is required.`);
            } else if (inputValue.trim().length < 2) {
                setError(`${label} must be at least 2 characters.`);
            } else {
                setError("");
            }
        } else if (isPhone) {
            inputValue = inputValue.replace(/\D/g, "").slice(0, 11);

            if (inputValue.length !== 11) {
                setError("Phone number must be 11 digits.");
            } else {
                setError("");
            }
        } else if (type === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(inputValue)) {
                setError("Please enter a valid email address.");
            } else {
                setError("");
            }
        } else {
            if (!inputValue.trim()) {
                setError(`${label} is required.`);
            } else {
                setError("");
            }
        }

        onValueChange?.(inputValue);
    };

    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                <span>{label}</span>
            </label>

            {options ? (
    
                    <select
                        required
                        onChange={(e) => {
                            onValueChange?.(e.target.value);
                            setError(!e.target.value ? "Please select a project type." : "");
                        }}
                        value={value}
                        className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none ${
                            error
                                ? "border-red-500 text-red-500"
                                : "border-gray-300 focus:border-black text-black"
                        }`}
                    >
                        <option value="" disabled hidden>
                            Select Project Type
                        </option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                ) : type === "time" ? (
                    
                    <select
                        value={value}
                        onChange={(e) => onValueChange?.(e.target.value)}
                        className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none ${
                            error
                                ? "border-red-500 text-red-500"
                                : "border-gray-300 focus:border-black text-black"
                        }`}
                    >
                        <option value="" disabled hidden>
                            Select Time
                        </option>

                        {Array.from({ length: 17 }).map((_, i) => {
                            const totalMinutes = 9 * 60 + i * 30;
                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;

                            const formattedHours12 = hours % 12 === 0 ? 12 : hours % 12;
                            const ampm = hours < 12 ? "AM" : "PM";

                            const label = `${formattedHours12}:${minutes === 0 ? "00" : minutes} ${ampm}`;
                            const val = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

                            return (
                                <option key={val} value={val}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>

                ) : type === "date" ? (

                    <input
                        type="date"
                        value={value}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none ${
                            error
                                ? "border-red-500 text-red-500"
                                : "border-gray-300 focus:border-black text-black"
                        }`}
                    />

                ) : (
                    
                    <input
                        type={type}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none ${
                            error
                                ? "border-red-500 text-red-500"
                                : "border-gray-300 focus:border-black text-black"
                        }`}
                    />
                )}

            <AnimatePresence mode="wait">
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- GENERAL MESSAGE ---------------- */

function GeneralMessageField() {
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        let inputValue = e.target.value;
        const words = inputValue.trim().split(/\s+/);

        if (words.length > 100) {
            inputValue = words.slice(0, 100).join(" ");
        }

        if (!inputValue.trim()) {
            setError("Message is required.");
        } else {
            setError("");
        }

        setValue(inputValue);
    };

    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                <span>Message</span>
            </label>
            <textarea
                rows={4}
                value={value}
                onChange={handleChange}
                placeholder="Enter your message (max 100 words)"
                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 resize-none ${
                    error
                        ? "border-red-500 text-red-500"
                        : "border-gray-300 focus:border-black text-black"
                }`}
            />
            <AnimatePresence mode="wait">
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- CONSULTATION MESSAGE ---------------- */

function ConsultationMessageField({ value = "", onValueChange }) {
    const [error, setError] = useState("");

    const handleChange = (e) => {
        let inputValue = e.target.value;
        const words = inputValue.trim().split(/\s+/);

        if (words.length > 100) {
            inputValue = words.slice(0, 100).join(" ");
        }

        if (!inputValue.trim()) {
            setError("Project details are required.");
        } else {
            setError("");
        }

        onValueChange?.(inputValue);
    };

    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                <span>Project Details</span>
            </label>
            <textarea
                rows={4}
                value={value}
                onChange={handleChange}
                placeholder="Describe your project (max 100 words)"
                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 resize-none ${
                    error
                        ? "border-red-500 text-red-500"
                        : "border-gray-300 focus:border-black text-black"
                }`}
            />
            <AnimatePresence mode="wait">
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- FILE DROP ---------------- */

function FileDrop({ label, files = [], onFilesChange }) {
    const [dragging, setDragging] = useState(false);

    const updateFiles = (fileList) => {
        const nextFiles = Array.from(fileList || []);
        onFilesChange?.(nextFiles);
    };

    const removeFile = (indexToRemove) => {
        onFilesChange?.(files.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                <span>{label}</span>
            </label>

            <label
                className={`relative flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center border border-dashed text-center transition-colors ${
                    dragging
                        ? "border-black bg-gray-50"
                        : "border-gray-300 bg-transparent hover:border-black hover:bg-gray-50/50"
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    updateFiles(e.dataTransfer.files);
                }}
            >
                <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                    onChange={(e) => updateFiles(e.target.files)}
                />
                <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">
                    Drop files here
                </p>
                <p className="text-sm font-bold text-black border-b border-black pb-0.5">
                    Browse
                </p>
            </label>

            {files.length > 0 && (
                <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2"
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-black truncate">
                                    {file.name}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-gray-400">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-3 text-[10px] font-bold tracking-wider uppercase text-red-500 hover:text-red-700 cursor-pointer"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}