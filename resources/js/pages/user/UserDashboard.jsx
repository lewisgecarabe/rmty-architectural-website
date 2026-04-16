import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const smoothEase = [0.22, 1, 0.36, 1];
const MIN_RESCHEDULE_DATE = "2026-04-01";

const STORAGE_KEYS = {
    profile: "client_profile",
    appointments: "client_appointments",
};

function createDefaultProfile() {
    return {
        firstName: "Client",
        lastName: "User",
        email: "client@example.com",
        phone: "09123456789",
    };
}

function createDefaultAppointment(profile) {
    return {
        id: 1,
        status: "pending",
        firstName: profile.firstName || "Client",
        lastName: profile.lastName || "User",
        email: profile.email || "client@example.com",
        phone: profile.phone || "09123456789",
        location: "Quezon City",
        projectType: "Residential",
        message:
            "Planning for a modern two-storey residential project with open living space and natural lighting.",
        consultationDate: "2026-04-18 10:00:00",
        createdAt: "2026-04-16 09:30:00",
        updatedAt: "2026-04-16 09:30:00",
        rescheduleReason: "",
    };
}

function safeParse(json, fallback) {
    try {
        return JSON.parse(json) ?? fallback;
    } catch {
        return fallback;
    }
}

function formatDateTime(dateTime) {
    if (!dateTime) return "—";
    const d = new Date(dateTime.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return dateTime;
    return d.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDateOnly(dateTime) {
    if (!dateTime) return "—";
    const d = new Date(dateTime.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return dateTime;
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function formatTimeOnly(dateTime) {
    if (!dateTime) return "—";
    const d = new Date(dateTime.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatStatus(status) {
    const value = String(status || "").toLowerCase();
    if (!value) return "Pending";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusClasses(status) {
    const value = String(status || "").toLowerCase();

    if (value === "confirmed" || value === "accepted") {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (value === "rescheduled") {
        return "border-blue-200 bg-blue-50 text-blue-700";
    }
    if (value === "completed") {
        return "border-neutral-300 bg-neutral-100 text-neutral-700";
    }
    if (value === "cancelled" || value === "canceled") {
        return "border-red-200 bg-red-50 text-red-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
}

function buildTimeOptions() {
    return Array.from({ length: 17 }).map((_, i) => {
        const totalMinutes = 9 * 60 + i * 30;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const value = `${String(h).padStart(2, "0")}:${String(m).padStart(
            2,
            "0",
        )}`;
        const label = `${h % 12 || 12}:${m === 0 ? "00" : m} ${
            h < 12 ? "AM" : "PM"
        }`;
        return { value, label };
    });
}

function splitConsultationDate(dateTime) {
    if (!dateTime) return { date: "", time: "" };
    const d = new Date(dateTime.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };

    return {
        date: d.toISOString().slice(0, 10),
        time: `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes(),
        ).padStart(2, "0")}`,
    };
}

function combineDateTime(date, time) {
    if (!date || !time) return "";
    return `${date} ${time}:00`;
}

export default function UserDashboard() {
    const navigate = useNavigate();
    const profileDropdownRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("appointments");
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    const [profile, setProfile] = useState(createDefaultProfile());
    const [profileForm, setProfileForm] = useState(createDefaultProfile());

    const [appointments, setAppointments] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const [rescheduleForm, setRescheduleForm] = useState({
        consultationDate: "",
        consultationTime: "",
        rescheduleReason: "",
    });

    useEffect(() => {
        const storedProfile = safeParse(
            localStorage.getItem(STORAGE_KEYS.profile),
            null,
        );

        const initialProfile = storedProfile || createDefaultProfile();

        const storedAppointments = safeParse(
            localStorage.getItem(STORAGE_KEYS.appointments),
            null,
        );

        const initialAppointments =
            Array.isArray(storedAppointments) && storedAppointments.length > 0
                ? storedAppointments
                : [createDefaultAppointment(initialProfile)];

        setProfile(initialProfile);
        setProfileForm(initialProfile);
        setAppointments(initialAppointments);
        setSelectedId(initialAppointments[0]?.id ?? null);
        setLoading(false);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    }, [profile]);

    useEffect(() => {
        if (appointments.length > 0) {
            localStorage.setItem(
                STORAGE_KEYS.appointments,
                JSON.stringify(appointments),
            );
        }
    }, [appointments]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(event.target)
            ) {
                setShowProfileDropdown(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedAppointment = useMemo(
        () => appointments.find((item) => item.id === selectedId) || null,
        [appointments, selectedId],
    );

    const displayName =
        profile.firstName?.trim() ||
        profile.email?.split("@")[0] ||
        "Client";

    const initials = `${profile.firstName?.[0] || "C"}${
        profile.lastName?.[0] || ""
    }`;

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const notifications = useMemo(() => {
        if (!selectedAppointment) return [];

        const items = [
            {
                id: 1,
                title: "Appointment submitted",
                description: "Your consultation request has been recorded.",
                time: formatDateTime(
                    selectedAppointment.createdAt ||
                        selectedAppointment.consultationDate,
                ),
            },
            {
                id: 2,
                title: `Status: ${formatStatus(selectedAppointment.status)}`,
                description:
                    selectedAppointment.status === "rescheduled"
                        ? "Your appointment schedule was updated."
                        : selectedAppointment.status === "cancelled"
                          ? "Your appointment has been cancelled."
                          : "Track your latest appointment status here.",
                time: formatDateTime(
                    selectedAppointment.updatedAt ||
                        selectedAppointment.createdAt,
                ),
            },
        ];

        if (selectedAppointment.rescheduleReason?.trim()) {
            items.push({
                id: 3,
                title: "Reschedule reason saved",
                description: selectedAppointment.rescheduleReason,
                time: formatDateTime(selectedAppointment.updatedAt),
            });
        }

        return items;
    }, [selectedAppointment]);

    function openRescheduleModal() {
        if (!selectedAppointment) return;

        const split = splitConsultationDate(
            selectedAppointment.consultationDate,
        );

        setRescheduleForm({
            consultationDate: split.date || MIN_RESCHEDULE_DATE,
            consultationTime: split.time || "09:00",
            rescheduleReason: selectedAppointment.rescheduleReason || "",
        });

        setShowRescheduleModal(true);
    }

    async function handleSaveProfile(e) {
        e.preventDefault();

        setProfile({ ...profileForm });

        await Swal.fire({
            icon: "success",
            title: "Profile updated",
            text: "Your profile information has been updated successfully.",
            confirmButtonColor: "#000000",
        });

        setShowProfileModal(false);
        setShowProfileDropdown(false);
    }

    async function handleCancelAppointment() {
        if (!selectedAppointment) return;

        const result = await Swal.fire({
            icon: "warning",
            title: "Cancel appointment?",
            text: "Do you want to continue cancelling this appointment?",
            showCancelButton: true,
            confirmButtonText: "Yes, continue",
            cancelButtonText: "No, keep it",
            confirmButtonColor: "#000000",
        });

        if (!result.isConfirmed) return;

        const updatedAppointments = appointments.map((item) =>
            item.id === selectedAppointment.id
                ? {
                      ...item,
                      status: "cancelled",
                      updatedAt: new Date()
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 19),
                  }
                : item,
        );

        setAppointments(updatedAppointments);

        await Swal.fire({
            icon: "success",
            title: "Appointment cancelled",
            text: "Your appointment has been cancelled successfully.",
            confirmButtonColor: "#000000",
        });
    }

    async function handleConfirmReschedule(e) {
        e.preventDefault();

        if (
            !rescheduleForm.consultationDate ||
            !rescheduleForm.consultationTime ||
            !rescheduleForm.rescheduleReason.trim()
        ) {
            await Swal.fire({
                icon: "warning",
                title: "Incomplete details",
                text: "Please select a new date, time, and add your reason for rescheduling.",
                confirmButtonColor: "#000000",
            });
            return;
        }

        const result = await Swal.fire({
            icon: "question",
            title: "Reschedule appointment?",
            text: "Do you want to continue with the new schedule?",
            showCancelButton: true,
            confirmButtonText: "Yes, continue",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#000000",
        });

        if (!result.isConfirmed || !selectedAppointment) return;

        const newDateTime = combineDateTime(
            rescheduleForm.consultationDate,
            rescheduleForm.consultationTime,
        );

        const updatedAppointments = appointments.map((item) =>
            item.id === selectedAppointment.id
                ? {
                      ...item,
                      consultationDate: newDateTime,
                      status: "rescheduled",
                      rescheduleReason: rescheduleForm.rescheduleReason,
                      updatedAt: new Date()
                          .toISOString()
                          .replace("T", " ")
                          .slice(0, 19),
                  }
                : item,
        );

        setAppointments(updatedAppointments);
        setShowRescheduleModal(false);

        await Swal.fire({
            icon: "success",
            title: "Appointment rescheduled",
            text: "Your appointment schedule has been updated successfully.",
            confirmButtonColor: "#000000",
        });
    }

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/auth");
    }

    if (loading) {
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center min-h-screen gap-4 bg-gray-100">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Dashboard
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 [font-family:var(--font-neue)]">
            <div className="flex min-h-screen">
                <aside className="hidden lg:flex w-[260px] bg-black text-white px-6 py-6 flex-col justify-between">
                    <div>
                        <div className="mb-10">
                            <div className="flex items-center gap-4 px-1 py-2">
                                <img
                                    src="/images/rmty-logo-transparent.png"
                                    alt="RMTY Logo"
                                    className="h-12 w-12 object-contain"
                                />
                                <span className="text-[2.2rem] leading-none font-black tracking-tight text-white">
                                    RMTY
                                </span>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setActiveNav("appointments")}
                                className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all cursor-pointer ${
                                    activeNav === "appointments"
                                        ? "bg-neutral-700 text-white"
                                        : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                            >
                                <CalendarIcon className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-wide">
                                    Appointments
                                </span>
                            </button>
                        </nav>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span className="text-sm font-bold tracking-wide">
                                Logout
                            </span>
                        </button>
                    </div>
                </aside>

                <div className="flex-1 min-w-0 bg-gray-100">
                    <header className="sticky top-0 z-30 bg-gray-100/95 backdrop-blur border-b border-neutral-200 px-4 md:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">
                                    Today's Date
                                </p>
                                <p className="text-sm font-bold text-neutral-900">
                                    {today}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="relative w-11 h-11 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-neutral-700 hover:border-neutral-300 transition-colors cursor-pointer"
                                >
                                    <BellIcon className="w-5 h-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500" />
                                    )}
                                </button>

                                <div className="relative" ref={profileDropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowProfileDropdown((prev) => !prev)
                                        }
                                        className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 py-2 hover:border-neutral-300 transition-colors cursor-pointer"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-black uppercase">
                                            {initials}
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-bold text-neutral-900 leading-tight">
                                                {displayName}
                                            </p>
                                            <p className="text-[11px] font-medium text-neutral-500">
                                                Client
                                            </p>
                                        </div>
                                        <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                                    </button>

                                    <AnimatePresence>
                                        {showProfileDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 8 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute right-0 mt-3 w-[240px] rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProfileModal(true);
                                                        setShowProfileDropdown(false);
                                                    }}
                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                                                >
                                                    Edit Profile
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    Logout
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="px-4 md:px-6 lg:px-8 py-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: smoothEase }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 mb-1.5">
                                        My Appointments
                                    </h2>
                                    <p className="text-sm font-medium text-neutral-500">
                                        Track your consultation request and manage
                                        your schedule updates here.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                <StatCard
                                    label="Current Status"
                                    value={
                                        selectedAppointment
                                            ? formatStatus(
                                                  selectedAppointment.status,
                                              )
                                            : "—"
                                    }
                                    icon={<ActivityIcon />}
                                />
                                <StatCard
                                    label="Consultation Date"
                                    value={
                                        selectedAppointment
                                            ? formatDateOnly(
                                                  selectedAppointment.consultationDate,
                                              )
                                            : "—"
                                    }
                                    icon={<CalendarIcon />}
                                />
                                <StatCard
                                    label="Consultation Time"
                                    value={
                                        selectedAppointment
                                            ? formatTimeOnly(
                                                  selectedAppointment.consultationDate,
                                              )
                                            : "—"
                                    }
                                    icon={<ClockIcon />}
                                />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                                <div className="xl:col-span-2 space-y-6">
                                    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                            <div>
                                                <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                                                    Appointment Overview
                                                </h3>
                                                <p className="text-xs font-medium text-neutral-400 mt-1">
                                                    Details from your submitted
                                                    appointment form
                                                </p>
                                            </div>

                                            {selectedAppointment && (
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${statusClasses(
                                                        selectedAppointment.status,
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        selectedAppointment.status,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {!selectedAppointment ? (
                                            <div className="p-8 text-center">
                                                <p className="text-sm font-medium text-neutral-500">
                                                    No appointment record found.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-6 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <DetailCard title="Client Information">
                                                        <FieldRow
                                                            label="First Name"
                                                            value={
                                                                selectedAppointment.firstName
                                                            }
                                                        />
                                                        <FieldRow
                                                            label="Last Name"
                                                            value={
                                                                selectedAppointment.lastName
                                                            }
                                                        />
                                                        <FieldRow
                                                            label="Email"
                                                            value={
                                                                selectedAppointment.email
                                                            }
                                                        />
                                                        <FieldRow
                                                            label="Phone"
                                                            value={
                                                                selectedAppointment.phone ||
                                                                "—"
                                                            }
                                                        />
                                                    </DetailCard>

                                                    <DetailCard title="Project Information">
                                                        <FieldRow
                                                            label="Location"
                                                            value={
                                                                selectedAppointment.location ||
                                                                "—"
                                                            }
                                                        />
                                                        <FieldRow
                                                            label="Project Type"
                                                            value={
                                                                selectedAppointment.projectType ||
                                                                "—"
                                                            }
                                                        />
                                                        <FieldRow
                                                            label="Submitted"
                                                            value={formatDateTime(
                                                                selectedAppointment.createdAt,
                                                            )}
                                                        />
                                                        <FieldRow
                                                            label="Last Updated"
                                                            value={formatDateTime(
                                                                selectedAppointment.updatedAt,
                                                            )}
                                                        />
                                                    </DetailCard>
                                                </div>

                                                <DetailCard title="Project Description">
                                                    <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                                                        {selectedAppointment.message?.trim() ||
                                                            "No project description provided."}
                                                    </p>
                                                </DetailCard>

                                                <DetailCard title="Appointment Tracking">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <TimelineStep
                                                            label="Submitted"
                                                            active
                                                        />
                                                        <TimelineStep
                                                            label={
                                                                selectedAppointment.status ===
                                                                "rescheduled"
                                                                    ? "Rescheduled"
                                                                    : "Pending Review"
                                                            }
                                                            active
                                                        />
                                                        <TimelineStep
                                                            label={formatStatus(
                                                                selectedAppointment.status,
                                                            )}
                                                            active
                                                        />
                                                    </div>

                                                    {selectedAppointment.rescheduleReason?.trim() && (
                                                        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                                            <p className="text-[10px] font-bold tracking-[0.15em] text-blue-700 uppercase mb-2">
                                                                Reschedule Reason
                                                            </p>
                                                            <p className="text-sm text-blue-900 leading-relaxed">
                                                                {
                                                                    selectedAppointment.rescheduleReason
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </DetailCard>

                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            openRescheduleModal
                                                        }
                                                        className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer"
                                                    >
                                                        Reschedule
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleCancelAppointment
                                                        }
                                                        className="rounded-full border border-red-200 bg-red-50 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-red-700 hover:bg-red-100 transition-all cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                        <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                            <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                                                My Appointment Records
                                            </h3>
                                        </div>

                                        <div className="divide-y divide-neutral-100">
                                            {appointments.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedId(item.id)
                                                    }
                                                    className={`w-full text-left px-6 py-4 transition-colors cursor-pointer ${
                                                        selectedId === item.id
                                                            ? "bg-neutral-100"
                                                            : "hover:bg-neutral-50/60"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-neutral-900">
                                                                {item.projectType ||
                                                                    "Appointment"}
                                                            </p>
                                                            <p className="text-xs font-medium text-neutral-500 mt-1">
                                                                {formatDateTime(
                                                                    item.consultationDate,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] ${statusClasses(
                                                                item.status,
                                                            )}`}
                                                        >
                                                            {formatStatus(
                                                                item.status,
                                                            )}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <div className="space-y-6">
                                    <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                                        <div className="px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                                            <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                                                Notifications
                                            </h3>
                                        </div>

                                        <div className="divide-y divide-neutral-100">
                                            {notifications.length === 0 ? (
                                                <div className="px-6 py-5 text-sm text-neutral-500">
                                                    No notifications yet.
                                                </div>
                                            ) : (
                                                notifications.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="px-6 py-4"
                                                    >
                                                        <p className="text-sm font-bold text-neutral-900">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mt-3">
                                                            {item.time}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>

            <AnimatePresence>
                {showProfileModal && (
                    <ModalShell onClose={() => setShowProfileModal(false)}>
                        <form onSubmit={handleSaveProfile} className="space-y-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-2">
                                    Profile
                                </p>
                                <h3 className="text-2xl font-black tracking-tight text-neutral-900">
                                    Edit Profile
                                </h3>
                            </div>

                            <DashboardInput
                                label="First Name"
                                value={profileForm.firstName}
                                onChange={(e) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        firstName: e.target.value,
                                    }))
                                }
                            />

                            <DashboardInput
                                label="Last Name"
                                value={profileForm.lastName}
                                onChange={(e) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        lastName: e.target.value,
                                    }))
                                }
                            />

                            <DashboardInput
                                label="Email"
                                type="email"
                                value={profileForm.email}
                                onChange={(e) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                            />

                            <DashboardInput
                                label="Phone"
                                value={profileForm.phone}
                                onChange={(e) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        phone: e.target.value,
                                    }))
                                }
                            />

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer"
                                >
                                    Save Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowProfileModal(false)}
                                    className="rounded-full border border-neutral-300 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showRescheduleModal && (
                    <ModalShell onClose={() => setShowRescheduleModal(false)}>
                        <form
                            onSubmit={handleConfirmReschedule}
                            className="space-y-5"
                        >
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-2">
                                    Appointments
                                </p>
                                <h3 className="text-2xl font-black tracking-tight text-neutral-900">
                                    Reschedule Appointment
                                </h3>
                                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                                    Choose a new schedule from April 2026 onward
                                    and add your reason for rescheduling.
                                </p>
                            </div>

                            <DashboardInput
                                label="New Date"
                                type="date"
                                min={MIN_RESCHEDULE_DATE}
                                value={rescheduleForm.consultationDate}
                                onChange={(e) =>
                                    setRescheduleForm((prev) => ({
                                        ...prev,
                                        consultationDate: e.target.value,
                                    }))
                                }
                            />

                            <DashboardSelect
                                label="New Time"
                                value={rescheduleForm.consultationTime}
                                onChange={(e) =>
                                    setRescheduleForm((prev) => ({
                                        ...prev,
                                        consultationTime: e.target.value,
                                    }))
                                }
                                options={buildTimeOptions()}
                            />

                            <DashboardTextarea
                                label="Reason for Reschedule"
                                rows={5}
                                value={rescheduleForm.rescheduleReason}
                                onChange={(e) =>
                                    setRescheduleForm((prev) => ({
                                        ...prev,
                                        rescheduleReason: e.target.value,
                                    }))
                                }
                            />

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="rounded-full bg-black px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white hover:opacity-80 transition-all cursor-pointer"
                                >
                                    Continue
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="rounded-full border border-neutral-300 px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </form>
                    </ModalShell>
                )}
            </AnimatePresence>
        </div>
    );
}

function ModalShell({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/30"
            />
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-[560px] rounded-3xl border border-neutral-200 bg-white p-6 md:p-8 shadow-2xl"
            >
                {children}
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[120px] transition-colors hover:border-neutral-300">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase w-2/3 leading-relaxed">
                    {label}
                </p>
                <div className="text-neutral-500">{icon}</div>
            </div>
            <p className="text-2xl font-black text-neutral-900 mt-2 leading-tight break-words">
                {value || "—"}
            </p>
        </div>
    );
}

function DetailCard({ title, children }) {
    return (
        <section className="rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                <h3 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                    {title}
                </h3>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </section>
    );
}

function FieldRow({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                {label}
            </span>
            <span className="text-sm font-medium text-neutral-700 break-words">
                {value}
            </span>
        </div>
    );
}

function TimelineStep({ label, active }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 flex items-center gap-3">
            <div
                className={`w-3 h-3 rounded-full ${
                    active ? "bg-neutral-900" : "bg-neutral-300"
                }`}
            />
            <p className="text-sm font-bold text-neutral-800">{label}</p>
        </div>
    );
}

function DashboardInput({ label, type = "text", value, onChange, min }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                min={min}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-black transition-colors"
            />
        </div>
    );
}

function DashboardSelect({ label, value, onChange, options }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">
                {label}
            </label>
            <select
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-black transition-colors"
            >
                <option value="">Select {label}</option>
                {options.map((option) =>
                    typeof option === "string" ? (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ) : (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ),
                )}
            </select>
        </div>
    );
}

function DashboardTextarea({ label, value, onChange, rows = 4 }) {
    return (
        <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-3">
                {label}
            </label>
            <textarea
                rows={rows}
                value={value}
                onChange={onChange}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none resize-none focus:border-black transition-colors"
            />
        </div>
    );
}

function BellIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className={className}
        >
            <path
                d="M6.3 8.8a5.7 5.7 0 1 1 11.4 0c0 6.65 2.85 7.6 2.85 7.6H3.45s2.85-.95 2.85-7.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
    );
}

function ChevronDownIcon({ className = "w-4 h-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

function CalendarIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function ClockIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <circle cx="12" cy="12" r="9" />
            <path
                d="M12 7v5l3 2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ActivityIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    );
}

function LogoutIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    );
}