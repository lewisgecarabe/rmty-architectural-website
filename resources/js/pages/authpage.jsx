import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import hooks
import AuthForm from '../components/authform';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Determine "isLogin" strictly by looking at the current URL
  // If the path is exactly '/admin/login', we are in login mode. Otherwise, signup.
  const isLogin = location.pathname === '/admin/login';

  // 2. The toggle function now simply navigates to the other URL.
  // When the URL changes, the component re-renders, and 'isLogin' updates automatically.
  const handleToggle = () => {
    if (isLogin) {
      navigate('/admin/signup');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <section className="max-w-md mx-auto px-6 py-20 min-h-[60vh] flex flex-col justify-center">
      <div className="mb-10 text-center">
        <h1 className="font-gantari text-4xl font-extrabold tracking-wide text-gray-900 uppercase">
          {isLogin ? 'Welcome Back' : 'Join Us'}
        </h1>

        <p className="font-questrial mt-4 text-sm leading-relaxed text-gray-600">
          {isLogin 
            ? "Access your admin dashboard to manage projects and inquiries." 
            : "Create an account to start managing your architectural portfolio."}
        </p>
      </div>

      <div>
        {/* Pass the derived 'isLogin' value to the form */}
        <AuthForm type={isLogin ? 'signin' : 'signup'} />

        <div className="mt-8 text-center border-t border-gray-200 pt-6">
          <p className="font-questrial text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={handleToggle}
              className="ml-2 font-semibold text-gray-900 hover:text-black underline decoration-gray-400 underline-offset-4 transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}