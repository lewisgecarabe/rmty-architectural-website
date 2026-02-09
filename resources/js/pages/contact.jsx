import { useMemo, useState } from "react";

export default function Contact() {
  const [inquiryType, setInquiryType] = useState("general");
  const isConsultation = inquiryType === "consultation";

  const buttonText = useMemo(() => {
    return isConsultation ? "BOOK A CONSULTATION" : "SUBMIT";
  }, [isConsultation]);

  return (
    <section className="w-full bg-transparent">
      {/* TOP (unchanged content, updated container + more top spacing) */}
      <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 pb-12 pt-32 md:px-8 md:pb-16 md:pt-40">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
          {/* Left */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-black md:text-5xl">
              Connect
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-600">
              At vero eos et accusamus et iusto odio dignissimos
            </p>

            <div className="mt-10 space-y-6 text-sm text-neutral-700">
              <div>
                <p className="font-medium text-neutral-800">Metro Manila</p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  911 Josefina II, Sampaloc, Manila, 1008 <br />
                  Metro Manila
                </p>
              </div>

              <div className="space-y-3 text-sm text-neutral-600">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.4V7a1 1 0 1 0-2 0v6a1 1 0 0 0 .55.9l4 2a1 1 0 1 0 .9-1.8L13 12.4Z" />
                  </svg>
                  <span>9AM–6PM (Mon–Fri)</span>
                </div>

                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.59a1 1 0 0 1-.25 1.01l-2.2 2.19Z" />
                  </svg>
                  <span>0932 454 9434</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-neutral-500">Email</p>
                <div className="mt-3 max-w-xs border-b border-neutral-400 pb-2">
                  <span className="text-sm text-neutral-700">
                    rmty.architects@gmail.com
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right hero */}
          <div className="relative overflow-hidden rounded-sm bg-neutral-200">
            <img
              src="/images/PLACEHOLDER.png"
              alt="Interior design"
              className="h-[300px] w-full object-cover md:h-[340px]"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-3xl font-medium tracking-tight text-white md:text-4xl">
                EVERY DESIGN
              </p>
              <p className="text-xl font-medium tracking-tight text-white md:text-2xl">
                WITH PURPOSE
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FORM (full-width background, updated container width too) */}
      <section className="w-full bg-[#EDEDED]">
        <div className="mx-auto max-w-7xl xl:max-w-[88rem] px-5 py-24 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-extrabold leading-none text-black md:text-5xl">
                Contact
                <br />
                Form
              </h2>
            </div>

            <div>
              <form className="mx-auto w-full max-w-2xl">
                {/* Inquiry Type */}
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-800">
                    Inquiry Type
                  </p>

                  <div className="mt-5 inline-flex rounded-full border border-neutral-300 p-1">
                    <button
                      type="button"
                      onClick={() => setInquiryType("general")}
                      className={[
                        "rounded-full px-7 py-2.5 text-sm font-medium transition",
                        inquiryType === "general"
                          ? "bg-black text-white"
                          : "text-neutral-700 hover:text-black",
                      ].join(" ")}
                    >
                      General Inquiry
                    </button>

                    <button
                      type="button"
                      onClick={() => setInquiryType("consultation")}
                      className={[
                        "rounded-full px-7 py-2.5 text-sm font-medium transition",
                        inquiryType === "consultation"
                          ? "bg-black text-white"
                          : "text-neutral-700 hover:text-black",
                      ].join(" ")}
                    >
                      Book Consultation
                    </button>
                  </div>
                </div>

                {/* Fields */}
                <div className="mt-14 space-y-10">
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                    <UnderlineInput label="First Name" />
                    <UnderlineInput label="Last Name" />
                  </div>

                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                    <UnderlineInput label="Email" />
                    <UnderlineInput label="Phone" />
                  </div>

                  {isConsultation && (
                    <>
                      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                        <UnderlineInput label="Location" />
                        <UnderlineInput label="Project Type" />
                      </div>

                      <UnderlineInput label="Project Details" />

                      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                        <UnderlineInput label="Date" />
                        <FileDrop label="Additional Informations (PDF, Drawings, Project Brief)" />
                      </div>
                    </>
                  )}

                  <div>
                    <p className="mb-3 text-xs text-neutral-500">
                      Send us a message
                    </p>
                    <textarea
                      rows={4}
                      className="w-full bg-transparent text-sm text-neutral-800 outline-none"
                    />
                    <div className="mt-3 border-b border-neutral-400" />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="mx-auto block rounded-full bg-black px-12 py-3 text-sm font-medium tracking-wide text-white hover:bg-neutral-900"
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

/* ---------- Small components ---------- */

function UnderlineInput({ label }) {
  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">{label}</p>
      <input className="w-full bg-transparent text-sm text-neutral-800 outline-none" />
      <div className="mt-3 border-b border-neutral-400" />
    </div>
  );
}

function FileDrop({ label }) {
  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">{label}</p>
      <label className="relative flex h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-neutral-400 bg-transparent text-center">
        <input type="file" className="hidden" multiple />
        <p className="text-xs text-neutral-500">Drop files here or</p>
        <p className="mt-2 text-sm font-medium text-neutral-700">Select Files</p>
      </label>
    </div>
  );
}
