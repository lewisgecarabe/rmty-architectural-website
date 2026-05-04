import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
    validateEmail,
    validateStrongPassword,
    PASSWORD_HINT,
    EMAIL_HINT,
} from "../lib/validation";

export default function ClientAuthForm({
    prefillEmail = "",
    prefillFirstName = "",
    prefillLastName = "",
    onSuccess,
}) {
    const [isLogin, setIsLogin] = useState(true);

    const [firstName, setFirstName] = useState(prefillFirstName);
    const [lastName, setLastName] = useState(prefillLastName);
    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    // Ensure state updates if props change after initial mount
    useEffect(() => {
        if (prefillEmail) setEmail(prefillEmail);
        if (prefillFirstName) setFirstName(prefillFirstName);
        if (prefillLastName) setLastName(prefillLastName);
    }, [prefillEmail, prefillFirstName, prefillLastName]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErrors({
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        });

        // Validations
        let hasError = false;
        const newFieldErrors = {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        };

        if (!isLogin) {
            if (!firstName.trim()) {
                newFieldErrors.firstName = "First name is required.";
                hasError = true;
            }
            if (!lastName.trim()) {
                newFieldErrors.lastName = "Last name is required.";
                hasError = true;
            }
        }

        const emailErr = validateEmail(email);
        const passwordErr = validateStrongPassword(password);

        if (emailErr || passwordErr) {
            newFieldErrors.email = emailErr || "";
            newFieldErrors.password = passwordErr || "";
            hasError = true;
        }

        if (hasError) {
            setFieldErrors(newFieldErrors);
            return;
        }

        try {
            // Adjust these endpoints to match your actual backend client routes
            const endpoint = isLogin ? "/client/login" : "/client/register";
            const payload = isLogin
                ? { email: email.trim(), password }
                : {
                      firstName: firstName.trim(),
                      lastName: lastName.trim(),
                      email: email.trim(),
                      password,
                  };

            const res = await api.post(endpoint, payload);

            // Save tokens (adjust key names based on your backend logic)
            localStorage.setItem("client_token", res.data.token);
            if (res.data.user?.id) {
                localStorage.setItem("clientId", res.data.user.id);
            }

            // Trigger the success redirect handled in ClientAuthPage
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.response?.data?.errors?.email?.[0] ||
                    err.response?.data?.errors?.password?.[0] ||
                    (isLogin ? "Login failed" : "Registration failed"),
            );
        }
    };

    return (
        <form
            className="[font-family:var(--font-neue)] w-full max-w-2xl flex flex-col gap-7 mx-auto"
            onSubmit={handleSubmit}
            action="javascript:void(0)"
        >
            {/* Top Level Error */}
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
            </AnimatePresence>

            {/* NAME FIELDS (Only show if registering) */}
            <AnimatePresence>
                {!isLogin && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-4 overflow-hidden"
                    >
                        {/* First Name */}
                        <div className="relative group w-1/2">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                <span>First Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        firstName: "",
                                    }));
                                }}
                                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
                                    ${fieldErrors.firstName ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                `}
                            />
                            {fieldErrors.firstName && (
                                <p className="text-[10px] tracking-wide text-red-500 mt-2">
                                    {fieldErrors.firstName}
                                </p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="relative group w-1/2">
                            <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                                <span>Last Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    setFieldErrors((prev) => ({
                                        ...prev,
                                        lastName: "",
                                    }));
                                }}
                                className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
                                    ${fieldErrors.lastName ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                                `}
                            />
                            {fieldErrors.lastName && (
                                <p className="text-[10px] tracking-wide text-red-500 mt-2">
                                    {fieldErrors.lastName}
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EMAIL */}
            <div className="relative group">
                <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                    <span>Email</span>
                </label>
                <input
                    type="text"
                    inputMode="email"
                    placeholder="Enter your email"
                    maxLength={50}
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
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

            {/* PASSWORD */}
            <div className="relative group">
                <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                    <span>Password</span>
                    {isLogin && (
                        <Link
                            to="/forgot-password"
                            className="text-[10px] text-gray-400 hover:text-black transition-colors"
                        >
                            Forgot?
                        </Link>
                    )}
                </label>

                {/* Input Wrapper for positioning the eye icon */}
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        maxLength={64}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((prev) => ({
                                ...prev,
                                password: "",
                            }));
                        }}
                        className={`w-full bg-transparent border-b px-0 pr-8 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
                            ${fieldErrors.password ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
                        `}
                    />

                    {/* Toggle Password Visibility Button */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors outline-none cursor-pointer"
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
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

            {/* BUTTONS */}
            <div className="mt-6">
                <button
                    type="submit"
                    className="w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98]"
                >
                    {isLogin ? "Sign In" : "Create Account"}
                </button>

                {/* Toggle Login/Register Mode */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                            setFieldErrors({
                                firstName: "",
                                lastName: "",
                                email: "",
                                password: "",
                            });
                        }}
                        className="text-[10px] font-medium tracking-[0.1em] text-gray-500 hover:text-black uppercase transition-colors cursor-pointer"
                    >
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </form>
    );
}

// Minimal SVG Icons
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
