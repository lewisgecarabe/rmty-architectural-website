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

  // Map CMS sections by sort_order to match admin slots: 0=hero, 1=purpose left, 2=purpose center, 3=purpose image, 4=mission, 5=vision, 6=artist
  const bySort = (i) => sections.find((s) => Number(s.sort_order) === i) ?? null;
  const hero = bySort(0);
  const purposeLeft = bySort(1);
  const purposeCenter = bySort(2);
  const purposeImage = bySort(3);
  const mission = bySort(4);
  const vision = bySort(5);
  const artist = bySort(6);

  const defaultHeroText =
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias";
  const defaultPurposeShort =
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui";
  const defaultPurposeLong =
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui At vero eos et accusamus et iusto odio dignissimos ducimus qui At vero eos et accusamus et iusto odio dignissimos ducimus qui";
  const defaultBlockText =
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias";
  const defaultArtistParagraph =
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias";

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-neutral-900">
        <div className="pt-28 md:pt-32 flex items-center justify-center min-h-[50vh]">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="pt-28 md:pt-32">
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 md:px-8">
          {/* HERO */}
          <section className="pb-10">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {hero?.title || "ABOUT US"}
            </h1>

            <div className="mt-8 overflow-hidden rounded-sm">
              {hero?.image ? (
                <img
                  src={imageUrl(hero.image)}
                  alt={hero?.title || "Hero"}
                  className="h-[240px] w-full object-cover md:h-[320px]"
                />
              ) : (
                <ImagePlaceholder
                  label="HERO IMAGE"
                  className="h-[240px] w-full md:h-[320px]"
                />
              )}
            </div>

            <div className="mt-6 flex items-start justify-between gap-8">
              <p className="max-w-lg text-xs leading-relaxed text-neutral-700 md:text-sm">
                {hero?.content || defaultHeroText}
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
                  {purposeLeft?.content || defaultPurposeShort}
                </p>
              </div>

              <div className="md:col-span-4">
                <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                  {purposeCenter?.content || defaultPurposeLong}
                </p>
              </div>

              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-sm">
                  {purposeImage?.image ? (
                    <img
                      src={imageUrl(purposeImage.image)}
                      alt={purposeImage.title || "Purpose"}
                      className="h-[180px] w-full object-cover md:h-[210px]"
                    />
                  ) : (
                    <ImagePlaceholder
                      label="PURPOSE IMAGE"
                      className="h-[180px] w-full md:h-[210px]"
                    />
                  )}
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
                  {mission?.image ? (
                    <img
                      src={imageUrl(mission.image)}
                      alt="Mission"
                      className="h-[170px] w-full object-cover md:h-[190px]"
                    />
                  ) : (
                    <ImagePlaceholder
                      label="MISSION IMAGE"
                      className="h-[170px] w-full md:h-[190px]"
                    />
                  )}
                </div>

                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                  {mission?.content || defaultBlockText}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                  VISION
                </h3>

                <div className="mt-6 overflow-hidden rounded-sm">
                  {vision?.image ? (
                    <img
                      src={imageUrl(vision.image)}
                      alt="Vision"
                      className="h-[170px] w-full object-cover md:h-[190px]"
                    />
                  ) : (
                    <ImagePlaceholder
                      label="VISION IMAGE"
                      className="h-[170px] w-full md:h-[190px]"
                    />
                  )}
                </div>

                <p className="mt-6 text-xs leading-relaxed text-neutral-700 md:text-sm">
                  {vision?.content || defaultBlockText}
                </p>
              </div>
            </div>
          </section>

          {/* ABOUT THE ARTIST */}
          <section className="py-16">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 items-start">
              <div className="md:col-span-5">
                {artist?.image ? (
                  <img
                    src={imageUrl(artist.image)}
                    alt={artist.title || "Artist"}
                    className="h-[320px] w-full object-cover md:h-[360px] overflow-hidden rounded-sm"
                  />
                ) : (
                  <ImagePlaceholder
                    label="ARTIST IMAGE"
                    className="h-[320px] w-full md:h-[360px]"
                  />
                )}
              </div>

              <div className="md:col-span-7">
                <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {artist?.title || "ABOUT THE ARTIST."}
                </h3>

                <div className="mt-8 space-y-6">
                  <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                    {artist?.content
                      ? artist.content.split("\n\n")[0] || defaultArtistParagraph
                      : defaultArtistParagraph}
                  </p>

                  <p className="text-xs leading-relaxed text-neutral-700 md:text-sm">
                    {artist?.content
                      ? artist.content.split("\n\n")[1] || defaultArtistParagraph
                      : defaultArtistParagraph}
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
