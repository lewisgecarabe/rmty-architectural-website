import AuthForm from "../components/AuthForm";

export default function AuthPage() {
  return (
    <section className="min-h-screen w-full [font-family:var(--font-neue)]">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        {/* LEFT: Image holder */}
        <div className="hidden md:flex items-center justify-center bg-[#eef1f4]">
          <div className="h-10 w-10 rounded border border-gray-400/60 bg-white/50 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5 text-gray-500"
            >
              <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z" />
              <path d="m7 14 2-2 3 3 2-2 3 3" />
              <path d="M8.5 8.5h.01" />
            </svg>
          </div>
        </div>

        {/* RIGHT: Login panel */}
        <div className="flex items-center justify-center bg-white px-6 py-16">
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="mb-10">
            <h1
            className="text-4xl font-regular tracking-wide uppercase"
            style={{
              WebkitTextStroke: "1px black",
              color: "black",
            }}
          >
            WELCOME BACK!
          </h1>

              <p className="mt-2 text-sm text-gray-500">
                Log in to access your dashboard
              </p>
            </div>

            {/* Login Form */}
            <AuthForm type="signin" />
          </div>
        </div>
      </div>
    </section>
  );
}
