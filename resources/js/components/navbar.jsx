import { useState } from "react";
import { Link, useLocation } from "react-router-dom"; // 1. Import useLocation
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar({ onOpenMenu }) {
  const { scrollY } = useScroll();
  const location = useLocation(); // 2. Get current location
  
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 3. Define which pages need Black Text (Light Backgrounds)
  // .includes("/projects") covers both the list and the details page
  const isLightPage = location.pathname.includes("/projects") || location.pathname === "/about" || location.pathname === "/services";

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    setIsScrolled(latest > 50);
    setHidden(latest > previous && latest > 150);
  });

  const navStyle = isScrolled 
    ? "bg-[#e6e6e6] text-black shadow-sm" 
    : isLightPage 
      ? "bg-transparent text-black"  
      : "bg-transparent text-white";    

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.60, ease: "easeInOut" }}
      
      // 5. Apply the calculated style variable here
      className={`fixed top-0 left-0 w-full z-40 transition-colors duration-300 py-6 ${navStyle}`}
    >
      <nav className="max-w-screen-2xl mx-auto px-6 grid grid-cols-3 items-center [font-family:var(--font-neue)]">
        
        <div className="justify-self-start -ml-2">
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="block"
          >
            {/* fill="currentColor" inherits text-black or text-white automatically */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-10 cursor-pointer">
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
            </svg>
          </button>
        </div>

        {/* Center: Logo */}
        <div className="justify-self-center">
          <Link 
            to="/" 
            className="text-2xl md:text-5xl font-medium tracking-tight"
          >
            RMTY
          </Link>
        </div>

        {/* Right: CTA */}
        <div className="justify-self-end">
          <Link 
            to="/projects" 
            className="text-base md:text-2xl tracking-wide font-medium"
          >
            WORKS
          </Link>
        </div>

      </nav>
    </motion.header>
  );
}