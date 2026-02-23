import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { validateEmail, validateStrongPassword, PASSWORD_HINT, EMAIL_HINT } from "../lib/validation";

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
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || err.response?.data?.errors?.password?.[0] || "Login failed");
    }
  };

  return (
    <form
      className="[font-family:var(--font-neue)]"
      onSubmit={handleSubmit}
      action="javascript:void(0)"
    >
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}

      {/* EMAIL */}
      <div className="mb-5">
        <label className="block text-[10px] tracking-wider text-gray-500 uppercase mb-2">
          Email
        </label>
        <input
          type="text"
          inputMode="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: "" })); }}
          className={`w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 ${fieldErrors.email ? "border-red-400" : "border-gray-200"}`}
        />
        <p className="mt-1 text-[11px] text-gray-500">{EMAIL_HINT}</p>
        {fieldErrors.email && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.email}</p>}
      </div>

      {/* PASSWORD */}
      <div className="mb-4">
        <label className="block text-[10px] tracking-wider text-gray-500 uppercase mb-2">
          Password
        </label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: "" })); }}
          className={`w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-400 ${fieldErrors.password ? "border-red-400" : "border-gray-200"}`}
        />
        <p className="mt-1 text-[11px] text-gray-500">{PASSWORD_HINT}</p>
        {fieldErrors.password && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.password}</p>}
         <a
    href="/admin/forgot-password"
    className="text-sm text-blue-600 hover:text-blue-800"
  >
    Forgot Password?
  </a>
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        className="mt-6 w-full rounded-md bg-black py-3 text-[10px] font-medium tracking-widest text-white uppercase hover:opacity-90 transition"
      >
        SIGN IN →
      </button>
    </form>
  );
}
