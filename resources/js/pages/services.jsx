import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getServicesContent } from "../stores/servicesContent";

export default function Services() {
    const [openIndex, setOpenIndex] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const content = useMemo(() => getServicesContent(), []);
    const hero = content.hero ?? {};
    const section = content.section ?? {};
    const cta = content.cta ?? {};

    useEffect(() => {
        fetch("/api/services")
            .then((res) => res.json())
            .then((data) => setServices(Array.isArray(data) ? data : []))
            .catch(() => setServices([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="w-full bg-white [font-family:var(--font-neue)]">
            {/* ================= TOP HERO ================= */}
            <div className="w-full bg-[#f7f7f8]">
                {/* Perfectly aligned container matching the navbar */}
                <div className="mx-auto max-w-screen-2xl px-6 pt-36 pb-20 md:pt-44 md:pb-24 min-h-[400px] md:min-h-[400px]">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
                        {/* Left title */}
                        <div className="space-y-1">
                            <h1 className="text-4xl font-bold tracking-tight text-black md:text-6xl">
                                {hero.titleLine1 || "DESIGNING WITH"}
                            </h1>
                            <h2 className="text-4xl font-bold tracking-tight text-black md:text-6xl">
                                {hero.titleLine2 || "INTENTIONS"}
                            </h2>
                        </div>

                        {/* Right paragraph */}
                        <p className="max-w-md text-sm leading-relaxed text-gray-500 md:justify-self-end mt-2 md:mt-4">
                            {hero.paragraph ||
                                "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga."}
                        </p>
                    </div>
                </div>
            </div>

            {/* ================= SERVICES SECTION ================= */}
            <div className="w-full bg-white border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-start">
                        {/* Left image */}
                        <div className="relative overflow-hidden rounded-none bg-gray-100">
                            <img
                                src={section.image || "/images/SAMPLE PIC.png"}
                                alt="Project"
                                className="h-[380px] w-full object-cover md:h-[500px]"
                            />
                            <div className="absolute inset-0 bg-white/20" />
                            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase font-bold text-black bg-white/60 backdrop-blur-sm py-2 mx-4 border border-white/40">
                                <span className="opacity-80">📍</span>
                                <span>
                                    {section.locationTag || "Tagaytay City"}
                                </span>
                            </div>
                        </div>

                        {/* Right Content & Accordion */}
                        <div>
                            <h3 className="text-3xl font-normal tracking-tight text-black md:text-4xl whitespace-pre-line">
                                {section.heading || "RMTY Design\nArchitects"}
                            </h3>

                            <p className="mt-6 max-w-md text-sm leading-relaxed text-gray-500">
                                {section.paragraph ||
                                    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque"}
                            </p>

                            {/* Accordion List */}
                            <div className="mt-12 border-t border-gray-200">
                                {loading ? (
                                    <p className="text-[10px] tracking-widest uppercase text-gray-400 py-6">
                                        Loading services…
                                    </p>
                                ) : services.length === 0 ? (
                                    <p className="text-[10px] tracking-widest uppercase text-gray-400 py-6">
                                        No services available.
                                    </p>
                                ) : (
                                    services.map((item, idx) => {
                                        const isOpen = openIndex === idx;
                                        return (
                                            <div
                                                key={item.id ?? idx}
                                                className="border-b border-gray-200"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenIndex(
                                                            isOpen ? null : idx,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between py-5 text-left outline-none group"
                                                >
                                                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-black transition-colors group-hover:text-gray-500">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xl font-light text-black transition-colors group-hover:text-gray-500">
                                                        {isOpen ? "–" : "+"}
                                                    </span>
                                                </button>

                                                <AnimatePresence
                                                    initial={false}
                                                >
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                height: "auto",
                                                                opacity: 1,
                                                            }}
                                                            exit={{
                                                                height: 0,
                                                                opacity: 0,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: "easeInOut",
                                                            }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pb-6 pr-8">
                                                                <p className="text-[13px] leading-relaxed text-gray-500">
                                                                    {
                                                                        item.content
                                                                    }
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= SEE OTHER PROJECTS CTA ================= */}
            <div className="w-full bg-white border-t border-gray-200/50">
                <div className="mx-auto max-w-screen-2xl px-6 py-16 md:py-24">
                    <div className="relative overflow-hidden rounded-none bg-black">
                        <img
                            src={cta.image || "/images/SOP.png"}
                            alt="Other projects"
                            className="h-[300px] w-full object-cover md:h-[400px] opacity-70"
                        />
                        <div className="absolute inset-0 bg-black/20" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <Link
                                to="/projects"
                                className="border border-white px-10 py-4 text-[10px] font-bold tracking-[0.25em] uppercase text-white transition-colors duration-300 hover:bg-white hover:text-black"
                            >
                                {cta.linkText || "SEE OTHER PROJECTS"}
                            </Link>
                        </div>

                        <div className="absolute right-6 top-6 text-[10px] font-bold tracking-[0.15em] uppercase text-white/80">
                            {cta.tag || "Architecture"}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
