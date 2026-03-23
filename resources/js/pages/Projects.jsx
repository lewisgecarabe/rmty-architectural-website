import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard"; 

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter from the actual fetched projects' categories
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
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/projects');
        const projectsData = await projectsRes.json();
        setProjects(projectsData);

        // Derive unique categories from the fetched projects
        // This ensures filter options always match what's actually in the data
        const uniqueCategories = [
          ...new Map(
            projectsData
              .filter(p => p.category?.name)
              .map(p => [p.category.name, p.category])
          ).values()
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchData();
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

        {/* --- SECTION 2: FILTER --- */}
        <div className="relative mb-12 flex items-center gap-4">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">
            Projects
          </h2>

          {/* Only show filter button if there are categories */}
          {categories.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-xs md:text-sm font-medium uppercase tracking-wide flex items-center cursor-pointer gap-1 mt-2 hover:opacity-70 transition-opacity"
              >
                {selectedCategories.length > 0
                  ? `Filter (${selectedCategories.length})`
                  : "Filter"
                }
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    {/* Backdrop to close on outside click */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsFilterOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-[#d9d9d9] p-6 shadow-xl z-30"
                    >
                      {/* Clear all */}
                      {selectedCategories.length > 0 && (
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="text-xs uppercase tracking-wide text-black/40 hover:text-black transition-colors mb-4 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear all
                        </button>
                      )}

                      <div className="flex flex-col gap-3">
                        {categories.map((cat) => {
                          const isSelected = selectedCategories.includes(cat.name);
                          // Count how many projects are in this category
                          const count = projects.filter(p => p.category?.name === cat.name).length;

                          return (
                            <button
                              key={cat.name}
                              onClick={() => toggleCategory(cat.name)}
                              className="flex items-center gap-3 cursor-pointer group select-none h-6 text-left w-full"
                            >
                              <div className={`h-[1px] bg-black transition-all duration-300 ease-out flex-shrink-0 ${
                                isSelected ? 'w-6 opacity-100' : 'w-0 opacity-0 group-hover:w-2 group-hover:opacity-50'
                              }`} />
                              <span className={`text-xs uppercase tracking-wide transition-all duration-300 flex-1 ${
                                isSelected
                                  ? 'text-black translate-x-0'
                                  : 'text-black group-hover:text-black -translate-x-2 group-hover:translate-x-0'
                              }`}>
                                {cat.name}
                              </span>
                              <span className="text-xs text-black/30 flex-shrink-0">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Active filter chips */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1 px-3 py-1 bg-black text-white text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors"
                >
                  {cat}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- SECTION 3: PROJECTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24 items-start">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`group ${project.colSpan || 'col-span-1'}`}
                >
                  <ProjectCard
                    title={project.title}
                    category={project.category?.name}
                    slug={project.slug || project.id}
                    image={project.cover_image || project.image}
                    aspectRatio={project.aspect || "aspect-[4/3]"}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-24 text-center"
              >
                <p className="text-lg font-medium text-black/40 uppercase tracking-wide">
                  No projects found for the selected filters.
                </p>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="mt-4 text-sm underline underline-offset-4 hover:opacity-60 transition-opacity"
                >
                  Clear filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- SECTION 5: "LET'S TALK" --- */}
      <section className="w-full border-t border-black/5 bg-[#f0f0f0]">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[600px] lg:min-h-[700px]">

          <div className="lg:col-span-5 flex flex-col items-start justify-center py-32 px-6 lg:pl-[max(1.5rem,calc((100vw-1536px)/2+1.5rem))] lg:pr-12">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-none">
              Let's Talk.
            </h2>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-md mb-12">
              Non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita.
            </p>
            <Link to="/contact" className="inline-block bg-black text-white px-10 py-5 text-sm font-bold uppercase tracking-widest">
              Book Consultation
            </Link>
          </div>

          <div className="lg:col-span-7 relative w-full h-full min-h-[500px] bg-black overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative group">
                <div className="h-24 w-24 border-2 border-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white/50 text-sm">Image</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}