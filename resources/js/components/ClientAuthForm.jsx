import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";

export default function ClientAuthForm({
    onSuccess,
    prefillEmail     = "",
    prefillFirstName = "",
    prefillLastName  = "",
}) {
    // mode: login | register | otp | forgot | forgot_otp | forgot_reset
    const [mode,    setMode]    = useState("login");
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: prefillFirstName,
        lastName:  prefillLastName,
        email:     prefillEmail,
        password:  "",
    });

    const [otpValue,    setOtpValue]    = useState("");
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp,   setForgotOtp]   = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [errors,      setErrors]      = useState({});
    const [successMsg,  setSuccessMsg]  = useState("");

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

    const toSnakeCase = (str) => str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

    const normalizeErrors = (apiErrors) => {
        const map = { first_name: "firstName", last_name: "lastName", email: "email", password: "password" };
        const out = {};
        for (const [k, v] of Object.entries(apiErrors)) {
            out[map[k] ?? k] = Array.isArray(v) ? v[0] : v;
        }
        return out;
    };

    const toggleMode = () => {
        setMode((p) => (p === "login" ? "register" : "login"));
        setErrors({});
        setOtpValue("");
        setSuccessMsg("");
    };

    // ── OTP input: numbers only, max 6 digits ─────────────────────────────
    const handleOtpChange = (raw, setter) => {
        const digits = raw.replace(/\D/g, "").slice(0, 6);
        setter(digits);
    };

    // ── Login / Register ──────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMsg("");

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
            const status = err.response?.status;
            const data   = err.response?.data ?? {};
            const msg    = data.message || data.error || "Something went wrong.";

            // Unverified user tried to log in → check email registered before showing OTP
            if (status === 403 && data.requires_otp) {
                setFormData((p) => ({ ...p, email: data.email ?? p.email }));
                setMode("otp");
                setOtpValue("");
                return;
            }
            if (data.errors && typeof data.errors === "object") {
                setErrors(normalizeErrors(data.errors));
            } else {
                setErrors({ general: msg });
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Verify registration OTP ───────────────────────────────────────────
    const handleVerifyOtp = async () => {
        // Client-side: must be exactly 6 digits
        if (otpValue.length !== 6) {
            setErrors({ otp: "Please enter the 6-digit code." });
            return;
        }

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
            setErrors({ otp: err.response?.data?.message || "Invalid or expired OTP." });
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password: send OTP ─────────────────────────────────────────
    const handleForgotSend = async (e) => {
        e.preventDefault();

        // Basic email format check before hitting the API
        if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
            setErrors({ forgotEmail: "Enter a valid email address." });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMsg("");
        try {
            await axios.post("/client/forgot-password", { email: forgotEmail });
            setSuccessMsg("A reset code was sent to your email.");
            setMode("forgot_otp");
        } catch (err) {
            setErrors({ forgotEmail: err.response?.data?.message || "Could not send reset code." });
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password: verify OTP ───────────────────────────────────────
    const handleForgotOtp = async (e) => {
        e.preventDefault();

        if (forgotOtp.length !== 6) {
            setErrors({ forgotOtp: "Please enter the 6-digit code." });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            await axios.post("/client/verify-reset-otp", {
                email: forgotEmail,
                otp:   forgotOtp,
            });
            setMode("forgot_reset");
        } catch (err) {
            setErrors({ forgotOtp: err.response?.data?.message || "Invalid or expired code." });
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password: set new password ────────────────────────────────
    const handleForgotReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPass) {
            setErrors({ confirmPass: "Passwords do not match." });
            return;
        }
        if (newPassword.length < 8) {
            setErrors({ newPassword: "Password must be at least 8 characters." });
            return;
        }
        setLoading(true);
        setErrors({});
        try {
            await axios.post("/client/reset-password", {
                email:                 forgotEmail,
                otp:                   forgotOtp,
                password:              newPassword,
                password_confirmation: confirmPass,
            });
            setSuccessMsg("Password reset! You can now sign in.");
            setMode("login");
            setFormData((p) => ({ ...p, email: forgotEmail, password: "" }));
        } catch (err) {
            setErrors({ general: err.response?.data?.message || "Reset failed. Try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">

            {successMsg && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-6 text-[11px] font-bold tracking-wide text-emerald-700 uppercase border border-emerald-200 bg-emerald-50 px-4 py-3">
                    {successMsg}
                </motion.p>
            )}

            <AnimatePresence mode="wait">

                {/* ── OTP (registration) ── */}
                {mode === "otp" && (
                    <motion.div key="otp"
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">

                        <p className="text-xs text-neutral-500 uppercase tracking-widest leading-relaxed">
                            Verification code sent to{" "}
                            <strong className="text-black">{formData.email}</strong>
                        </p>

                        {/* OTP digits display */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-800">
                                6-Digit Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otpValue}
                                onChange={(e) => handleOtpChange(e.target.value, setOtpValue)}
                                placeholder="• • • • • •"
                                className={`w-full bg-transparent border-b py-3 text-2xl font-bold tracking-[0.5em] outline-none transition-all rounded-none text-center ${
                                    errors.otp ? "border-red-500 text-red-500" : "border-neutral-300 focus:border-black text-black"
                                }`}
                            />
                            {/* Progress dots */}
                            <div className="flex justify-center gap-2 mt-1">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                                        i < otpValue.length ? "bg-black" : "bg-neutral-200"
                                    }`} />
                                ))}
                            </div>
                            <AnimatePresence>
                                {errors.otp && (
                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-1 uppercase font-bold overflow-hidden text-center">
                                        {errors.otp}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {errors.general && (
                            <p className="text-red-500 text-xs uppercase font-bold">{errors.general}</p>
                        )}

                        <button type="button" onClick={handleVerifyOtp} disabled={loading || otpValue.length !== 6}
                            className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50 transition-all">
                            {loading ? "Processing..." : "Verify & Continue"}
                        </button>

                        <button type="button" onClick={() => { setMode("register"); setErrors({}); setOtpValue(""); }}
                            className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
                            ← Back to registration
                        </button>
                    </motion.div>
                )}

                {/* ── Forgot: enter email ── */}
                {mode === "forgot" && (
                    <motion.form key="forgot" onSubmit={handleForgotSend}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">Forgot Password</p>
                            <p className="text-xs text-neutral-500 leading-relaxed">Enter your registered email and we'll send a reset code.</p>
                        </div>
                        <UnderlineInput label="Email" type="email" value={forgotEmail} onChange={setForgotEmail} error={errors.forgotEmail} />
                        <button type="submit" disabled={loading}
                            className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50">
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                        <button type="button" onClick={() => { setMode("login"); setErrors({}); }}
                            className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
                            ← Back to sign in
                        </button>
                    </motion.form>
                )}

                {/* ── Forgot: verify OTP ── */}
                {mode === "forgot_otp" && (
                    <motion.form key="forgot_otp" onSubmit={handleForgotOtp}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">

                        <p className="text-xs text-neutral-500 uppercase tracking-widest leading-relaxed">
                            Enter the code sent to <strong className="text-black">{forgotEmail}</strong>
                        </p>

                        {/* Numeric OTP input */}
                        <div className="flex flex-col gap-2">
                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-800">
                                6-Digit Code
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={forgotOtp}
                                onChange={(e) => handleOtpChange(e.target.value, setForgotOtp)}
                                placeholder="• • • • • •"
                                className={`w-full bg-transparent border-b py-3 text-2xl font-bold tracking-[0.5em] outline-none transition-all rounded-none text-center ${
                                    errors.forgotOtp ? "border-red-500 text-red-500" : "border-neutral-300 focus:border-black text-black"
                                }`}
                            />
                            <div className="flex justify-center gap-2 mt-1">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                                        i < forgotOtp.length ? "bg-black" : "bg-neutral-200"
                                    }`} />
                                ))}
                            </div>
                            <AnimatePresence>
                                {errors.forgotOtp && (
                                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] tracking-wide text-red-500 mt-1 uppercase font-bold overflow-hidden text-center">
                                        {errors.forgotOtp}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <button type="submit" disabled={loading || forgotOtp.length !== 6}
                            className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50">
                            {loading ? "Verifying..." : "Verify Code"}
                        </button>
                        <button type="button" onClick={() => { setMode("forgot"); setErrors({}); setForgotOtp(""); }}
                            className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
                            ← Resend code
                        </button>
                    </motion.form>
                )}

                {/* ── Forgot: new password ── */}
                {mode === "forgot_reset" && (
                    <motion.form key="forgot_reset" onSubmit={handleForgotReset}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">New Password</p>
                            <p className="text-xs text-neutral-500">Choose a strong password — min 8 characters.</p>
                        </div>
                        <UnderlineInput label="New Password"     type="password" value={newPassword} onChange={setNewPassword} error={errors.newPassword} />
                        <UnderlineInput label="Confirm Password" type="password" value={confirmPass}  onChange={setConfirmPass}  error={errors.confirmPass} />
                        {errors.general && <p className="text-red-500 text-xs uppercase font-bold">{errors.general}</p>}
                        <button type="submit" disabled={loading}
                            className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50">
                            {loading ? "Saving..." : "Reset Password"}
                        </button>
                    </motion.form>
                )}

                {/* ── Login ── */}
                {mode === "login" && (
                    <motion.form key="login" onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">

                        <UnderlineInput label="Email"    type="email"    value={formData.email}    onChange={(v) => handleChange("email",    v)} error={errors.email} />
                        <UnderlineInput label="Password" type="password" value={formData.password} onChange={(v) => handleChange("password", v)} error={errors.password} />

                        <button type="button"
                            onClick={() => { setForgotEmail(formData.email); setMode("forgot"); setErrors({}); setSuccessMsg(""); }}
                            className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 hover:text-black transition-colors text-right -mt-4">
                            Forgot password?
                        </button>

                        {errors.general && <p className="text-red-500 text-xs uppercase font-bold">{errors.general}</p>}

                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={loading}
                                className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50">
                                {loading ? "Processing..." : "Sign In"}
                            </button>
                            <button type="button" onClick={toggleMode}
                                className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 hover:text-black transition-colors">
                                New client? Create a profile.
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* ── Register ── */}
                {mode === "register" && (
                    <motion.form key="register" onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                        className="flex flex-col gap-8">

                        <div className="grid grid-cols-2 gap-4">
                            <UnderlineInput label="First Name" value={formData.firstName} onChange={(v) => handleChange("firstName", v)} error={errors.firstName} />
                            <UnderlineInput label="Last Name"  value={formData.lastName}  onChange={(v) => handleChange("lastName",  v)} error={errors.lastName} />
                        </div>
                        <UnderlineInput label="Email"    type="email"    value={formData.email}    onChange={(v) => handleChange("email",    v)} error={errors.email} />
                        <UnderlineInput label="Password" type="password" value={formData.password} onChange={(v) => handleChange("password", v)} error={errors.password} />

                        {errors.general && <p className="text-red-500 text-xs uppercase font-bold">{errors.general}</p>}

                        <div className="flex flex-col gap-4">
                            <button type="submit" disabled={loading}
                                className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 disabled:opacity-50">
                                {loading ? "Processing..." : "Create Profile"}
                            </button>
                            <button type="button" onClick={toggleMode}
                                className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 hover:text-black transition-colors">
                                Already have a profile? Sign in.
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}

function UnderlineInput({ label, type = "text", value, onChange, error }) {
    return (
        <div className="relative w-full">
            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-800 mb-2">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-transparent border-b py-2 text-sm outline-none transition-all rounded-none ${
                    error ? "border-red-500" : "border-neutral-300 focus:border-black"
                }`} />
            <AnimatePresence>
                {error && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] tracking-wide text-red-500 mt-2 uppercase font-bold overflow-hidden">
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}