import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* HEADER (not sticky) */}
      <header className="w-full z-20">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between [font-family:var(--font-neue)]">
          {/* Left: Hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="text-black hover:opacity-70 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
            </svg>
          </button>

          {/* Center: RMTY (Medium) */}
          <Link
            to="/"
            className="text-2xl md:text-3xl tracking-wide font-medium text-black"
          >
            RMTY
          </Link>

          {/* Right: WORKS (Medium) */}
          <Link
            to="/projects"
            className="text-base md:text-lg tracking-wide font-medium text-black hover:opacity-70 transition"
          >
            WORKS
          </Link>
        </nav>
      </header>

      {/* FULLSCREEN MENU OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-50 bg-[#e6e6e6] [font-family:var(--font-neue)]">
          {/* Top bar inside overlay */}
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            {/* Left: Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-black hover:opacity-70 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29l6.3 6.31 6.3-6.31 1.41 1.42z" />
              </svg>
            </button>

            {/* Right: RMTY (Medium) */}
            <div className="text-xl md:text-2xl tracking-wide font-medium text-black-600">
              RMTY
            </div>
          </div>

          {/* Content grid */}
          <div className="max-w-7xl mx-auto px-6 pb-10 h-[calc(100vh-84px)] flex items-center">
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                         
           {/* Left: Address + Phone (Regular) */}
        <div className="text-base font-normal text-gray-600 space-y-6 self-start pt-16 md:pt-35">
          <div className="leading-relaxed">
            <p>911 JOSEFINA 2 SAMPALOC,</p>
            <p>MANILA, PHILIPPINES, 1008</p>
          </div>
          <p>0924 543 4345</p>

          <div className="flex items-center gap-5 text-black">
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="hover:opacity-70 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.98H8.1V12h2.34V9.8c0-2.31 1.38-3.59 3.49-3.59.99 0 2.02.18 2.02.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.41V12h2.5l-.4 2.89h-2.1v6.98A10 10 0 0 0 22 12Z" />
              </svg>
            </a>

            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="hover:opacity-70 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
              >
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.2-.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
              </svg>
            </a>
          </div>
        </div>



              {/* Center: Big Links (Medium) */}
              <div className="md:col-span-1">
                <ul className="space-y-4 text-4xl md:text-5xl font-medium tracking-wide text-black">
                  {[
                    ["HOME", "/"],
                    ["ABOUT", "/about"],
                    ["PROJECTS", "/projects"],
                    ["SERVICES", "/services"],
                    ["CONTACT", "/contact"],
                  ].map(([label, to]) => (
                    <li key={label}>
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        className="hover:opacity-60 transition"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right spacer */}
              <div className="hidden md:block" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
