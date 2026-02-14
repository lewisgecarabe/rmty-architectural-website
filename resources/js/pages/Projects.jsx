import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// --- 1. CONFIGURATION & DATA ---
const CATEGORIES = ["Residential", "Commercial", "Interior Architecture", "Master Planning"];

const ALL_PROJECTS = [
  // Row 1: Regular Cards
  { id: "modern-villa", title: "Modern Villa", category: "Residential", colSpan: "col-span-1", aspect: "aspect-[4/3]" },
  { id: "city-complex", title: "City Complex", category: "Commercial", colSpan: "col-span-1", aspect: "aspect-[4/3]" },
  { id: "interior-loft", title: "Interior Loft", category: "Interior Architecture", colSpan: "col-span-1", aspect: "aspect-[4/3]" },
  
  // Row 2: Mixed
  { id: "master-plan-1", title: "Urban Center", category: "Master Planning", colSpan: "col-span-1", aspect: "aspect-[4/3]" },
  { id: "seaside-retreat", title: "Seaside Retreat", category: "Residential", colSpan: "md:col-span-2", aspect: "aspect-[16/9]" },
  
  // Row 3: Mixed
  { id: "tech-hub", title: "Tech Hub", category: "Commercial", colSpan: "md:col-span-2", aspect: "aspect-[16/9]" },
  { id: "coffee-shop", title: "Barista Space", category: "Interior Architecture", colSpan: "col-span-1", aspect: "aspect-[4/3]" },
  
  // Row 4: Full Width
  { id: "eco-park", title: "Eco Park", category: "Master Planning", colSpan: "md:col-span-3", aspect: "aspect-[21/9]" },
];

// --- 2. REUSABLE COMPONENTS ---

// A single reusable placeholder for all images
const PlaceholderImage = ({ iconSize = "h-20 w-20" }) => (
  <div className="relative w-full h-full bg-black group overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg className={`${iconSize} text-white group-hover:text-white transition-colors duration-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
  </div>
);

// A reusable Project Card component to clean up the main loop
const ProjectCard = ({ project }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`group ${project.colSpan || 'col-span-1'}`}
    >
      <Link to={`/projects/${project.slug}`} className="block cursor-pointer h-full">
        {/* Dynamic Aspect Ratio Container */}
        <div className={`w-full ${project.aspect} mb-4 overflow-hidden bg-gray-200`}>
  {project.image ? (
    <img
      src={`/storage/${project.image}`}
      alt={project.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <PlaceholderImage />
  )}
</div>

        
        {/* Card Text Info */}
        <div className="flex flex-col items-start border-t border-black/10 pt-4">
          <h3 className="text-lg font-bold uppercase tracking-tight group-hover:opacity-60 transition-opacity">
            {project.title}
          </h3>
          <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
            {project.category?.name}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default function Projects() {
    const [projects, setProjects] = useState([]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProjects = selectedCategories.length === 0
  ? projects
  : projects.filter(p => selectedCategories.includes(p.category?.name));


  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  useEffect(() => {
    const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  fetchProjects();
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="w-full bg-[#e6e6e6] min-h-screen pt-32 [font-family:var(--font-neue)] text-black">
      <div className="max-w-screen-2xl mx-auto px-6">
        
        {/* --- SECTION 1: HERO BANNER --- */}
        <div className="relative w-full h-[40vh] md:h-[500px] bg-gray-800 overflow-hidden mb-16 md:mb-24 flex items-center">
           <div className="absolute inset-0 bg-black z-10" />
           <div className="relative z-20 w-full px-6 md:px-12">
             <h1 className="text-white text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none">
               Every Design <br />
               <span className="text-white/70">With Purpose</span>
             </h1>
           </div>
        </div>

        <div className="relative mb-12 flex items-center gap-4">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Projects
          </h2>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-xs md:text-sm font-medium uppercase tracking-wide flex items-center cursor-pointer gap-1 mt-2 hover:opacity-70 transition-opacity"
            >
              Filter 
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-[#d9d9d9] p-6 shadow-xl z-30"
                >
                  <div className="flex flex-col gap-3">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      
                      return (
                        <button 
                          key={cat} 
                          onClick={() => toggleCategory(cat)}
                          className="flex items-center gap-3 cursor-pointer group select-none h-6 text-left"
                        >
                          {/* The Line Indicator */}
                          <div className={`h-[1px] bg-black transition-all duration-300 ease-out ${
                            isSelected ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-2 group-hover:opacity-50'
                          }`} />

                          {/* Text */}
                          <span className={`text-xs uppercase tracking-wide transition-all duration-300 ${
                            isSelected ? 'text-black translate-x-0' : 'text-black group-hover:text-black -translate-x-2 group-hover:translate-x-0'
                          }`}>
                            {cat}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- SECTION 3: PROJECTS GRID --- */}
        {/* We use 'items-start' to ensure mixed-height cards don't stretch weirdly */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 items-start">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* --- SECTION 4: PAGINATION --- */}
        <div className="flex justify-center gap-4 mb-32 text-sm font-medium">
          <span className="cursor-pointer border-b border-black">1</span>
          <span className="cursor-pointer text-gray-400 hover:text-black">2</span>
          <span className="cursor-pointer text-gray-400 hover:text-black">3</span>
          <span className="cursor-pointer text-gray-400 hover:text-black">&gt;</span>
        </div>

      </div>

      {/* --- SECTION 5: "LET'S TALK" (Full Bleed Right) --- */}
      <section className="w-full border-t border-black/5 bg-[#f0f0f0]">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[600px] lg:min-h-[700px]"> {/* Added min-h for taller section */}
          
          {/* LEFT: Text Info 
              - Increased padding (py-32 instead of py-24) to add breathing room
          */}
          <div className="lg:col-span-5 flex flex-col items-start justify-center py-32 px-6 lg:pl-[max(1.5rem,calc((100vw-1536px)/2+1.5rem))] lg:pr-12">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-none">
              Let’s Talk.
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-md mb-12">
              Non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita.
            </p>
            
            <Link
              to="/contact"
              className="inline-block bg-black text-white px-10 py-5 text-sm font-bold uppercase tracking-widest"
            >
              Book Consultation
            </Link>
          </div>

          {/* RIGHT: Full Bleed Image 
              - Removed h-[400px]
              - Added h-full and min-h-[500px] to ensure it stretches
          */}
          <div className="lg:col-span-7 relative w-full h-full min-h-[500px] bg-black overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative group">
                    <PlaceholderImage iconSize="h-24 w-24" /> {/* Slightly larger icon for larger area */}
                 </div>
              </div>
          </div>

        </div>
      </section>

    </main>
  );
}