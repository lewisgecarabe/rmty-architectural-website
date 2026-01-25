import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="w-full"
      style={{ backgroundColor: "#2F4B3F", color: "#FFF9F9" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-5">

        {/* Top Section */}
       <div className="grid grid-cols-1 md:grid-cols-6 gap-12">


                {/* Logo & Brand */}
            <div className="md:col-span-2 flex items-center gap-2">
            <img
                src="/images/RMTYLOGO.png"
                alt="RMTY Designs Architects"
                className="h-40 w-40"
            />
            <div className="leading-tight font-medium">
                <p className="tracking-wide text-3xl">RMTY</p>
                <p className="tracking-wide text-2xl">DESIGNS</p>
                <p className="font-normal text-xl">Architects</p>
            </div>
            </div>


          {/* Home */}
          <div className="text-sm space-y-3">
            <p className="font-semibold tracking-wide">HOME</p>
          </div>

                    {/* Projects */}
            <div className="text-sm space-y-2">
            <p className="font-semibold tracking-wide">PROJECTS</p>
            <ul className="space-y-1 opacity-90">
                <li>
                <Link to="/projects/residential" className="hover:text-gray-500 transition">
                    Residential
                </Link>
                </li>
                <li>
                <Link to="/projects/commercial" className="hover:text-gray-500 transition">
                    Commercial
                </Link>
                </li>
                <li>
                <Link to="/projects/interior-architecture" className="hover:text-gray-500 transition">
                    Interior Architecture
                </Link>
                </li>
                <li>
                <Link to="/projects/master-planning" className="hover:text-gray-500 transition">
                    Master Planning
                </Link>
                </li>
            </ul>
            </div>

            {/* Services */}
            <div className="text-sm space-y-2">
            <p className="font-semibold tracking-wide">SERVICES</p>
            <ul className="space-y-1 opacity-90">
                <li>
                <Link to="/services/architecture" className="hover:text-gray-500 transition">
                    Architecture
                </Link>
                </li>
                <li>
                <Link to="/services/interiors" className="hover:text-gray-500 transition">
                    Interiors
                </Link>
                </li>
                <li>
                <Link to="/services/conceptual-planning" className="hover:text-gray-500 transition">
                    Conceptual Planning
                </Link>
                </li>
            </ul>
            </div>


          {/* About / Connect */}
          <div className="text-sm space-y-4">
            <p className="font-semibold tracking-wide">CONNECT WITH US</p>
            <p className="text-xs opacity-90 leading-relaxed">
              Get the latest stories, insights, and project updates from
              RMTY Designs Architects.
            </p>

            {/* Email Input */}
            <div className="flex items-center bg-white rounded-md overflow-hidden">
              <input
                type="email"
                placeholder="Your email"
                className="px-3 py-2 text-sm w-full text-gray-800 outline-none"
              />
              <button className="px-3 text-gray-800">
                →
              </button>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a href="#" aria-label="Facebook">
                <img src="/icons/facebook.svg" alt="Facebook" className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram">
                <img src="/icons/instagram.svg" alt="Instagram" className="w-5 h-5" />
              </a>
            </div>
          </div>

        </div>

                {/* Divider */}
            <div className="border-t border-white/30 my-2"></div>

            {/* Bottom Bar */}
            <div className="relative flex items-center text-xs opacity-90">
            <p className="absolute left-1/2 transform -translate-x-1/2">
                © 2025 RMTY Designs Architects
            </p>

            <div className="ml-auto flex gap-6">
                <Link to="/privacy-policy" className="hover:underline">
                Privacy Policy
                </Link>
                <Link to="/terms" className="hover:underline">
                Terms of Use
                </Link>
            </div>
            </div>

      </div>
    </footer>
  );
}
