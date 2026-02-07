import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorFollower() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      mouseX.set(e.clientX - 8);
      mouseY.set(e.clientY - 8);
    };

    const checkHover = (e) => {
      const target = e.target;
      
      const isClickable = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" || 
        target.closest("a") || 
        target.closest("button") ||
        target.closest(".hover-target"); 

      setIsHovered(!!isClickable);
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", checkHover);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", checkHover);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{
        translateX: cursorX,
        translateY: cursorY,
      }}
      animate={{
        scale: isHovered ? 4 : 1,
      }}
      
      className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
    />
  );
}