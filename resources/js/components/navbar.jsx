import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/images/RMTYLOGO.png" 
            alt="RMTY Designs Architects"
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">
              RMTY DESIGNS
            </p>
            <p className="text-xs text-gray-600">
              Architects
            </p>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <ul className="hidden md:flex items-center gap-10 text-sm font-medium tracking-wide">
          <li>
            <Link to="/" className="hover:text-gray-500 transition">
              HOME
            </Link>
          </li>
          <li>
            <Link to="/projects" className="hover:text-gray-500 transition">
              PROJECTS
            </Link>
          </li>
          <li>
            <Link to="/services" className="hover:text-gray-500 transition">
              SERVICES
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:text-gray-500 transition">
              ABOUT
            </Link>
          </li>
        </ul>

        {/* Right: Contact button + user icon */}
        <div className="flex items-center gap-4">
          <Link
            to="/contact"
            className="hidden md:inline-block bg-green-800 text-white text-xs font-semibold px-5 py-2 rounded-md hover:bg-green-700 transition"
          >
            CONTACT US
          </Link>

          {/* User Icon */}
          <button className="text-gray-800 hover:text-gray-500 transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
            >
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
            </svg>
          </button>
        </div>

      </nav>
    </header>
  );
}
