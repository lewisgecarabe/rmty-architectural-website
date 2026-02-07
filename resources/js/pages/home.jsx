import { Link } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";

export default function Home() {
  return (
    <>
      <section className="relative w-full h-screen bg-black overflow-hidden">
        
        {/* Background Layer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="relative z-10 w-full h-full max-w-screen-2xl mx-auto px-6 pb-12 flex flex-col justify-end">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="text-white [font-family:var(--font-neue)] mb-6">
                 <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold tracking-tighter uppercase leading-none">
                   RMTY Designs
                 </h1>
                 <h2 className="text-xl md:text-3xl lg:text-5xl font-normal tracking-tight leading-none mt-2">
                   Studio
                 </h2>
              </div>
            </div>
            <div className="hidden md:block"></div>
          </div>

          <div className="w-full flex items-end mt-2 md:justify-center">
             <div className="w-full md:w-1/2 border-b border-white"></div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-24 [font-family:var(--font-neue)] text-black">
        {/* Alignment Note: Matches Hero with 'max-w-screen-2xl mx-auto px-6' */}
        <div className="max-w-screen-2xl mx-auto px-6">
          
          <div className="mb-16 max-w-2xl">
            <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-6">
              Design With Purpose
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium 
              voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati 
              cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-12">
            <ProjectCard colSpan="md:col-span-6" aspectRatio="aspect-[4/3]" />
            <ProjectCard colSpan="md:col-span-6" aspectRatio="aspect-[4/3]" />
            <ProjectCard colSpan="md:col-span-8" aspectRatio="aspect-[16/9]" />
            <div className="hidden md:block md:col-span-4"></div>
            <ProjectCard colSpan="md:col-span-3" aspectRatio="aspect-square" />
            <ProjectCard colSpan="md:col-span-3" aspectRatio="aspect-square" />
            <ProjectCard colSpan="md:col-span-6" aspectRatio="aspect-[4/3]" />
            <ProjectCard colSpan="md:col-span-12" aspectRatio="aspect-[21/9]" />
          </div>

          <div className="mt-20 flex justify-center">
            <Link 
              to="/projects" 
              className="group inline-flex flex-col items-center cursor-none"
            >
              <span className="text-xl font-bold tracking-tight uppercase hover:opacity-70 transition-opacity">
                See All Works.
              </span>
              <span className="w-full h-[2px] bg-black mt-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
            </Link>
          </div>

        </div>
      </section>

      <section className="w-full bg-[#111] py-24 [font-family:var(--font-neue)] text-white">
        {/* Alignment Note: Matches Hero with 'max-w-screen-2xl mx-auto px-6' */}
        <div className="max-w-screen-2xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="flex flex-col items-start justify-center h-full">
            <h2 className="text-4xl md:text-6xl font-normal tracking-tight mb-12">
              Contact Us.
            </h2>
            <div className="space-y-8 w-full max-w-md">
              <div>
                <p className="text-gray-500 text-sm mb-1">Email</p>
                <a href="mailto:jestertrinidad@gmail.com" className="text-lg md:text-xl font-medium hover:text-gray-300 transition-colors">
                  jestertrinidad@gmail.com
                </a>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Phone</p>
                <p className="text-lg md:text-xl font-medium">0932 454 9434</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-1">Address</p>
                <p className="text-lg md:text-xl font-medium leading-relaxed">
                  Sampaloc, Metro Manila,<br />Philippines
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden">
               <div className="relative w-full h-full bg-black group cursor-none">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="h-20 w-20 group-hover:text-white transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 transform group-hover:translate-x-2 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}