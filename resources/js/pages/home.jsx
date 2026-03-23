import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";

// Array of images for the hero carousel
const heroImages = [
    "./images/home-hero.webp",
    "./images/home-hero-2.webp",
    "./images/home-hero-3.webp",
];

export default function Home() {
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 1. Fetch featured projects
    useEffect(() => {
        const fetchFeaturedProjects = async () => {
            try {
                const res = await fetch("/api/projects");
                const data = await res.json();
                setFeaturedProjects(data.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch featured projects:", error);
            }
        };

        fetchFeaturedProjects();
        window.scrollTo(0, 0);
    }, []);

    // 2. Hero Carousel Timer (Changes every 5 seconds)
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex(
                (prevIndex) => (prevIndex + 1) % heroImages.length,
            );
        }, 5000);

        // Cleanup the timer when the component unmounts
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            {/* --- HERO SECTION --- */}
            <section className="relative w-full h-screen bg-black overflow-hidden">
                {/* Animated Background Layer */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black">
                    <AnimatePresence mode="popLayout">
                        <motion.img
                            key={currentImageIndex} // Key tells Framer Motion when to trigger the animation
                            src={heroImages[currentImageIndex]}
                            alt={`RMTY Hero ${currentImageIndex + 1}`}
                            // Initial state: Invisible and slightly zoomed in
                            initial={{ opacity: 0, scale: 1.05 }}
                            // Animate state: Fully visible, normal scale
                            animate={{ opacity: 1, scale: 1 }}
                            // Exit state: Fades out
                            exit={{ opacity: 0 }}
                            // Transition timing: Slow, smooth 1.5 second crossfade
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    {/* Dark Overlay so the white text is always readable */}
                    <div className="absolute inset-0 bg-black/30 z-10" />
                </div>

                <div className="relative z-10 w-full h-full max-w-screen-2xl mx-auto px-6 pb-12 flex flex-col justify-end">
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="text-white [font-family:var(--font-neue)] mb-6 md:mb-12">
                                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tighter uppercase leading-none">
                                    RMTY Designs
                                </h1>
                                <h2 className="text-2xl md:text-3xl lg:text-5xl font-normal tracking-tight leading-none mt-2">
                                    Studio
                                </h2>
                            </div>
                        </div>
                        <div className="hidden md:block"></div>
                    </div>

                    <div className="w-full flex items-end mt-2 md:justify-center">
                        <div className="w-full md:w-1/2 md:h-10 border-b-2 border-white"></div>
                    </div>
                </div>
            </section>

            {/* --- FEATURED PROJECTS SECTION --- */}
            <section className="w-full bg-white py-24 [font-family:var(--font-neue)] text-black">
                <div className="max-w-screen-2xl mx-auto px-6">
                    <div className="mb-16 max-w-2xl">
                        <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-6">
                            Design With Purpose
                        </h3>
                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                            At vero eos et accusamus et iusto odio dignissimos
                            ducimus qui blanditiis praesentium voluptatum
                            deleniti atque corrupti quos dolores et quas
                            molestias excepturi sint occaecati cupiditate non
                            provident, similique sunt in culpa qui officia
                            deserunt mollitia animi.
                        </p>
                    </div>

                    {/* Dynamic Grid of Featured Projects */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {featuredProjects.map((project) => (
                            <div
                                key={project.id || project.slug}
                                className={project.colSpan || "col-span-1"}
                            >
                                <ProjectCard
                                    title={project.title}
                                    category={
                                        project.category?.name ||
                                        project.location
                                    }
                                    slug={project.slug || project.id}
                                    image={project.image}
                                    aspectRatio={
                                        project.aspect || "aspect-[4/3]"
                                    }
                                />
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 flex justify-center">
                        <Link
                            to="/projects"
                            className="group inline-flex flex-col items-center"
                        >
                            <span className="text-xl font-bold tracking-tight uppercase hover:opacity-70 transition-opacity">
                                See All Works.
                            </span>
                            <span className="w-full h-[2px] bg-black mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- CONTACT SECTION --- */}
            <section className="w-full bg-[#111] py-24 [font-family:var(--font-neue)] text-white">
                <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="flex flex-col items-start justify-center h-full">
                        <h2 className="text-4xl md:text-6xl font-normal tracking-tight mb-12">
                            Contact Us.
                        </h2>
                        <div className="space-y-8 w-full max-w-md">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">
                                    Email
                                </p>
                                <a
                                    href="mailto:rmty.architects@gmail.com"
                                    className="text-lg md:text-xl font-medium hover:text-gray-300 transition-colors"
                                >
                                    rmty.architects@gmail.com
                                </a>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">
                                    Phone
                                </p>
                                <p className="text-lg md:text-xl font-medium">
                                    0915 896 2275
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">
                                    Address
                                </p>
                                <p className="text-lg md:text-xl font-medium leading-relaxed">
                                    911 Josefina 2 Sampaloc, Manila,
                                    <br />
                                    Philippines
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden">
                            <div className="relative w-full h-full group">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <img
                                        src="./images/home-contact-us.webp"
                                        alt="Contact Image"
                                        className="w-full h-full object-cover grayscale"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Link
                                to="/contact"
                                className="group inline-flex items-center gap-3 text-2xl md:text-3xl font-normal hover:opacity-80 transition-opacity"
                            >
                                <span className="border-b border-transparent group-hover:border-white transition-all">
                                    Let’s Talk!
                                </span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8 transform group-hover:translate-x-2 transition-transform duration-300"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
