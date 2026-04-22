import React from "react";
import { useSearchParams } from "react-router-dom";
import ClientAuthForm from "../components/ClientAuthForm";

export default function ClientAuthPage() {
    const [searchParams] = useSearchParams();

    // Pre-fill values passed from the appointment form
    const prefillEmail     = searchParams.get("email")     ?? "";
    const prefillFirstName = searchParams.get("firstName") ?? "";
    const prefillLastName  = searchParams.get("lastName")  ?? "";

    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#f1f1f1] text-black overflow-hidden font-sans">
            {/* Left Column: Architectural Image */}
            <div className="hidden lg:block relative h-full overflow-hidden bg-neutral-200">
                <img
                    src="/images/home-hero.webp"
                    alt="Architectural Visual"
                    className="absolute inset-0 w-full h-full object-cover grayscale-[15%]"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-12 left-12">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white drop-shadow-sm">
                        RMTY Architects // 2026
                    </p>
                </div>
            </div>

            {/* Right Column: Auth Form */}
            <div className="flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-white relative">
                <div className="w-full max-w-sm">
                    <header className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                                Client Portal
                            </span>
                            <div className="h-[1px] w-12 bg-black" />
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">
                            {prefillEmail ? (
                                <>Almost<br />There.</>
                            ) : (
                                <>Welcome<br />Back.</>
                            )}
                        </h1>

                        <p className="text-[13px] font-medium tracking-wide text-neutral-500 uppercase">
                            {prefillEmail
                                ? "Sign in or create an account to submit your booking."
                                : "Authenticate to access your dashboard."}
                        </p>
                    </header>

                    {/*
                        prefillEmail/firstName/lastName come from the appointment form.
                        ClientAuthForm uses them to pre-fill the register fields and
                        the login email field so the user doesn't have to retype anything.

                        onSuccess:
                        - If a draft exists → go back to /appointments to auto-submit
                        - Otherwise → go to /user/dashboard
                    */}
                    <ClientAuthForm
                        prefillEmail={prefillEmail}
                        prefillFirstName={prefillFirstName}
                        prefillLastName={prefillLastName}
                        onSuccess={() => {
                            const hasDraft = !!sessionStorage.getItem("appointment_draft");
                            window.location.href = hasDraft ? "/appointment" : "/user/dashboard";
                        }}
                    />
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-12">
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-300">
                        EST. 1994 // SYDNEY
                    </p>
                </div>
            </div>
        </div>
    );
}