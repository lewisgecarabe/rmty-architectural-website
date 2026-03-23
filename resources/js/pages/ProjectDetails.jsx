import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";

const ProjectPlaceholder = ({ className = "" }) => (
  <div className={`relative w-full h-full bg-[#d9d9d9] group overflow-hidden ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg className="h-10 w-10 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
);

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject]             = useState(null);
  const [prevProject, setPrevProject]     = useState(null);
  const [nextProject, setNextProject]     = useState(null);
  const [moreProjects, setMoreProjects]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const pageBg  = "#f5f5f5";
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

        const index = list.findIndex(p => p.slug === id || p.id?.toString() === id);

        setProject({
          id:             data.slug || data.id,
          title:          data.title,
          location:       data.location,
          description:    data.description,
          image:          data.image,
          gallery_images: data.gallery_images ?? [],
        });

        setCarouselIndex(0);

        if (index !== -1) {
          const prev = index === 0 ? list[list.length - 1] : list[index - 1];
          const next = index === list.length - 1 ? list[0] : list[index + 1];

          setPrevProject({ id: prev.slug || prev.id, image: prev.image });
          setNextProject({ id: next.slug || next.id, image: next.image });

          const others = list.filter(p => (p.slug || p.id?.toString()) !== id).slice(0, 3);
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

  const slides = project.gallery_images?.length > 0
    ? project.gallery_images
    : project.image ? [`/storage/${project.image}`] : [];

  const prevSlide = () => setCarouselIndex(i => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setCarouselIndex(i => (i + 1) % slides.length);

  const getSlidePos = (slideIdx) => {
    const total = slides.length;
    let pos = slideIdx - carouselIndex;
    if (pos < -Math.floor(total / 2)) pos += total;
    if (pos > Math.floor(total / 2))  pos -= total;
    return pos;
  };

  return (
    <main className={`w-full ${bgColor} min-h-screen pt-32 pb-32 [font-family:var(--font-neue)] text-black overflow-x-hidden`}>

      <AnimatePresence mode="wait">
        <motion.div
          key={id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* --- TOP SECTION --- */}
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

          {/* --- CAROUSEL SECTION --- */}
          {slides.length > 0 && (
            <div className="w-full mb-32">

              {/* CAROUSEL TRACK */}
              <div
                className="relative overflow-hidden"
                style={{ height: "500px", background: pageBg }}
              >
                {/* FADE — LEFT */}
                <div
                  className="absolute left-0 top-0 h-full z-20 pointer-events-none"
                  style={{
                    width: "18%",
                    background: `linear-gradient(to right, ${pageBg} 0%, transparent 100%)`,
                  }}
                />
                {/* FADE — RIGHT */}
                <div
                  className="absolute right-0 top-0 h-full z-20 pointer-events-none"
                  style={{
                    width: "18%",
                    background: `linear-gradient(to left, ${pageBg} 0%, transparent 100%)`,
                  }}
                />

                {/* LEFT ARROW */}
                <button
                  onClick={prevSlide}
                  className="absolute left-8 top-1/2 -translate-y-1/2 z-30 border-2 border-black w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </button>

                {/* RIGHT ARROW */}
                <button
                  onClick={nextSlide}
                  className="absolute right-8 top-1/2 -translate-y-1/2 z-30 border-2 border-black w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-sm hover:bg-white transition-colors"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>

                {/* SLIDES */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {slides.map((src, slideIdx) => {
                    const pos      = getSlidePos(slideIdx);
                    const isCenter = pos === 0;
                    const isLeft   = pos === -1;
                    const isRight  = pos === 1;
                    const isHidden = Math.abs(pos) > 1;

                    const translateX = pos * 62;
                    const scale      = isCenter ? 1 : 0.72;
                    const opacity    = isCenter ? 1 : isLeft || isRight ? 0.45 : 0;
                    const zIndex     = isCenter ? 10 : isLeft || isRight ? 5 : 0;

                    return (
                      <motion.div
                        key={slideIdx}
                        onClick={isLeft ? prevSlide : isRight ? nextSlide : undefined}
                        animate={{ x: `${translateX}%`, scale, opacity, zIndex }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute"
                        style={{
                          width:         "52%",
                          height:        "85%",
                          cursor:        isLeft || isRight ? "pointer" : "default",
                          pointerEvents: isHidden ? "none" : "auto",
                        }}
                      >
                        <img
                          src={src}
                          alt={`Slide ${slideIdx + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </motion.div>
                    );
                  })}
                </div>

                {/* MOBILE ARROWS */}
                <div className="absolute inset-0 flex justify-between items-center px-4 md:hidden z-30 pointer-events-none">
                  <button
                    onClick={prevSlide}
                    className="pointer-events-auto border-2 border-black w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="pointer-events-auto border-2 border-black w-12 h-12 flex items-center justify-center bg-white/70 backdrop-blur-md"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* PICTURE COUNT + DOTS — outside overflow-hidden so they're always visible */}
              {slides.length > 1 && (
                <div className="flex flex-col items-center gap-2 mt-5">
                  <span className="text-xs font-semibold text-black/50 tracking-widest">
                    {carouselIndex + 1} / {slides.length}
                  </span>
                  <div className="flex gap-2 items-center">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className="transition-all duration-300"
                        style={{
                          width:        i === carouselIndex ? "24px" : "8px",
                          height:       "8px",
                          borderRadius: "4px",
                          background:   i === carouselIndex ? "black" : "rgba(0,0,0,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* --- MORE PROJECTS --- */}
          <div className="max-w-screen-2xl mx-auto px-6">
            <hr className="border-black mb-12 opacity-20" />
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-8">More Projects.</h2>
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