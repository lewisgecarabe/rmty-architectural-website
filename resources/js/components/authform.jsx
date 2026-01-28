import React, { useState } from 'react';

const AuthForm = ({ type }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Icons defined locally to avoid dependency issues
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.05A10.51 10.51 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.08"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
  );

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      
      {/* Email Field */}
      <div>
        <label className="font-gantari block text-xs font-semibold tracking-widest text-gray-700">
          EMAIL ADDRESS
        </label>
        <div className="mt-3">
          <input
            type="email"
            placeholder="john.doe@example.com"
            className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-400 font-questrial"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <div className="flex justify-between items-center">
          <label className="font-gantari block text-xs font-semibold tracking-widest text-gray-700">
            PASSWORD
          </label>
          {type === 'signin' && (
            <button className="font-questrial text-[11px] text-gray-500 hover:text-gray-800 transition-colors">
              Forgot?
            </button>
          )}
        </div>
        
        <div className="mt-3 relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all placeholder:text-gray-400 font-questrial"
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full block rounded-md bg-gray-800 px-10 py-3 text-xs font-semibold tracking-widest text-white hover:bg-gray-900 transition-colors font-gantari"
        >
          {type === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </div>

    </form>
  );
};

export default AuthForm;