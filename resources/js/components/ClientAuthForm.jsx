import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ClientAuthForm - Handles Client Sign In and Registration.
 * Monochromatic, brutalist design with underline inputs.
 */
export default function ClientAuthForm({ onSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Mock Validation
        const newErrors = {};
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.password) newErrors.password = "Password is required.";
        
        if (!isLogin) {
            if (!formData.firstName) newErrors.firstName = "First Name is required.";
            if (!formData.lastName) newErrors.lastName = "Last Name is required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        // Logic for login/register would go here
        console.log("Submitting:", isLogin ? "Login" : "Register", formData);
        
        // Simulating API call
        setTimeout(() => {
            setLoading(false);
            if (onSuccess) onSuccess();
        }, 1500);
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <AnimatePresence mode="wait">
                    {isLogin ? (
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

                <div className="flex flex-col gap-6 mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : isLogin ? "Sign In" : "Create Profile"}
                    </button>

                    <button
                        type="button"
                        onClick={toggleMode}
                        className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 hover:text-black transition-colors"
                    >
                        {isLogin ? "New client? Create a profile." : "Already have a profile? Sign in."}
                    </button>
                </div>
            </form>
        </div>
    );
}

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
                className={`w-full bg-transparent border-b py-2 text-sm outline-none transition-all rounded-none
                    ${error ? "border-red-500" : "border-neutral-300 focus:border-black"}
                `}
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
