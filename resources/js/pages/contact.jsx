
import ContactMap from "../components/ContactMap";


export default function Contact() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="font-gantari text-4xl font-extrabold tracking-wide text-gray-900">
          CONTACT US
        </h1>

        <p className="font-questrial mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
          Have questions or need more information? Fill out the contact form
          below, and our team will get back to you promptly. We’re here to
          assist with all your construction needs!
        </p>
      </div>

      {/* Form */}
      <form className="space-y-6">
      
        <div>
          <label className="font-gantari block text-xs font-semibold tracking-widest text-gray-700">
            FULL NAME
          </label>

          <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <input
                type="text"
                className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
              <p className="font-questrial mt-2 text-[11px] text-gray-500">
                First Name
              </p>
            </div>

            <div>
              <input
                type="text"
                className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
              <p className="font-questrial mt-2 text-[11px] text-gray-500">
                Last Name
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="max-w-md">
          <label className="font-gantari block text-xs font-semibold tracking-widest text-gray-700">
            EMAIL
          </label>
          <div className="mt-3">
            <input
              type="email"
              className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
            <p className="font-questrial mt-2 text-[11px] text-gray-500">
              Email
            </p>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="font-gantari block text-xs font-semibold tracking-widest text-gray-700">
            MESSAGE
          </label>
          <div className="mt-3">
            <textarea
              rows={6}
              className="w-full rounded-md bg-white px-4 py-3 text-sm text-gray-900 outline-none border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="mx-auto block rounded-md bg-gray-800 px-10 py-3 text-xs font-semibold tracking-widest text-white hover:bg-gray-900"
          >
            SUBMIT
          </button>
        </div>
      </form>

      {/* Bottom section */}
      <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="h-[320px] w-full overflow-hidden rounded-md bg-gray-200">
         <ContactMap />

          <div className="h-full w-full flex items-center justify-center text-gray-600 text-sm font-questrial">
            Map placeholder
          </div>
        </div>

        {/* Contact details */}
        <div className="md:pt-2">
          <h2 className="font-gantari text-sm font-semibold tracking-[0.25em] text-gray-900">
            CONTACT DETAILS
          </h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 border border-gray-300">
              <svg
                className="h-5 w-5 text-black"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.59a1 1 0 01-.25 1.01l-2.2 2.19z" />
              </svg>

              <input
                className="w-full bg-transparent text-sm text-gray-700 outline-none font-questrial"
                value="0915 896 2275"
                readOnly
              />
            </div>

            <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 border border-gray-300">
              <svg
                className="h-5 w-5 text-black"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>

              <input
                className="w-full bg-transparent text-sm text-gray-700 outline-none font-questrial"
                value="911 Josefina 2 Sampaloc, Manila, Philippines, 1008"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
