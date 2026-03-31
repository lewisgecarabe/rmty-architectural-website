import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
    const [inquiryType, setInquiryType] = useState("general");
    const isConsultation = inquiryType === "consultation";

    const buttonText = useMemo(() => {
        return isConsultation ? "BOOK A CONSULTATION" : "SUBMIT INQUIRY";
    }, [isConsultation]);

    return (
        <section className="w-full bg-white">
            {/* ================= TOP HERO SECTION ================= */}
            <div className="mx-auto max-w-screen-2xl px-6 pb-12 pt-32 md:pb-16 md:pt-40 [font-family:var(--font-neue)]">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
                    {/* Left */}
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
                                    911 Josefina II, Sampaloc, Manila, 1008{" "}
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

                    {/* Right Hero Image */}
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

            {/* ================= CONTACT FORM SECTION ================= */}
            <div className="bg-[#f7f7f8] border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-24">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                        <div className="[font-family:var(--font-neue)]">
                            <h2 className="text-4xl font-bold tracking-tight text-black md:text-5xl">
                                Contact <br /> Form
                            </h2>
                        </div>

                        <div>
                            {/* Motion Form for smooth resizing */}
                            <motion.form
                                key="contact-form"
                                layout
                                className="mx-auto w-full max-w-2xl [font-family:var(--font-neue)]"
                                onSubmit={(e) => e.preventDefault()}
                            >
                                {/* Inquiry Toggle - Fully Rounded Pill Design */}
                                <div className="mb-14">
                                    <p className="flex text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                                        Inquiry Type
                                    </p>

                                    <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                                        {/* General Inquiry Button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInquiryType("general")
                                            }
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

                                        {/* Book Consultation Button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInquiryType("consultation")
                                            }
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
                                    {/* Static Names Fields */}
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <UnderlineInput
                                            label="First Name"
                                            placeholder="Enter your first name"
                                        />
                                        <UnderlineInput
                                            label="Last Name"
                                            placeholder="Enter your last name"
                                        />
                                    </div>

                                    {/* Static Email & Phone Fields */}
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        <UnderlineInput
                                            label="Email"
                                            type="email"
                                            placeholder="Enter your email address"
                                        />
                                        <UnderlineInput
                                            label="Phone"
                                            type="tel"
                                            isPhone
                                            placeholder="Enter your 11-digit phone number"
                                        />
                                    </div>

                                    {/* Dynamic Form Content Area */}
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
                                                    />
                                                    <UnderlineInput
                                                        label="Project Type"
                                                        options={[
                                                            "Residential",
                                                            "Commercial",
                                                            "Master Planning",
                                                            "Interior Architecture",
                                                        ]}
                                                    />
                                                </div>

                                                <ConsultationMessageField />

                                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                                    <UnderlineInput
                                                        label="Consultation Date"
                                                        type="date"
                                                    />
                                                    <FileDrop label="Additional Information" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit Button - Fully Rounded Design */}
                                    <motion.div layout className="pt-6">
                                        <button
                                            type="submit"
                                            className="w-full rounded-full bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer"
                                        >
                                            {buttonText}
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
}) {
    const [error, setError] = useState("");
    const [value, setValue] = useState("");

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

        setValue(inputValue);
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
                        setValue(e.target.value);
                        setError(
                            !e.target.value
                                ? "Please select a project type."
                                : "",
                        );
                    }}
                    value={value}
                    className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 appearance-none
                        ${error ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                    `}
                >
                    <option value="" disabled hidden>
                        Select Project Type
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="text-black">
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
                        ${error ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                    `}
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
                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 resize-none
                    ${error ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                `}
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

function ConsultationMessageField() {
    const [value, setValue] = useState("");
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

        setValue(inputValue);
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
                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 resize-none
                    ${error ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                `}
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

function FileDrop({ label }) {
    return (
        <div className="relative group">
            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                <span>{label}</span>
            </label>
            <label className="relative flex h-[120px] w-full cursor-pointer flex-col items-center justify-center border border-dashed border-gray-300 bg-transparent text-center transition-colors hover:border-black hover:bg-gray-50/50">
                <input type="file" className="hidden" multiple />
                <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-1">
                    Drop files here
                </p>
                <p className="text-sm font-bold text-black border-b border-black pb-0.5">
                    Browse
                </p>
            </label>
        </div>
    );
}
