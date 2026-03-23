import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";

const ProjectPlaceholder = ({ className = "" }) => (
    <div
        className={`relative w-full h-full bg-[#d9d9d9] group overflow-hidden ${className}`}
    >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
                className="h-10 w-10 text-black/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
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
    const [moreProjects, setMoreProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const bgColor = "bg-[#f5f5f5]";

    useEffect(() => {
        window.scrollTo(0, 0);

        const loadProject = async () => {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) throw new Error("API failed");
                const data = await res.json();

                const listRes = await fetch("/api/projects");
                const list = await listRes.json();

                const index = list.findIndex(
                    (p) => p.slug === id || p.id?.toString() === id,
                );

                setProject({
                    id: data.slug || data.id,
                    title: data.title,
                    location: data.location,
                    description: data.description,
                    image: data.image,
                });

                if (index !== -1) {
                    const prev =
                        index === 0 ? list[list.length - 1] : list[index - 1];
                    const next =
                        index === list.length - 1 ? list[0] : list[index + 1];

                    setPrevProject({
                        id: prev.slug || prev.id,
                        image: prev.image,
                    });
                    setNextProject({
                        id: next.slug || next.id,
                        image: next.image,
                    });

                    const others = list
                        .filter((p) => (p.slug || p.id?.toString()) !== id)
                        .slice(0, 3);
                    setMoreProjects(others);
                }
            } catch (error) {
                console.error("Navigation error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProject();
    }, [id, navigate]);

    if (loading || !project) return null;

    return (
        <main
            className={`w-full ${bgColor} min-h-screen pt-32 pb-32 [font-family:var(--font-neue)] text-black overflow-x-hidden`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="max-w-screen-2xl mx-auto px-6">
                        <div className="w-full flex justify-end mb-8">
                            <Link
                                to="/projects"
                                className="text-sm font-semibold underline underline-offset-4 hover:opacity-60 transition-opacity"
                            >
                                Back to Projects
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
                            <div className="lg:col-span-4 flex flex-col pt-4 order-2 lg:order-1">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold uppercase tracking-tight leading-none mb-1">
                                    {project.title}
                                </h1>
                                <p className="text-sm md:text-base text-black font-medium mb-12">
                                    {project.location}
                                </p>
                                <div className="text-sm font-medium leading-relaxed text-black max-w-sm">
                                    {project.description}
                                </div>
                            </div>

                            <div className="lg:col-span-8 h-[50vh] lg:h-[600px] bg-[#d9d9d9] overflow-hidden order-1 lg:order-2">
                                <motion.img
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 1 }}
                                    src={`/storage/${project.image}`}
                                    alt={project.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full mb-32 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px] md:h-[400px] lg:h-[500px]">
                            <Link
                                to={`/projects/${prevProject?.id}`}
                                className="hidden md:block relative w-full h-full group bg-[#d9d9d9]"
                            >
                                {prevProject?.image && (
                                    <img
                                        src={`/storage/${prevProject.image}`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-[#f5f5f5] via-transparent to-transparent opacity-90 z-10" />
                                <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform group-hover:-translate-x-2">
                                    <div className="border-2 border-black w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </Link>

                            <div className="relative w-full h-full bg-[#d9d9d9] overflow-hidden">
                                <img
                                    src={`/storage/${project.image}`}
                                    className="w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 flex justify-between items-center px-4 md:hidden z-30 pointer-events-none">
                                    <Link
                                        to={`/projects/${prevProject?.id}`}
                                        className="pointer-events-auto border-2 border-black w-12 h-12 flex items-center justify-center bg-white/40 backdrop-blur-md"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                                            />
                                        </svg>
                                    </Link>
                                    <Link
                                        to={`/projects/${nextProject?.id}`}
                                        className="pointer-events-auto border-2 border-black w-12 h-12 flex items-center justify-center bg-white/40 backdrop-blur-md"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            <Link
                                to={`/projects/${nextProject?.id}`}
                                className="hidden md:block relative w-full h-full group bg-[#d9d9d9]"
                            >
                                {nextProject?.image && (
                                    <img
                                        src={`/storage/${nextProject.image}`}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-l from-[#f5f5f5] via-transparent to-transparent opacity-90 z-10" />
                                <div className="absolute inset-0 flex items-center justify-center z-20 transition-transform group-hover:translate-x-2">
                                    <div className="border-2 border-black w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="max-w-screen-2xl mx-auto px-6">
                        <hr className="border-black mb-12 opacity-20" />
                        <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">
                            More Projects.
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {moreProjects.map((p, idx) => (
                                <ProjectCard
                                    key={idx}
                                    title={p.title}
                                    category={p.location}
                                    slug={p.slug || p.id}
                                    image={p.image}
                                    colSpan="col-span-1"
                                    aspectRatio="aspect-square"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </main>
    );
}
