import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function ProjectCard({ 
  title = "PROJECT 1", 
  category = "Brief Details", 
  colSpan = "md:col-span-6", 
  aspectRatio = "aspect-[4/3]", 
  className = "" 
}) {
  return (
    <div className={`w-full flex flex-col gap-3 ${colSpan} ${className}`}>
      
      <Link to="/projects" className="group relative w-full overflow-hidden block cursor-none">
        <div className={`w-full bg-black relative ${aspectRatio}`}>
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg 
              className="h-20 w-20 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
        </div>
      </Link>

      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold uppercase tracking-tight text-black">{title}</h3>
        <p className="text-sm text-gray-500 font-normal">{category}</p>
      </div>

    </div>
  );
}