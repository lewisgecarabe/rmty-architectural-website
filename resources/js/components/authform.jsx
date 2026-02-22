import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AuthForm({ type = "signin" }) {
  const navigate = useNavigate();
  const isLogin = type === "signin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/admin/login", {
        email,
        password,
      });

      localStorage.setItem("admin_token", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
          type="email"
          placeholder="admin@architect.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-300"
        />
      </div>

      {/* PASSWORD */}
      <div className="mb-4">
        <label className="block text-[10px] tracking-wider text-gray-500 uppercase mb-2">
          Password
        </label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-300"
        />
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
