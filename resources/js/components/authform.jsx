import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // <-- Added Framer Motion
import api from "../api/axios";
import {
    validateEmail,
    validateStrongPassword,
    PASSWORD_HINT,
    EMAIL_HINT,
} from "../lib/validation";

export default function AuthForm({ type = "signin" }) {
    const navigate = useNavigate();
    const isLogin = type === "signin";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErrors({ email: "", password: "" });

        const emailErr = validateEmail(email);
        const passwordErr = validateStrongPassword(password);
        if (emailErr || passwordErr) {
            setFieldErrors({
                email: emailErr || "",
                password: passwordErr || "",
            });
            return;
        }

        try {
            const res = await api.post("/admin/login", {
                email: email.trim(),
                password,
            });

            localStorage.setItem("admin_token", res.data.token);
            navigate("/admin/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.response?.data?.errors?.email?.[0] ||
                    err.response?.data?.errors?.password?.[0] ||
                    "Login failed",
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

            {/* EMAIL */}
            <div className="relative group">
                <label className="flex justify-between items-end text-[10px] tracking-widest text-gray-500 uppercase mb-1">
                    <span>Email</span>
                </label>
                <input
                    type="text"
                    inputMode="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    /* BALANCED PADDING: py-3 is cleaner than py-4 */
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
                    <Link
                        to="/admin/forgot-password"
                        size="text-[10px]"
                        className="text-gray-400 hover:text-black transition-colors"
                    >
                        Forgot?
                    </Link>
                </label>
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`w-full bg-transparent border-b px-0 py-3 text-base outline-none transition-colors rounded-none placeholder:text-gray-300
        ${fieldErrors.password ? "border-red-500 text-red-500" : "border-gray-300 focus:border-black text-black"}
      `}
                />

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

            {/* BUTTON */}
            <button
                type="submit"
                /* COMPACT STRENGTH: py-4 with bold tracking */
                className="mt-6 w-full rounded-none bg-black py-4 text-[10px] font-bold tracking-[0.25em] text-white uppercase transition-all hover:bg-neutral-800 cursor-pointer active:scale-[0.98]"
            >
                Sign In
            </button>
        </form>
    );
}
