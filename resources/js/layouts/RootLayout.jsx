import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion"; // <--- Import this

import Navbar from "../components/Navbar";
import MenuOverlay from "../components/MenuOverlay";
import Footer from "../components/Footer";
import CursorFollower from "../components/CursorFollower";

export default function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">

      <CursorFollower />
      
      <Navbar onOpenMenu={() => setIsMenuOpen(true)} />

      <AnimatePresence>
        {isMenuOpen && <MenuOverlay onClose={() => setIsMenuOpen(false)} />}
      </AnimatePresence>

      <Outlet />

      <Footer />
    </div>
  );
}