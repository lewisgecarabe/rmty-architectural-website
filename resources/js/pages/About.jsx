import React from "react";

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
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Offset for fixed header */}
      <div className="pt-28 md:pt-32">
        {/* GLOBAL CONTAINER – SMALL SIDE SPACING */}
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8">
          {/* HERO */}
          <section className="pb-10">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              ABOUT US
            </h1>

            <div className="mt-8 overflow-hidden rounded-sm">
              <ImagePlaceholder
                label="HERO IMAGE"
                className="h-[240px] w-full md:h-[320px]"
              />
            </div>

            <div className="mt-6 flex items-start justify-between gap-8">
              <p className="max-w-lg text-xs leading-relaxed text-neutral-700 md:text-sm">
                At vero eos et accusamus et iusto odio dignissimos ducimus qui
                blanditiis praesentium voluptatum deleniti atque corrupti quos
                dolores et quas molestias
              </p>
              <span className="shrink-0 text-xs text-neutral-700 md:text-sm">
                2024
              </span>
            </div>
          </section>

          {/* PURPOSE */}
          <section className="py-14">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Our Purpose
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12 md:items-start">
              <div className="md:col-span-3">
                <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                </p>
              </div>

              <div className="md:col-span-4">
                <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                </p>
              </div>

              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-sm">
                  <ImagePlaceholder
                    label="PURPOSE IMAGE"
                    className="h-[180px] w-full md:h-[210px]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* MISSION / VISION */}
          <section className="py-10 bg-neutral-50">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                  MISSION
                </h3>

                <div className="mt-6 overflow-hidden rounded-sm">
                  <ImagePlaceholder
                    label="MISSION IMAGE"
                    className="h-[170px] w-full md:h-[190px]"
                  />
                </div>

                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                  blanditiis praesentium voluptatum deleniti atque corrupti quos
                  dolores et quas molestias
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                  VISION
                </h3>

                <div className="mt-6 overflow-hidden rounded-sm">
                  <ImagePlaceholder
                    label="VISION IMAGE"
                    className="h-[170px] w-full md:h-[190px]"
                  />
                </div>

                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui
                  blanditiis praesentium voluptatum deleniti atque corrupti quos
                  dolores et quas molestias
                </p>
              </div>
            </div>
          </section>

          {/* ABOUT THE ARTIST */}
          <section className="py-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 items-start">
              <div className="md:col-span-5">
                <ImagePlaceholder
                  label="ARTIST IMAGE"
                  className="h-[320px] w-full md:h-[360px]"
                />
              </div>

              <div className="md:col-span-7">
                <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  ABOUT THE ARTIST.
                </h3>

                <div className="mt-8 space-y-6">
                  <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                    At vero eos et accusamus et iusto odio dignissimos ducimus
                    qui blanditiis praesentium voluptatum deleniti atque
                    corrupti quos dolores et quas molestias
                  </p>

                  <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                    At vero eos et accusamus et iusto odio dignissimos ducimus
                    qui blanditiis praesentium voluptatum deleniti atque
                    corrupti quos dolores et quas molestias
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
