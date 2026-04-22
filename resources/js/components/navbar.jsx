import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar({ onOpenMenu }) {
  const { scrollY } = useScroll();
  const location = useLocation();
  
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    setIsScrolled(latest > 50);
    setHidden(latest > previous && latest > 150);
  });

  // Forced black text for clarity as requested
  const navStyle = isScrolled 
    ? "bg-[#e6e6e6] text-black" 
    : "bg-transparent text-black";    

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.60, ease: "easeInOut" }}
      className={`fixed top-0 left-0 w-full z-40 transition-colors duration-300 py-6 ${navStyle}`}
    >
      <nav className="max-w-screen-2xl mx-auto px-6 grid grid-cols-3 items-center [font-family:var(--font-neue)]">
        
        <div className="justify-self-start -ml-2">
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="block"
          >
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
          <div className="flex items-center gap-4 md:gap-6 text-sm md:text-xl tracking-wide font-medium">
            <Link to="/faq" className="hover:opacity-70 transition-opacity">
              FAQ
            </Link>
            <Link to="/projects" className="hover:opacity-70 transition-opacity">
              WORKS
            </Link>
          </div>
        </div>

      </nav>
    </motion.header>
  );
}