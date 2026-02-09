import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getServicesContent } from "../stores/servicesContent";

export default function Services() {
  const [openIndex, setOpenIndex] = useState(null);
  const content = useMemo(() => getServicesContent(), []);

  const hero = content.hero ?? {};
  const section = content.section ?? {};
  const services = content.services ?? [];
  const cta = content.cta ?? {};

  return (
    <section className="w-full bg-transparent">
      {/* TOP HERO */}
      <div className="w-full bg-neutral-200">
        {/* ✅ Updated container width */}
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8 pt-36 pb-20 md:pt-44 md:pb-24 min-h-[400px] md:min-h-[400px]">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            {/* Left title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-black md:text-6xl">
                {hero.titleLine1 || "DESIGNING WITH"}
              </h1>
              <h2 className="text-3xl font-extrabold tracking-tight text-black md:text-6xl">
                {hero.titleLine2 || "INTENTIONS"}
              </h2>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-neutral-800 md:justify-self-end">
              {hero.paragraph ||
                "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga."}
            </p>
          </div>
        </div>
      </div>

      {/* SERVICES SECTION */}
      <div className="w-full bg-white">
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8 py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
            {/* Left image */}
            <div className="relative overflow-hidden rounded-sm bg-neutral-200">
              <img
                src={section.image || "/images/SAMPLE PIC.png"}
                alt="Project"
                className="h-[380px] w-full object-cover md:h-[460px]"
              />
              <div className="absolute inset-0 bg-white/35" />
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 text-xs text-neutral-600">
                <span className="opacity-80">📍</span>
                <span>{section.locationTag || "Tagaytay City"}</span>
              </div>
            </div>

            <div>
              <h3 className="text-3xl font-medium tracking-tight text-black md:text-4xl whitespace-pre-line">
                {section.heading || "RMTY Design\nArchitects"}
              </h3>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-700">
                {section.paragraph ||
                  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque"}
              </p>

              <div className="mt-10">
                {services.map((item, idx) => {
                  const isOpen = openIndex === idx;

                  return (
                    <div key={idx} className="border-b border-neutral-300">
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
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8 pb-16">
          <div className="relative overflow-hidden rounded-sm bg-neutral-200">
            <img
              src={cta.image || "/images/SOP.png"}
              alt="Other projects"
              className="h-[260px] w-full object-cover md:h-[320px]"
            />
            <div className="absolute inset-0 bg-black/15" />

            <div className="absolute inset-0 flex items-center justify-center">
              <Link
                to="/projects"
                className="border border-white/80 px-10 py-3 text-sm font-medium tracking-widest text-white hover:bg-white/10"
              >
                {cta.linkText || "SEE OTHER PROJECTS"}
              </Link>
            </div>

            <div className="absolute right-4 top-3 text-[10px] tracking-widest text-white/80">
              {cta.tag || "Architecture"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
