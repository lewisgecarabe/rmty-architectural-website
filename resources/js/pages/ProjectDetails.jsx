import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// --- MOCK DATA ---
const PROJECTS_DATA = [
  {
    id: "modern-villa",
    title: "Modern Villa",
    location: "Tagaytay, Philippines",
    description: "Non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.",
  },
  {
    id: "city-complex",
    title: "City Complex",
    location: "Makati City, Philippines",
    description: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
  },
  {
    id: "interior-loft",
    title: "Interior Loft",
    location: "BGC, Taguig",
    description: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  }
];

const ProjectPlaceholder = ({ className = "" }) => (
  <div className={`relative w-full h-full bg-[#ccc] group overflow-hidden ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg className="h-20 w-20 text-white/50 group-hover:text-white transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
);

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [prevProject, setPrevProject] = useState(null);
  const [nextProject, setNextProject] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const index = PROJECTS_DATA.findIndex((p) => p.id === id);
    
    if (index !== -1) {
      setProject(PROJECTS_DATA[index]);
      
      const prevIndex = index === 0 ? PROJECTS_DATA.length - 1 : index - 1;
      const nextIndex = index === PROJECTS_DATA.length - 1 ? 0 : index + 1;
      
      setPrevProject(PROJECTS_DATA[prevIndex]);
      setNextProject(PROJECTS_DATA[nextIndex]);
    } else {
      navigate("/projects");
    }
  }, [id, navigate]);

  if (!project) return null;

  return (
    <>
      <main className="w-full bg-[#e6e6e6] min-h-screen pt-32 pb-20 [font-family:var(--font-neue)] text-black">
        <div className="max-w-screen-2xl mx-auto px-6">

          {/* --- TOP ROW: Back Link --- */}
          <div className="w-full flex justify-end mb-12">
            <Link 
              to="/projects" 
              className="text-sm font-bold uppercase tracking-wide border-b border-black hover:opacity-60 transition-opacity pb-1"
            >
              Back to Projects
            </Link>
          </div>

          {/* --- MIDDLE SECTION --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-32">
            
            {/* LEFT COLUMN: Text Info */}
            <div className="lg:col-span-5 flex flex-col justify-between min-h-[400px]">
              {/* Top: Title */}
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tighter leading-none mb-2"
                >
                  {project.title}
                </motion.h1>
                <p className="text-base md:text-lg text-black font-normal">
                  {project.location}
                </p>
              </div>

              {/* Bottom: Description */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-12 lg:mt-0 text-sm md:text-base font-medium leading-relaxed text-black max-w-sm"
              >
                {project.description}
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Main Image */}
            <div className="lg:col-span-7 h-[50vh] lg:h-[600px]">
              <ProjectPlaceholder />
            </div>

          </div>

          {/* --- BOTTOM SECTION: Navigation --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64 md:h-80">
            {/* PREVIOUS */}
            <Link to={`/projects/${prevProject?.id}`} className="relative w-full h-full block group">
              <ProjectPlaceholder />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="border-2 border-black/80 bg-white/10 backdrop-blur-sm p-4 hover:bg-black hover:border-black hover:text-white transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* MIDDLE */}
            <div className="w-full h-full">
              <ProjectPlaceholder />
            </div>

            {/* NEXT */}
            <Link to={`/projects/${nextProject?.id}`} className="relative w-full h-full block group">
              <ProjectPlaceholder />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="border-2 border-black/80 bg-white/10 backdrop-blur-sm p-4 hover:bg-black hover:border-black hover:text-white transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}