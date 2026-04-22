import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";

export default function ClientAuthForm({
    onSuccess,
    prefillEmail     = "",
    prefillFirstName = "",
    prefillLastName  = "",
}) {
    const [mode, setMode] = useState("login"); // login | register | otp
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: prefillFirstName,
        lastName:  prefillLastName,
        email:     prefillEmail,
        password:  "",
    });

    const [otpValue, setOtpValue] = useState("");
    const [errors,   setErrors]   = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            delete next[toSnakeCase(field)];
            delete next.general;
            return next;
        });
    };

    const toSnakeCase = (str) =>
        str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

    // Map Laravel snake_case validation errors → camelCase state keys
    const normalizeErrors = (apiErrors) => {
        const map = {
            first_name: "firstName",
            last_name:  "lastName",
            email:      "email",
            password:   "password",
        };
        const normalized = {};
        for (const [key, val] of Object.entries(apiErrors)) {
            const frontendKey = map[key] ?? key;
            normalized[frontendKey] = Array.isArray(val) ? val[0] : val;
        }
        return normalized;
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setErrors({});
        setOtpValue("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (mode === "login") {
                const res = await axios.post("/login", {
                    email:    formData.email,
                    password: formData.password,
                });

                localStorage.setItem("token", res.data.token);
                localStorage.setItem("user", JSON.stringify(res.data.user));

                if (typeof onSuccess === "function") onSuccess();
                return;
            }

            if (mode === "register") {
                // is_admin is always forced to 0 on the backend,
                // but we never send it from the frontend either.
                await axios.post("/register", {
                    first_name: formData.firstName,
                    last_name:  formData.lastName,
                    email:      formData.email,
                    password:   formData.password,
                });

                setMode("otp");
                setOtpValue("");
                return;
            }

        } catch (err) {
            const status  = err.response?.status;
            const data    = err.response?.data ?? {};
            const apiMessage = data.message || data.error || "Something went wrong.";
            const apiErrors  = data.errors;

            // Unverified user tried to log in → bounce to OTP screen
            if (status === 403 && data.requires_otp) {
                setFormData((prev) => ({ ...prev, email: data.email ?? prev.email }));
                setMode("otp");
                setOtpValue("");
                return;
            }

            if (apiErrors && typeof apiErrors === "object") {
                setErrors(normalizeErrors(apiErrors));
            } else {
                setErrors({ general: apiMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        setErrors({});

        try {
            const res = await axios.post("/verify-otp", {
                email: formData.email,
                otp:   otpValue,
            });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            if (typeof onSuccess === "function") onSuccess();

        } catch (err) {
            setErrors({
                otp:
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Invalid or expired OTP.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <AnimatePresence mode="wait">

                    {/* ── OTP Screen ── */}
                    {mode === "otp" ? (
                        <motion.div
                            key="otp-fields"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <p className="text-xs text-neutral-500 uppercase tracking-widest leading-relaxed">
                                A verification code was sent to{" "}
                                <strong className="text-black">{formData.email}</strong>
                            </p>

                            <UnderlineInput
                                label="OTP Code"
                                value={otpValue}
                                onChange={setOtpValue}
                                error={errors.otp}
                            />

                            {errors.general && (
                                <p className="text-red-500 text-xs uppercase font-bold">
                                    {errors.general}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Verify & Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setMode("register"); setErrors({}); }}
                                className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors"
                            >
                                ← Back to registration
                            </button>
                        </motion.div>

                    /* ── Login Screen ── */
                    ) : mode === "login" ? (
                        <motion.div
                            key="login-fields"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <UnderlineInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(val) => handleChange("email", val)}
                                error={errors.email}
                            />
                            <UnderlineInput
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(val) => handleChange("password", val)}
                                error={errors.password}
                            />
                        </motion.div>

                    /* ── Register Screen ── */
                    ) : (
                        <motion.div
                            key="register-fields"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col gap-8"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <UnderlineInput
                                    label="First Name"
                                    value={formData.firstName}
                                    onChange={(val) => handleChange("firstName", val)}
                                    error={errors.firstName}
                                />
                                <UnderlineInput
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChange={(val) => handleChange("lastName", val)}
                                    error={errors.lastName}
                                />
                            </div>
                            <UnderlineInput
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(val) => handleChange("email", val)}
                                error={errors.email}
                            />
                            <UnderlineInput
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(val) => handleChange("password", val)}
                                error={errors.password}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* General error */}
                {errors.general && mode !== "otp" && (
                    <p className="text-red-500 text-xs uppercase font-bold">
                        {errors.general}
                    </p>
                )}

                {/* Submit + toggle — hidden on OTP screen */}
                {mode !== "otp" && (
                    <div className="flex flex-col gap-6 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {loading
                                ? "Processing..."
                                : mode === "login"
                                ? "Sign In"
                                : "Create Profile"}
                        </button>

                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 hover:text-black transition-colors"
                        >
                            {mode === "login"
                                ? "New client? Create a profile."
                                : "Already have a profile? Sign in."}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

/* ── Underline Input ──────────────────────────────────────────────────────── */
function UnderlineInput({ label, type = "text", value, onChange, error }) {
    return (
        <div className="relative w-full">
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-800 mb-2">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-transparent border-b py-2 text-sm outline-none transition-all rounded-none ${
                    error
                        ? "border-red-500"
                        : "border-neutral-300 focus:border-black"
                }`}
            />
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 uppercase font-bold overflow-hidden"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}