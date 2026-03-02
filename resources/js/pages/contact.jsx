import { useMemo, useState } from "react";

export default function Contact() {
  const [inquiryType, setInquiryType] = useState("general");
  const isConsultation = inquiryType === "consultation";

  const buttonText = useMemo(() => {
    return isConsultation ? "BOOK A CONSULTATION" : "SUBMIT";
  }, [isConsultation]);

  return (
    <section className="w-full bg-[#EDEDED]">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-extrabold leading-none text-black md:text-5xl">
              Contact <br /> Form
            </h2>
          </div>

          <div>
            <form key={inquiryType} className="mx-auto w-full max-w-2xl">
              {/* Inquiry Toggle */}
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-800">
                  Inquiry Type
                </p>

                <div className="mt-5 inline-flex rounded-full border border-neutral-300 p-1">
                  <button
                    type="button"
                    onClick={() => setInquiryType("general")}
                    className={`rounded-full px-7 py-2.5 text-sm font-medium ${
                      inquiryType === "general"
                        ? "bg-black text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    General Inquiry
                  </button>

                  <button
                    type="button"
                    onClick={() => setInquiryType("consultation")}
                    className={`rounded-full px-7 py-2.5 text-sm font-medium ${
                      inquiryType === "consultation"
                        ? "bg-black text-white"
                        : "text-neutral-700"
                    }`}
                  >
                    Book Consultation
                  </button>
                </div>
              </div>

              <div className="mt-14 space-y-10">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                  <UnderlineInput
                    label="First Name"
                    placeholder="Enter your first name"
                  />
                  <UnderlineInput
                    label="Last Name"
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                  <UnderlineInput
                    label="Email"
                    type="email"
                    placeholder="Enter your email address"
                  />
                  <UnderlineInput
                    label="Phone"
                    type="tel"
                    isPhone
                    placeholder="Enter your 11-digit phone number"
                  />
                </div>

                {!isConsultation && <GeneralMessageField />}

                {isConsultation && (
                  <>
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="Location"
                        placeholder="Enter project location"
                      />

                      <UnderlineInput
                        label="Project Type"
                        options={[
                          "Residential",
                          "Commercial",
                          "Master Planning",
                          "Interior Architecture",
                        ]}
                      />
                    </div>

                    <ConsultationMessageField />

                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="Consultation Date"
                        type="date"
                      />
                      <FileDrop label="Additional Informations (PDF, Drawings, Project Brief)" />
                    </div>
                  </>
                )}

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
  );
}

/* ---------------- INPUT COMPONENT ---------------- */

function UnderlineInput({
  label,
  type = "text",
  options,
  isPhone,
  placeholder,
}) {
  const [error, setError] = useState("");
  const [value, setValue] = useState("");

  const isNameField =
    label === "First Name" || label === "Last Name";

  const handleChange = (e) => {
    let inputValue = e.target.value;

    /* STRICT NAME VALIDATION */
    if (isNameField) {
      inputValue = inputValue.replace(/[^A-Za-z\s]/g, "");
      inputValue = inputValue.replace(/\s{2,}/g, " ");

      if (!inputValue.trim()) {
        setError(`${label} is required.`);
      } else if (inputValue.trim().length < 2) {
        setError(`${label} must be at least 2 characters.`);
      } else {
        setError("");
      }
    }

    /* PHONE VALIDATION */
    else if (isPhone) {
      inputValue = inputValue.replace(/\D/g, "").slice(0, 11);

      if (inputValue.length !== 11) {
        setError("Phone number must be 11 digits.");
      } else {
        setError("");
      }
    }

    /* EMAIL VALIDATION */
    else if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(inputValue)) {
        setError("Please enter a valid email address.");
      } else {
        setError("");
      }
    }

    /* DEFAULT REQUIRED */
    else {
      if (!inputValue.trim()) {
        setError(`${label} is required.`);
      } else {
        setError("");
      }
    }

    setValue(inputValue);
  };

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">{label}</p>

      {options ? (
        <select
          required
          onChange={(e) =>
            setError(!e.target.value ? "Please select a project type." : "")
          }
          className="w-full bg-transparent text-sm text-neutral-800 outline-none"
        >
          <option value="">Select Project Type</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
        />
      )}

      <div className="mt-3 border-b border-neutral-400" />

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------------- GENERAL MESSAGE ---------------- */

function GeneralMessageField() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    let inputValue = e.target.value;
    const words = inputValue.trim().split(/\s+/);

    if (words.length > 100) {
      inputValue = words.slice(0, 100).join(" ");
    }

    if (!inputValue.trim()) {
      setError("Message is required.");
    } else {
      setError("");
    }

    setValue(inputValue);
  };

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">Message</p>
      <textarea
        rows={4}
        value={value}
        onChange={handleChange}
        placeholder="Enter your message (max 100 words)"
        className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
      />
      <div className="mt-3 border-b border-neutral-400" />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ---------------- CONSULTATION MESSAGE ---------------- */

function ConsultationMessageField() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    let inputValue = e.target.value;
    const words = inputValue.trim().split(/\s+/);

    if (words.length > 100) {
      inputValue = words.slice(0, 100).join(" ");
    }

    if (!inputValue.trim()) {
      setError("Project details are required.");
    } else {
      setError("");
    }

    setValue(inputValue);
  };

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">Project Details</p>
      <textarea
        rows={4}
        value={value}
        onChange={handleChange}
        placeholder="Describe your project (max 100 words)"
        className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
      />
      <div className="mt-3 border-b border-neutral-400" />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ---------------- FILE DROP ---------------- */

function FileDrop({ label }) {
  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">{label}</p>
      <label className="relative flex h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-neutral-400 bg-transparent text-center">
        <input type="file" className="hidden" multiple />
        <p className="text-xs text-neutral-500">Drop files here or</p>
        <p className="mt-2 text-sm font-medium text-neutral-700">
          Select Files
        </p>
      </label>
    </div>
  );
}