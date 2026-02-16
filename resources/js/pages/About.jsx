import React, { useState, useEffect } from "react";

function imageUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `/storage/${path}`;
}

function ImagePlaceholder({ className = "", label = "Image" }) {
  return (
    <div
      className={`grid place-items-center bg-neutral-200 text-neutral-500 ${className}`}
    >
      <div className="text-xs font-medium tracking-[0.2em] uppercase">
        {label}
      </div>
    </div>
  );
}

export default function About() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/about")
      .then((res) => res.json())
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]))
      .finally(() => setLoading(false));
  }, []);

  const hero = sections[0];
  const restSections = sections.slice(1);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="pt-28 md:pt-32">
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8">
          {loading ? (
            <div className="py-20 text-center text-neutral-500">Loading...</div>
          ) : sections.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">No content yet.</div>
          ) : (
            <>
              {/* First section as hero */}
              <section className="pb-10">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {hero?.title || "ABOUT US"}
                </h1>

                <div className="mt-8 overflow-hidden rounded-sm">
                  {hero?.image ? (
                    <img
                      src={imageUrl(hero.image)}
                      alt={hero.title}
                      className="h-[240px] w-full object-cover md:h-[320px]"
                    />
                  ) : (
                    <ImagePlaceholder
                      label="HERO IMAGE"
                      className="h-[240px] w-full md:h-[320px]"
                    />
                  )}
                </div>

                {hero?.content && (
                  <div className="mt-6 flex items-start justify-between gap-8">
                    <p className="max-w-lg text-xs leading-relaxed text-neutral-700 md:text-sm">
                      {hero.content}
                    </p>
                  </div>
                )}
              </section>

              {/* Remaining sections */}
              {restSections.map((section, idx) => (
                <section
                  key={section.id}
                  className={`py-14 ${idx % 2 === 1 ? "bg-neutral-50" : ""}`}
                >
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {section.title}
                  </h2>

                  <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
                    <div className={section.image ? "md:col-span-7" : "md:col-span-12"}>
                      <p className="text-xs leading-relaxed text-neutral-700 md:text-sm whitespace-pre-line">
                        {section.content || ""}
                      </p>
                    </div>
                    {section.image && (
                      <div className="md:col-span-5">
                        <div className="overflow-hidden rounded-sm">
                          <img
                            src={imageUrl(section.image)}
                            alt={section.title}
                            className="h-[180px] w-full object-cover md:h-[210px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
