// ============================================================================
// React Frontend Components for Forgot Password Flow
// ============================================================================

import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    validateEmail,
    validateStrongPassword,
    PASSWORD_HINT,
    EMAIL_HINT,
} from "../../lib/validation";

// Custom OTP Box Component
const OtpInput = ({ value, onChange, disabled, hasError }) => {
    const inputRefs = useRef([]);

    const handleChange = (e, index) => {
        const val = e.target.value.replace(/\D/g, "");
        if (!val && e.target.value !== "") return;

        const otpArray = value.split("");
        otpArray[index] = val.slice(-1); // Take only the last typed character
        const newOtp = otpArray.join("").slice(0, 6);
        onChange(newOtp);

        // Move focus to next box
        if (val && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            const otpArray = value.split("");
            if (!value[index] && index > 0) {
                // If empty, delete previous and move back
                otpArray[index - 1] = "";
                inputRefs.current[index - 1].focus();
            } else {
                // Clear current
                otpArray[index] = "";
            }
            onChange(otpArray.join(""));
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1].focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);
        if (pasteData) {
            onChange(pasteData);
            // Focus the next empty box or the last box
            const nextIndex = Math.min(pasteData.length, 5);
            if (inputRefs.current[nextIndex]) {
                inputRefs.current[nextIndex].focus();
            } else {
                inputRefs.current[5].focus();
            }
        }
    };

    return (
        <div className="flex gap-3 sm:gap-4 justify-between w-full">
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ""}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`w-full h-14 border px-0 text-center text-xl font-mono outline-none transition-colors rounded-none bg-transparent placeholder:text-gray-200
                        ${
                            hasError
                                ? "border-red-500 text-red-500 focus:border-red-500"
                                : value[index]
                                  ? "border-black text-black focus:border-black"
                                  : "border-gray-300 text-black focus:border-black"
                        }
                        disabled:bg-gray-50 disabled:text-gray-400`}
                />
            ))}
        </div>
    );
};

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fieldErrors, setFieldErrors] = useState({
        email: "",
        otp: "",
        password: "",
        passwordConfirmation: "",
    });

    // Visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setFieldErrors({
            email: "",
            otp: "",
            password: "",
            passwordConfirmation: "",
        });

        const emailErr = validateEmail(email);
        if (emailErr) {
            setFieldErrors((prev) => ({ ...prev, email: emailErr }));
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/api/password/send-otp", {
                email: email.trim(),
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setStep(2);
            }
        } catch (err) {
            // Map backend validation errors to fields to avoid broad generic errors
            if (err.response?.data?.errors?.email) {
                setFieldErrors((prev) => ({
                    ...prev,
                    email: err.response.data.errors.email[0],
                }));
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to send OTP. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErrors({
            email: "",
            otp: "",
            password: "",
            passwordConfirmation: "",
        });

        let hasValidationErrors = false;

        // 1. Validate OTP
        if (otp.length < 6) {
            setFieldErrors((prev) => ({
                ...prev,
                otp: "Please enter the complete 6-digit security code.",
            }));
            hasValidationErrors = true;
        }

        // 2. Validate Password independently
        const passwordErr = validateStrongPassword(password);
        if (passwordErr) {
            setFieldErrors((prev) => ({ ...prev, password: passwordErr }));
            hasValidationErrors = true;
        }

        // 3. Validate Confirm Password independently
        if (!passwordConfirmation) {
            setFieldErrors((prev) => ({
                ...prev,
                passwordConfirmation: "Please confirm your new password.",
            }));
            hasValidationErrors = true;
        } else if (password !== passwordConfirmation) {
            setFieldErrors((prev) => ({
                ...prev,
                passwordConfirmation: "Passwords do not match.",
            }));
            hasValidationErrors = true;
        }

        if (hasValidationErrors) return;

        setLoading(true);
        try {
            const response = await axios.post("/api/password/reset", {
                email: email,
                otp: otp,
                password: password,
                password_confirmation: passwordConfirmation,
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    window.location.href = "/admin/login";
                }, 2000);
            }
        } catch (err) {
            // Check if backend provided specific field errors (Laravel style)
            const backendErrors = err.response?.data?.errors;
            if (backendErrors) {
                setFieldErrors((prev) => ({
                    ...prev,
                    email: backendErrors.email?.[0] || "",
                    otp: backendErrors.otp?.[0] || "",
                    password: backendErrors.password?.[0] || "",
                }));
                // Only show top level error if there are no field-specific errors mapped
                if (
                    !backendErrors.email &&
                    !backendErrors.otp &&
                    !backendErrors.password
                ) {
                    setError(
                        err.response?.data?.message ||
                            "Failed to reset password. Please try again.",
                    );
                }
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to reset password. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError("");
        setFieldErrors((prev) => ({ ...prev, otp: "" }));

        try {
            const response = await axios.post("/api/password/send-otp", {
                email: email,
            });

            if (response.data.success) {
                setSuccess("New OTP sent to your email");
                setOtp("");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 sm:px-6">
            <div className="w-full max-w-2xl mx-auto [font-family:var(--font-neue)] flex flex-col gap-7">
                {/* Heading */}
                <div className="mb-2">
                    <h1 className="text-3xl font-normal tracking-tight text-black mb-2">
                        {step === 1 ? "Recover Access" : "Set New Password"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {step === 1
                            ? "Enter your admin email to receive a recovery code."
                            : "Enter the 6-digit code sent to your email to set a new password."}
                    </p>
                </div>

                {/* Top Level Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-[10px] tracking-wide text-red-500 uppercase border border-red-500/20 bg-red-500/5 p-3">
                                {error}
                            </p>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-[10px] tracking-wide text-emerald-600 uppercase border border-emerald-500/20 bg-emerald-500/5 p-3">
                                {success}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form
                        onSubmit={handleSendOtp}
                        className="flex flex-col gap-7"
                    >
                        <div className="relative group">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                <span
                                    className={
                                        fieldErrors.email ? "text-red-500" : ""
                                    }
                                >
                                    Email
                                </span>
                            </label>
                            <input
                                type="text"
                                inputMode="email"
                                placeholder="Enter your email"
                                maxLength={50}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        email: "",
                                    }));
                                }}
                                disabled={loading}
                                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                    ${fieldErrors.email ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                `}
                            />
                            <AnimatePresence mode="wait">
                                {fieldErrors.email ? (
                                    <motion.p
                                        key="error"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                    >
                                        {fieldErrors.email}
                                    </motion.p>
                                ) : (
                                    <motion.p
                                        key="hint"
                                        className="mt-2 text-[10px] text-gray-400"
                                    >
                                        {EMAIL_HINT}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? "Sending..." : "Send Recovery Code"}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter OTP & New Password */}
                {step === 2 && (
                    <form
                        onSubmit={handleResetPassword}
                        className="flex flex-col gap-7"
                    >
                        {/* OTP BOXES */}
                        <div className="relative group pt-2">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                                <span
                                    className={
                                        fieldErrors.otp ? "text-red-500" : ""
                                    }
                                >
                                    Security Code
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="text-[10px] tracking-widest text-gray-400 hover:text-black transition-colors uppercase outline-none cursor-pointer"
                                >
                                    Resend Code
                                </button>
                            </label>

                            <OtpInput
                                value={otp}
                                onChange={(newOtp) => {
                                    setOtp(newOtp);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        otp: "",
                                    }));
                                }}
                                disabled={loading}
                                hasError={!!fieldErrors.otp}
                            />

                            <AnimatePresence mode="wait">
                                {fieldErrors.otp && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-3 overflow-hidden"
                                    >
                                        {fieldErrors.otp}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* NEW PASSWORD */}
                        <div className="relative group">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                <span
                                    className={
                                        fieldErrors.password
                                            ? "text-red-500"
                                            : ""
                                    }
                                >
                                    New Password
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            password: "",
                                        }));
                                    }}
                                    disabled={loading}
                                    className={`w-full bg-transparent border-b px-0 pr-8 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                        ${fieldErrors.password ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    {showPassword ? (
                                        <EyeOffIcon />
                                    ) : (
                                        <EyeIcon />
                                    )}
                                </button>
                            </div>
                            <AnimatePresence mode="wait">
                                {fieldErrors.password ? (
                                    <motion.p
                                        key="error"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                    >
                                        {fieldErrors.password}
                                    </motion.p>
                                ) : (
                                    <motion.p
                                        key="hint"
                                        className="mt-2 text-[10px] text-gray-400"
                                    >
                                        {PASSWORD_HINT}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="relative group">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                <span
                                    className={
                                        fieldErrors.passwordConfirmation
                                            ? "text-red-500"
                                            : ""
                                    }
                                >
                                    Confirm Password
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Re-enter password"
                                    value={passwordConfirmation}
                                    onChange={(e) => {
                                        setPasswordConfirmation(e.target.value);
                                        setFieldErrors((prev) => ({
                                            ...prev,
                                            passwordConfirmation: "",
                                        }));
                                    }}
                                    disabled={loading}
                                    className={`w-full bg-transparent border-b px-0 pr-8 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                        ${fieldErrors.passwordConfirmation ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                    `}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOffIcon />
                                    ) : (
                                        <EyeIcon />
                                    )}
                                </button>
                            </div>
                            <AnimatePresence mode="wait">
                                {fieldErrors.passwordConfirmation && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                    >
                                        {fieldErrors.passwordConfirmation}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? "Processing..." : "Set New Password"}
                        </button>
                    </form>
                )}

                {/* Back to Login Link */}
                <div className="text-center mt-4">
                    <Link
                        to="/admin/login"
                        className="text-[10px] tracking-widest text-gray-400 uppercase hover:text-black transition-colors"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Alternative: Single-Page Version (All fields visible)
// ============================================================================

const ForgotPasswordSinglePage = () => {
    const [formData, setFormData] = useState({
        email: "",
        otp: "",
        password: "",
        password_confirmation: "",
    });
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [fieldErrors, setFieldErrors] = useState({
        email: "",
        otp: "",
        password: "",
        passwordConfirmation: "",
    });

    // Visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear specific errors on type
        if (name === "password_confirmation") {
            setFieldErrors((prev) => ({ ...prev, passwordConfirmation: "" }));
        } else {
            setFieldErrors((prev) => ({ ...prev, [name]: "" }));
        }
        setError("");
        setSuccess("");
    };

    const handleOtpChange = (newOtp) => {
        setFormData((prev) => ({ ...prev, otp: newOtp }));
        setFieldErrors((prev) => ({ ...prev, otp: "" }));
        setError("");
        setSuccess("");
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setFieldErrors({
            email: "",
            otp: "",
            password: "",
            passwordConfirmation: "",
        });

        const emailErr = validateEmail(formData.email);
        if (emailErr) {
            setFieldErrors((prev) => ({ ...prev, email: emailErr }));
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/password/send-otp", {
                email: formData.email,
            });

            if (response.data.success) {
                setSuccess("Security code sent! Check your inbox.");
                setOtpSent(true);
            }
        } catch (err) {
            if (err.response?.data?.errors?.email) {
                setFieldErrors((prev) => ({
                    ...prev,
                    email: err.response.data.errors.email[0],
                }));
            } else {
                setError(err.response?.data?.message || "Failed to send OTP");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setFieldErrors({
            email: "",
            otp: "",
            password: "",
            passwordConfirmation: "",
        });

        if (!otpSent) {
            return handleSendOtp(e);
        }

        let hasValidationErrors = false;

        // 1. Validate OTP length
        if (formData.otp.length < 6) {
            setFieldErrors((prev) => ({
                ...prev,
                otp: "Please enter the complete 6-digit security code.",
            }));
            hasValidationErrors = true;
        }

        // 2. Validate Password
        const passwordErr = validateStrongPassword(formData.password);
        if (passwordErr) {
            setFieldErrors((prev) => ({ ...prev, password: passwordErr }));
            hasValidationErrors = true;
        }

        // 3. Validate Confirm Password independently
        if (!formData.password_confirmation) {
            setFieldErrors((prev) => ({
                ...prev,
                passwordConfirmation: "Please confirm your new password.",
            }));
            hasValidationErrors = true;
        } else if (formData.password !== formData.password_confirmation) {
            setFieldErrors((prev) => ({
                ...prev,
                passwordConfirmation: "Passwords do not match.",
            }));
            hasValidationErrors = true;
        }

        if (hasValidationErrors) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/password/reset", formData);

            if (response.data.success) {
                setSuccess("Password secured! Redirecting to login...");
                setTimeout(() => {
                    window.location.href = "/admin/login";
                }, 2000);
            }
        } catch (err) {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors) {
                setFieldErrors((prev) => ({
                    ...prev,
                    email: backendErrors.email?.[0] || "",
                    otp: backendErrors.otp?.[0] || "",
                    password: backendErrors.password?.[0] || "",
                }));
                if (
                    !backendErrors.email &&
                    !backendErrors.otp &&
                    !backendErrors.password
                ) {
                    setError(
                        err.response?.data?.message ||
                            "Failed to reset password.",
                    );
                }
            } else {
                setError(
                    err.response?.data?.message || "Failed to reset password.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6">
            <div className="w-full max-w-2xl mx-auto [font-family:var(--font-neue)] flex flex-col gap-7">
                {/* Heading */}
                <div className="mb-2">
                    <h1 className="text-3xl font-normal tracking-tight text-black mb-2">
                        Recover Access
                    </h1>
                    <p className="text-sm text-gray-500">
                        Securely reset your administrator password.
                    </p>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-[10px] tracking-wide text-red-500 uppercase border border-red-500/20 bg-red-500/5 p-3">
                                {error}
                            </p>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <p className="text-[10px] tracking-wide text-emerald-600 uppercase border border-emerald-500/20 bg-emerald-500/5 p-3">
                                {success}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-7">
                    {/* EMAIL */}
                    <div className="relative group">
                        <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                            <span
                                className={
                                    fieldErrors.email ? "text-red-500" : ""
                                }
                            >
                                Admin Email Address
                            </span>
                            {!otpSent && (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={loading || !formData.email}
                                    className="text-[10px] tracking-widest text-black uppercase hover:text-gray-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    {loading ? "..." : "Send Code"}
                                </button>
                            )}
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="admin@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading || otpSent}
                            className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                ${fieldErrors.email ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                            `}
                        />
                        <AnimatePresence mode="wait">
                            {fieldErrors.email && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                >
                                    {fieldErrors.email}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {otpSent && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-col gap-7 overflow-hidden"
                            >
                                {/* SECURITY CODE BOXES */}
                                <div className="relative group pt-2">
                                    <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-3">
                                        <span
                                            className={
                                                fieldErrors.otp
                                                    ? "text-red-500"
                                                    : ""
                                            }
                                        >
                                            Security Code
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            className="text-[10px] tracking-widest text-gray-400 hover:text-black transition-colors uppercase outline-none"
                                        >
                                            Resend Code
                                        </button>
                                    </label>
                                    <OtpInput
                                        value={formData.otp}
                                        onChange={handleOtpChange}
                                        disabled={loading}
                                        hasError={!!fieldErrors.otp}
                                    />
                                    <AnimatePresence mode="wait">
                                        {fieldErrors.otp && (
                                            <motion.p
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-[10px] tracking-wide text-red-500 mt-3 overflow-hidden"
                                            >
                                                {fieldErrors.otp}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* NEW PASSWORD */}
                                <div className="relative group">
                                    <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                        <span
                                            className={
                                                fieldErrors.password
                                                    ? "text-red-500"
                                                    : ""
                                            }
                                        >
                                            New Password
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            placeholder="Minimum 8 characters"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            className={`w-full bg-transparent border-b px-0 pr-8 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                                ${fieldErrors.password ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                            `}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none"
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon />
                                            ) : (
                                                <EyeIcon />
                                            )}
                                        </button>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {fieldErrors.password ? (
                                            <motion.p
                                                key="error"
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                            >
                                                {fieldErrors.password}
                                            </motion.p>
                                        ) : (
                                            <motion.p
                                                key="hint"
                                                className="mt-2 text-[10px] text-gray-400"
                                            >
                                                {PASSWORD_HINT}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* CONFIRM PASSWORD */}
                                <div className="relative group">
                                    <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                        <span
                                            className={
                                                fieldErrors.passwordConfirmation
                                                    ? "text-red-500"
                                                    : ""
                                            }
                                        >
                                            Confirm Password
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password_confirmation"
                                            placeholder="Re-enter password"
                                            value={
                                                formData.password_confirmation
                                            }
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            className={`w-full bg-transparent border-b px-0 pr-8 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300 disabled:text-gray-400
                                                ${fieldErrors.passwordConfirmation ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                            `}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword,
                                                )
                                            }
                                            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOffIcon />
                                            ) : (
                                                <EyeIcon />
                                            )}
                                        </button>
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {fieldErrors.passwordConfirmation && (
                                            <motion.p
                                                initial={{
                                                    opacity: 0,
                                                    height: 0,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    height: "auto",
                                                }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-[10px] tracking-wide text-red-500 mt-2 overflow-hidden"
                                            >
                                                {
                                                    fieldErrors.passwordConfirmation
                                                }
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* BUTTON */}
                    {otpSent && (
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? "Processing..." : "Secure & Login"}
                        </button>
                    )}
                </form>

                <div className="text-center mt-4 [font-family:var(--font-neue)]">
                    <Link
                        to="/admin/login"
                        className="text-[10px] tracking-widest text-gray-400 uppercase hover:text-black transition-colors"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export { ForgotPassword, ForgotPasswordSinglePage };
export default ForgotPassword;

// ============================================================================
// SVG Utility Icons
// ============================================================================
function EyeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
        >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
        >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    );
}
