import { useMemo, useState } from "react";
import axios from "axios";

const API_BASE = "/api";
export default function Contact() {
  const [inquiryType, setInquiryType] = useState("general");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const isConsultation = inquiryType === "consultation";

  const buttonText = useMemo(() => {
    if (isSubmitting) return "Submitting...";
    return isConsultation ? "BOOK A CONSULTATION" : "SUBMIT";
  }, [isConsultation, isSubmitting]);

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE}/consultations`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowSuccess(true);
      setFormKey((k) => k + 1);
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0][0];
        alert(first);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-transparent">

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">
              Consultation Submitted!
            </h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Thank you for reaching out. We have received your consultation request and will get back to you within{" "}
              <span className="font-semibold text-black">1–2 business days</span>.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-6 rounded-full bg-black px-10 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ================= TOP HERO SECTION ================= */}
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
                  <span>9AM–6PM (Mon–Fri)</span>
                </div>
                <div className="flex items-center gap-3">
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

          {/* Right Hero Image */}
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

      {/* ================= CONTACT FORM SECTION ================= */}
      <div className="bg-[#EDEDED]">
        <div className="mx-auto max-w-7xl px-5 py-24 md:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">

            <div>
              <h2 className="text-4xl font-extrabold leading-none text-black md:text-5xl">
                Contact <br /> Form
              </h2>
            </div>

            <div>
              {/* Inquiry Toggle */}
              <div className="text-center mb-10">
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

              {/* General Inquiry — not connected, UI only */}
              {!isConsultation && (
                <form className="mx-auto w-full max-w-2xl">
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput label="First Name" placeholder="Enter your first name" />
                      <UnderlineInput label="Last Name" placeholder="Enter your last name" />
                    </div>
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput label="Email" type="email" placeholder="Enter your email address" />
                      <UnderlineInput label="Phone" type="tel" isPhone placeholder="Enter your 11-digit phone number" />
                    </div>
                    <GeneralMessageField />
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="mx-auto block rounded-full bg-black px-12 py-3 text-sm font-medium tracking-wide text-white hover:bg-neutral-900"
                      >
                        SUBMIT
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Book Consultation — connected to Laravel API */}
              {isConsultation && (
                <form
                  key={formKey}
                  onSubmit={handleConsultationSubmit}
                  className="mx-auto w-full max-w-2xl"
                >
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="First Name"
                        name="first_name"
                        placeholder="Enter your first name"
                        required
                      />
                      <UnderlineInput
                        label="Last Name"
                        name="last_name"
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        required
                      />
                      <UnderlineInput
                        label="Phone"
                        name="phone"
                        type="tel"
                        isPhone
                        placeholder="Enter your 11-digit phone number"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="Location"
                        name="location"
                        placeholder="Enter project location"
                        required
                      />
                      <UnderlineInput
                        label="Project Type"
                        name="project_type"
                        options={[
                          "Residential",
                          "Commercial",
                          "Master Planning",
                          "Interior Architecture",
                        ]}
                        required
                      />
                    </div>
                    <ConsultationMessageField name="project_details" />
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                      <UnderlineInput
                        label="Consultation Date"
                        name="consultation_date"
                        type="date"
                        required
                      />
                      <FileDrop
                        label="Additional Information (PDF, Drawings, Project Brief)"
                        name="files"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mx-auto block rounded-full bg-black px-12 py-3 text-sm font-medium tracking-wide text-white hover:bg-neutral-900 disabled:opacity-60"
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}

/* ---------------- INPUT COMPONENT ---------------- */

function UnderlineInput({
  label,
  name,
  type = "text",
  options,
  isPhone,
  placeholder,
  required,
}) {
  const [error, setError] = useState("");
  const [value, setValue] = useState("");

  const isNameField = label === "First Name" || label === "Last Name";

  const handleChange = (e) => {
    let inputValue = e.target.value;

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
    } else if (isPhone) {
      inputValue = inputValue.replace(/\D/g, "").slice(0, 11);
      if (inputValue.length !== 11) {
        setError("Phone number must be 11 digits.");
      } else {
        setError("");
      }
    } else if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) {
        setError("Please enter a valid email address.");
      } else {
        setError("");
      }
    } else {
      if (required && !inputValue.trim()) {
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
          name={name}
          required={required}
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
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
        />
      )}
      <div className="mt-3 border-b border-neutral-400" />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
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
    if (words.length > 100) inputValue = words.slice(0, 100).join(" ");
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

function ConsultationMessageField({ name }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    let inputValue = e.target.value;
    const words = inputValue.trim().split(/\s+/);
    if (words.length > 100) inputValue = words.slice(0, 100).join(" ");
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
        name={name}
        value={value}
        onChange={handleChange}
        placeholder="Describe your project (max 100 words)"
        required
        className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
      />
      <div className="mt-3 border-b border-neutral-400" />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ---------------- FILE DROP ---------------- */

function FileDrop({ label, name }) {
  const [fileNames, setFileNames] = useState([]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    setFileNames(files.map((f) => f.name));
  };

  return (
    <div>
      <p className="mb-3 text-xs text-neutral-500">{label}</p>
      <label className="relative flex h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-neutral-400 bg-transparent text-center">
        <input
          type="file"
          name={`${name}[]`}
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
        />
        {fileNames.length === 0 ? (
          <>
            <p className="text-xs text-neutral-500">Drop files here or</p>
            <p className="mt-2 text-sm font-medium text-neutral-700">Select Files</p>
          </>
        ) : (
          <div className="px-3 space-y-1">
            {fileNames.map((n, i) => (
              <p key={i} className="text-xs text-neutral-700 truncate">{n}</p>
            ))}
          </div>
        )}
      </label>
    </div>
  );
}