import React from "react";

export default function AuthForm({ type = "signin" }) {
  const isLogin = type === "signin";

  return (
    <form className="[font-family:var(--font-neue)]">
      {/* NAME / EMAIL */}
      <div className="mb-5">
        <label className="block text-[10px] tracking-wider text-gray-500 uppercase mb-2">
          {isLogin ? "Name" : "Email"}
        </label>
        <input
          type={isLogin ? "text" : "email"}
          placeholder={isLogin ? "Enter username" : "you@example.com"}
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
          className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-gray-300"
        />

        {isLogin && (
          <div className="mt-2 text-right">
            <button
              type="button"
              className="text-[10px] text-gray-400 hover:text-gray-600 transition"
            >
              Forget your password?
            </button>
          </div>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        className="mt-6 w-full rounded-md bg-black py-3 text-[10px] font-medium tracking-widest text-white uppercase hover:opacity-90 transition"
      >
        {isLogin ? "SIGN IN  →" : "SIGN UP  →"}
      </button>
    </form>
  );
}
