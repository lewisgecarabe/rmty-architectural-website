import { useState } from "react";
import { Link } from "react-router-dom";

const SERVICES = [
  {
    title: "ARCHITECTURE",
    content:
      "We provide architectural design solutions that balance function, aesthetics, and buildability—from concept to construction-ready plans.",
  },
  {
    title: "INTERIORS/INTERIOR ARCHITECTURE",
    content:
      "Interior design and interior architecture services focused on spatial planning, finishes, lighting, and cohesive detailing.",
  },
  {
    title: "CONCEPTUAL PLANNING",
    content:
      "Early-stage planning to define project direction, massing, layout strategies, and key design decisions before development.",
  },
];

export default function Services() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="w-full bg-transparent">
      {/* TOP HERO */}
      <div className="w-full bg-[#dcdcdc]">
        <div className="mx-auto max-w-6xl px-6 pt-6 pb-20 md:pt-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
            {/* Left title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-medium tracking-tight text-black md:text-5xl">
                DESIGNING WITH
              </h1>
              <h2 className="text-3xl font-normal tracking-tight text-black md:text-5xl">
                Intensions
              </h2>
            </div>

            {/* Right paragraph */}
            <p className="max-w-md text-sm leading-relaxed text-neutral-700 md:justify-self-end">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui
              blanditiis praesentium voluptatum deleniti atque corrupti quos
              dolores et quas molestias excepturi sint occaecati cupiditate non
              provident, similique sunt in culpa qui officia deserunt mollitia
              animi, id est laborum et dolorum fuga.
            </p>
          </div>
        </div>
      </div>

      {/* SERVICES SECTION */}
      <div className="w-full bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            {/* Left image */}
            <div className="relative overflow-hidden rounded-sm bg-neutral-200">
              <img
                src="/images/SAMPLE PIC.png"
                alt="Project"
                className="h-[380px] w-full object-cover md:h-[460px]"
              />
              <div className="absolute inset-0 bg-white/35" />
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 text-xs text-neutral-600">
                <span className="opacity-80">📍</span>
                <span>Tagaytay City</span>
              </div>
            </div>

            {/* Right content */}
            <div>
              <h3 className="text-3xl font-medium tracking-tight text-black md:text-4xl">
                RMTY Design
                <br />
                Architects
              </h3>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-700">
                At vero eos et accusamus et iusto odio dignissimos ducimus qui
                blanditiis praesentium voluptatum deleniti atque
              </p>

              {/* Accordion */}
              <div className="mt-10">
                {SERVICES.map((item, idx) => {
                  const isOpen = openIndex === idx;

                  return (
                    <div key={item.title} className="border-b border-neutral-300">
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between py-4 text-left"
                      >
                        <span className="text-xs font-normal tracking-widest text-neutral-800">
                          {item.title}
                        </span>
                        <span className="text-xl font-light text-neutral-800">
                          {isOpen ? "–" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="pb-5 pr-8">
                          <p className="text-sm leading-relaxed text-neutral-700">
                            {item.content}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEE OTHER PROJECTS CTA */}
      <div className="w-full bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className="relative overflow-hidden rounded-sm bg-neutral-200">
            <img
              src="/images/SOP.png"
              alt="Other projects"
              className="h-[260px] w-full object-cover md:h-[320px]"
            />
            <div className="absolute inset-0 bg-black/15" />

            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                to="/projects"
                className="border border-white/80 px-10 py-3 text-sm font-medium tracking-widest text-white hover:bg-white/10"
              >
                SEE OTHER PROJECTS
              </Link>
            </div>

            <div className="absolute right-4 top-3 text-[10px] tracking-widest text-white/80">
              Architecture
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
