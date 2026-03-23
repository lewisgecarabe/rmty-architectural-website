import AuthForm from "../components/AuthForm";

export default function AuthPage() {
    return (
        <section className="min-h-screen w-full [font-family:var(--font-neue)]">
            <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
                {/* LEFT: Image holder */}
                <div className="hidden md:flex items-center justify-center relative">
                    {" "}
                    {/* Added relative here */}
                    <img
                        src="../images/home-hero.webp"
                        alt="RMTY Logo"
                        className="w-full h-full object-cover"
                    />
                    {/* Increased opacity from bg-black/30 to bg-black/60 */}
                    <div className="absolute inset-0 bg-black/10 z-10" />
                </div>

                {/* RIGHT: Login panel */}
                <div className="flex items-center justify-center bg-[#f5f5f5] px-6 py-16 lg:px-24">
                    {/* Narrowed from max-w-md to max-w-sm for tighter, sleeker form alignment */}
                    <div className="w-full max-w-sm">
                        {/* Heading Area */}
                        <div className="mb-12">
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase leading-none mb-3">
                                Welcome Back.
                            </h1>

                            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-medium">
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
