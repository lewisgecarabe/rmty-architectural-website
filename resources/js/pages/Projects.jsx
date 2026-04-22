import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [ctaSettings, setCtaSettings] = useState({ image: null, text: "" });

    const filteredProjects =
        selectedCategories.length === 0
            ? projects
            : projects.filter((p) =>
                  selectedCategories.includes(p.category?.name),
              );

    const countForCategory = (categoryName) =>
        projects.filter((p) => p.category?.name === categoryName).length;

    const handleToggleCategory = (categoryName) => {
        setSelectedCategories((prev) =>
            prev.includes(categoryName)
                ? prev.filter((name) => name !== categoryName)
                : [...prev, categoryName],
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects");
                const data = await res.json();
                setProjects(data);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };

        const fetchCta = async () => {
            try {
                const res = await fetch("/api/settings/projects-cta");
                const data = await res.json();
                setCtaSettings(data);
            } catch (err) {
                console.error("Failed to fetch CTA settings:", err);
            }
        };

        fetchProjects();
        fetchCategories();
        fetchCta();
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

                <p className="mb-10 max-w-3xl text-sm md:text-base leading-relaxed text-neutral-700">
                    Explore RMTY projects shaped by context, function, and
                    material clarity. Each work reflects our design process—from
                    concept strategy to precise architectural execution.
                </p>

                {/* --- SECTION 2: HEADER + FILTER --- */}
                <div className="relative mb-12 flex flex-wrap items-center gap-4">
                    <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">
                        Projects
                    </h2>

                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="text-xs md:text-sm font-medium uppercase tracking-wide flex items-center cursor-pointer gap-1 mt-2 hover:opacity-70 transition-opacity"
                        >
                            {selectedCategories.length > 0
                                ? "Filter Selected"
                                : "Filter"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className={`w-4 h-4 transition-transform ${
                                    isFilterOpen ? "rotate-180" : ""
                                }`}
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-72 bg-[#d9d9d9] p-6 shadow-xl z-30"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => {
                                                clearFilters();
                                                setIsFilterOpen(false);
                                            }}
                                            className="flex items-center justify-between cursor-pointer group select-none h-8 text-left px-1"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-[1px] bg-black transition-all duration-300 ease-out ${
                                                        selectedCategories.length === 0
                                                            ? "w-6 opacity-100"
                                                            : "w-0 opacity-0 group-hover:w-2 group-hover:opacity-50"
                                                    }`}
                                                />
                                                <span
                                                    className={`text-xs uppercase tracking-wide transition-all duration-300 ${
                                                        selectedCategories.length === 0
                                                            ? "text-black font-semibold"
                                                            : "text-black/60 group-hover:text-black"
                                                    }`}
                                                >
                                                    All Projects
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-black/40 tabular-nums">
                                                {projects.length}
                                            </span>
                                        </button>

                                        <div className="my-2 h-px bg-black/10" />

                                        {categories.map((cat) => {
                                            const isSelected =
                                                selectedCategories.includes(
                                                    cat.name,
                                                );
                                            const count = countForCategory(
                                                cat.name,
                                            );

                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() =>
                                                        handleToggleCategory(
                                                            cat.name,
                                                        )
                                                    }
                                                    className="flex items-center justify-between cursor-pointer group select-none h-8 text-left px-1"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`h-[1px] bg-black transition-all duration-300 ease-out ${
                                                                isSelected
                                                                    ? "w-6 opacity-100"
                                                                    : "w-0 opacity-0 group-hover:w-2 group-hover:opacity-50"
                                                            }`}
                                                        />
                                                        <span
                                                            className={`text-xs uppercase tracking-wide transition-all duration-300 ${
                                                                isSelected
                                                                    ? "text-black font-semibold translate-x-0"
                                                                    : "text-black/60 group-hover:text-black -translate-x-2 group-hover:translate-x-0"
                                                            }`}
                                                        >
                                                            {cat.name}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`text-[10px] font-bold tabular-nums transition-colors ${
                                                            isSelected
                                                                ? "text-black"
                                                                : "text-black/40"
                                                        }`}
                                                    >
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}

                                        {categories.length === 0 && (
                                            <p className="text-xs text-black/40 px-1">
                                                No categories found.
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Active filter chips */}
                    <AnimatePresence>
                        {selectedCategories.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 flex flex-wrap gap-2"
                            >
                                {selectedCategories.map((category) => (
                                    <motion.button
                                        key={category}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() =>
                                            handleToggleCategory(category)
                                        }
                                        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide bg-black text-white px-3 py-1.5 hover:bg-black/80 transition-colors"
                                    >
                                        {category}
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                                    className={`group ${
                                        project.colSpan || "col-span-1"
                                    }`}
                                >
                                    <ProjectCard
                                        title={project.title}
                                        category={project.category?.name}
                                        slug={project.slug || project.id}
                                        image={project.image}
                                        aspectRatio={
                                            project.aspect || "aspect-[4/3]"
                                        }
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="col-span-full py-24 flex flex-col items-center justify-center text-center gap-4"
                            >
                                <p className="text-2xl font-bold uppercase tracking-tight text-black/30">
                                    No projects yet
                                </p>
                                {selectedCategories.length > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm font-medium underline underline-offset-4 text-black/50 hover:text-black transition-colors"
                                    >
                                        Clear filter
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- SECTION 4: "LET'S TALK" --- */}
            <section className="w-full border-t border-black/5 bg-[#f0f0f0]">
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[600px] lg:min-h-[700px]">
                    <div className="lg:col-span-5 flex flex-col items-start justify-center py-32 px-6 lg:pl-[max(1.5rem,calc((100vw-1536px)/2+1.5rem))] lg:pr-12">
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-none">
                            Let's Talk.
                        </h2>
                        <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-md mb-12">
                            {ctaSettings.text ||
                                "Non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita."}
                        </p>
                        <Link
                            to="/contact"
                            className="inline-block bg-black text-white px-10 py-5 text-sm font-bold uppercase tracking-widest"
                        >
                            Book Consultation
                        </Link>
                    </div>

                    <div className="lg:col-span-7 relative w-full h-full min-h-[500px] bg-black overflow-hidden">
                        {ctaSettings.image ? (
                            <img
                                src={ctaSettings.image}
                                alt="Let's Talk"
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative group">
                                    <div className="h-24 w-24 border-2 border-white/20 rounded-full flex items-center justify-center">
                                        <span className="text-white/50 text-sm">
                                            Image
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}