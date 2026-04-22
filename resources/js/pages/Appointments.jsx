import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import CalendarScheduler from "../components/CalendarScheduler";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const RECAPTCHA_SITE_KEY =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY ??
    "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export default function Appointments() {
    const [captchaToken, setCaptchaToken] = useState(null);

    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token"),
    );
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [location, setLocation] = useState("");
    const [projectType, setProjectType] = useState("");
    const [appointmentMessage, setAppointmentMessage] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [appointmentTime, setAppointmentTime] = useState("");

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Sync auth state if token changes elsewhere
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        setEmail(user.email);
        const [first, last] = user.name.split(" ");
        setFirstName(first);
        setLastName(last || "");
    }
}, []);

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();

        // 1. Auth Check
        if (!isLoggedIn) {
            setShowAuthModal(true);
            return;
        }

        const newErrors = {};

        // Validation Logic
        if (!firstName.trim()) newErrors.firstName = "First Name is required.";
        if (!lastName.trim()) newErrors.lastName = "Last Name is required.";
        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = "Invalid email format.";
        }
        if (!location.trim()) newErrors.location = "Location is required.";
        if (!projectType) newErrors.projectType = "Project Type is required.";
        if (!appointmentDate) newErrors.appointmentDate = "Date is required.";
        if (!appointmentTime) newErrors.appointmentTime = "Time is required.";

        // 2. Captcha Check
      if (!captchaToken) {
            newErrors.captcha = "Please complete the Captcha verification.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            setSubmitting(true);
            setSubmitError("");

            const res = await fetch(`${API_BASE}/api/consultations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    location,
                    project_type: projectType,
                        captcha_token: captchaToken,
                    message: appointmentMessage,
                    consultation_date: `${appointmentDate} ${appointmentTime}:00`,
                }),
            });

            if (!res.ok) throw new Error("Submission failed");

            Swal.fire({
                icon: "success",
                title: "Session Requested",
                text: "We will contact you shortly to confirm your consultation schedule.",
                confirmButtonColor: "#000000",
                confirmButtonText: "Close",
            });

            // Reset form
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setLocation("");
            setProjectType("");
            setAppointmentMessage("");
            setAppointmentDate("");
            setAppointmentTime("");
            setErrors({});
            setCaptchaVerified(false);
        } catch (err) {
            setSubmitError("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-[#f1f1f1] text-black min-h-screen [font-family:var(--font-neue)]">
            {/* Auth Modal */}
            <AuthRequiredModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAction={() => {
                    setShowAuthModal(false);
                    navigate("/auth");
                }}
            />

            {/* ── Header Section ── */}
            <div className="mx-auto max-w-screen-2xl px-6 pt-32 pb-16 md:pt-48 border-b border-neutral-300">
                <div className="flex flex-col gap-8 md:gap-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-end">
                        <h1 className="lg:col-span-8 text-[3.5rem] md:text-[6rem] lg:text-[6.5rem] leading-[0.85] font-bold tracking-tighter uppercase">
                            Schedule <br /> A Session.
                        </h1>
                        <div className="lg:col-span-4 lg:pb-3 border-l border-neutral-300 pl-6 md:pl-10">
                            <p className="text-[15px] font-medium leading-relaxed text-neutral-600">
                                Reserve a formal consultation with the RMTY
                                team to define your vision, clarify project
                                scope, and align design direction with your
                                site and budget requirements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content (Sticky Image + Scrolling Form) ── */}
            <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:items-start">
                    {/* Left: The Structured Form (Spans 7 columns) */}
                    <div className="lg:col-span-7">
                        <form
                            onSubmit={handleAppointmentSubmit}
                            className="w-full"
                        >
                            {/* Phase 01: Client */}
                            <div className="mb-20">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Client Details
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        01
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <UnderlineInput
                                        label="First Name *"
                                        value={firstName}
                                        onValueChange={setFirstName}
                                        externalError={errors.firstName}
                                    />
                                    <UnderlineInput
                                        label="Last Name *"
                                        value={lastName}
                                        onValueChange={setLastName}
                                        externalError={errors.lastName}
                                    />
                                    <UnderlineInput
                                        label="E-Mail *"
                                        type="email"
                                        value={email}
                                        onValueChange={setEmail}
                                        externalError={errors.email}
                                    />
                                    <UnderlineInput
                                        label="Phone (Optional)"
                                        type="tel"
                                        isPhone
                                        value={phone}
                                        onValueChange={setPhone}
                                        externalError={errors.phone}
                                    />
                                </div>
                            </div>

                            {/* Phase 02: Project */}
                            <div className="mb-20">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Project Specs
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        02
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                    <UnderlineInput
                                        label="Location *"
                                        value={location}
                                        onValueChange={setLocation}
                                        externalError={errors.location}
                                    />
                                    <UnderlineInput
                                        label="Project Type *"
                                        options={[
                                            "Residential",
                                            "Commercial",
                                            "Master Planning",
                                            "Interior Architecture",
                                        ]}
                                        value={projectType}
                                        onValueChange={setProjectType}
                                        externalError={errors.projectType}
                                    />
                                </div>
                                <AppointmentMessageField
                                    label="Brief Description (Optional)"
                                    value={appointmentMessage}
                                    onValueChange={setAppointmentMessage}
                                />
                            </div>

                            {/* Phase 03: Schedule */}
                            <div className="mb-10">
                                <div className="border-b-2 border-black pb-4 mb-10 flex justify-between items-end">
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
                                        Scheduling
                                    </h2>
                                    <span className="text-xs font-bold tracking-widest text-neutral-400">
                                        03
                                    </span>
                                </div>
                                <div className="w-full">
                                    <label
                                        className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-6 transition-colors ${errors.appointmentDate || errors.appointmentTime ? "text-red-500" : "text-neutral-800"}`}
                                    >
                                        Select Date & Time *
                                    </label>
                                    <CalendarScheduler
                                        selectedDate={appointmentDate}
                                        onDateChange={setAppointmentDate}
                                        selectedTime={appointmentTime}
                                        onTimeChange={setAppointmentTime}
                                    />
                                    {(errors.appointmentDate ||
                                        errors.appointmentTime) && (
                                        <p className="text-[10px] tracking-wide text-red-500 mt-4 uppercase font-bold">
                                            {errors.appointmentDate ||
                                                errors.appointmentTime}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Captcha Section */}
                            <div className="mb-10">

<ReCAPTCHA
    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
    onChange={(token) => setCaptchaToken(token)}
/>
                                <AnimatePresence mode="wait">
                                    {errors.captcha && (
                                        <motion.p
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="text-[10px] tracking-wide text-red-500 overflow-hidden uppercase font-bold"
                                        >
                                            {errors.captcha}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Submit Area */}
                            <AnimatePresence>
                                {submitError && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="mb-10 flex items-center gap-4 border-l-2 border-red-500 py-1 pl-4"
                                    >
                                        <span className="text-[11px] font-bold tracking-[0.15em] text-red-500 uppercase">
                                            {submitError}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full border border-black px-14 py-4 text-[11px] font-bold tracking-[0.2em] text-black uppercase transition-all hover:bg-black hover:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {submitting
                                    ? "PROCESSING..."
                                    : "REQUEST SCHEDULE"}
                            </button>
                        </form>
                    </div>

                    {/* Right: Sticky Architectural Image (Spans 5 columns) */}
                    <div className="hidden lg:block lg:col-span-5 relative h-[750px] bg-neutral-200 overflow-hidden sticky top-32">
                        <img
                            src="/images/home-hero.webp"
                            alt="Appointment Header"
                            className="h-full w-full object-cover grayscale-[15%] transition-transform duration-[3s] hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────────────────────
   SHARED COMPONENTS
────────────────────────────────────────────────────────── */

function AuthRequiredModal({ isOpen, onClose, onAction }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 rounded-2">
                    {/* Softer, more elegant backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/20"
                    />

                    {/* Pure Minimalist Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-full max-w-[420px] bg-white p-12 md:p-14 flex flex-col items-center text-center"
                    >
                        {/* Tiny structural label */}
                        <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-6">
                            Authentication
                        </span>

                        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-neutral-900 mb-4">
                            Client profile required.
                        </h2>

                        <p className="text-sm leading-relaxed text-neutral-500 mb-10 max-w-[280px]">
                            Please create an account or sign in to secure your
                            consultation schedule.
                        </p>

                        <div className="flex flex-col w-full gap-2">
                            <button
                                onClick={onAction}
                                className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-70 cursor-pointer"
                            >
                                Continue to Sign In
                            </button>

                            {/* "Ghost" cancel button - no borders, pure typography */}
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase transition-colors hover:text-black cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function UnderlineInput({
    label,
    type = "text",
    options,
    isPhone,
    placeholder,
    value,
    onValueChange,
    externalError,
}) {
    const hasError = !!externalError;

    const handleChange = (e) => {
        let val = e.target.value;
        if (label.includes("Name"))
            val = val.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " ");
        else if (isPhone) val = val.replace(/\D/g, "").slice(0, 11);
        onValueChange?.(val);
    };

    const inputClass = `w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none appearance-none ${
        hasError
            ? "border-red-500 text-red-500"
            : "border-neutral-300 focus:border-black text-black"
    }`;

    return (
        <div className="relative group w-full">
            <label
                className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}
            >
                {label}
            </label>

            {options ? (
                <select
                    value={value}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="" disabled hidden>
                        Select {label.replace("*", "")}
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="text-black">
                            {opt}
                        </option>
                    ))}
                </select>
            ) : type === "time" ? (
                <select
                    value={value}
                    onChange={handleChange}
                    className={inputClass}
                >
                    <option value="" disabled hidden>
                        Select Time
                    </option>
                    {Array.from({ length: 17 }).map((_, i) => {
                        const totalMinutes = 9 * 60 + i * 30;
                        const h = Math.floor(totalMinutes / 60);
                        const m = totalMinutes % 60;
                        const display = `${h % 12 || 12}:${m === 0 ? "00" : m} ${h < 12 ? "AM" : "PM"}`;
                        const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        return (
                            <option
                                key={val}
                                value={val}
                                className="text-black"
                            >
                                {display}
                            </option>
                        );
                    })}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputClass}
                />
            )}

            <AnimatePresence mode="wait">
                {externalError && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden uppercase font-bold"
                    >
                        {externalError}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

function AppointmentMessageField({
    label,
    value,
    onValueChange,
    externalError,
}) {
    const hasError = !!externalError;

    return (
        <div className="relative group w-full">
            <label
                className={`block text-[11px] font-bold tracking-[0.15em] uppercase mb-4 transition-colors ${hasError ? "text-red-500" : "text-neutral-800"}`}
            >
                {label}
            </label>
            <textarea
                rows={4}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className={`w-full bg-transparent border-b px-0 py-2 text-sm outline-none transition-colors rounded-none resize-none ${hasError ? "border-red-500 text-red-500" : "border-neutral-300 focus:border-black text-black"}`}
            />
        </div>
    );
}
