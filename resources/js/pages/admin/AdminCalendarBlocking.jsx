import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthHeaders } from "../../lib/authHeaders";

/* ──────────────── CONSTANTS ──────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "";
const MONTH_NAMES = [
    "JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
    "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER",
];
const DAYS_OF_WEEK = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const TIME_SLOTS = (() => {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
        for (const m of [0, 30]) {
            if (h === 17 && m > 0) break;
            const hour24 = String(h).padStart(2, "0");
            const min = String(m).padStart(2, "0");
            const hour12 = h % 12 || 12;
            const ampm = h < 12 ? "AM" : "PM";
            slots.push({
                value: `${hour24}:${min}`,
                label: `${hour12}:${min === "0" ? "00" : min} ${ampm}`,
            });
        }
    }
    return slots;
})();

const springTransition = { type: "spring", damping: 25, stiffness: 300 };
const smoothEase = [0.22, 1, 0.36, 1];

const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

/* ──────────────── COMPONENT ──────────────── */
export default function AdminCalendarBlocking() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [selectedBooking, setSelectedBooking] = useState(null);
    const toastRef = useRef(null);

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const showToast = (msg) => {
        setSuccessMessage(msg);
        if (toastRef.current) clearTimeout(toastRef.current);
        toastRef.current = setTimeout(() => setSuccessMessage(""), 3000);
    };

    useEffect(() => () => { if (toastRef.current) clearTimeout(toastRef.current); }, []);

    /* ── Fetch data ── */
    const fetchSlots = async () => {
        setLoading(true);
        try {
            const [blockedRes, bookedRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/blocked-slots`, {
                    credentials: "include",
                    headers: getAuthHeaders(),
                }),
                fetch(`${API_BASE}/api/booked-slots`, {
                    credentials: "include",
                    headers: getAuthHeaders(),
                }),
            ]);
            if (blockedRes.ok) {
                const data = await blockedRes.json();
                setBlockedSlots(Array.isArray(data) ? data : []);
            }
            if (bookedRes.ok) {
                const data = await bookedRes.json();
                setBookedSlots(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch slots:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try { await fetch("/sanctum/csrf-cookie", { credentials: "include" }); } catch {}
            await fetchSlots();
        })();
    }, []);

    /* ── Calendar days ── */
    const calendarDays = useMemo(() => {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentYear, currentMonth, i));
        return days;
    }, [currentYear, currentMonth]);

    const isPrevDisabled = viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() <= today.getMonth();
    const isPastDate = (date) => !date || date < today;

    /* ── Helpers to check slot status ── */
    const normDate = (s) => (s?.blocked_date?.split("T")[0] || s?.blocked_date || "");

    const isBlocked = (dateStr, time) =>
        blockedSlots.some((s) => normDate(s) === dateStr && s.blocked_time === time);

    const isBooked = (dateStr, time) =>
        bookedSlots.some((s) => normDate(s) === dateStr && s.blocked_time === time);

    const getBookingForSlot = (dateStr, time) =>
        bookedSlots.find((s) => normDate(s) === dateStr && s.blocked_time === time) || null;

    const getBlockedCount = (dateStr) =>
        blockedSlots.filter((s) => normDate(s) === dateStr).length;

    const getBookedCount = (dateStr) =>
        bookedSlots.filter((s) => normDate(s) === dateStr).length;

    const getBookingsForDate = (dateStr) =>
        bookedSlots.filter((s) => normDate(s) === dateStr);

    const isDateFullyUnavailable = (dateStr) => {
        const unavailable = getBlockedCount(dateStr) + getBookedCount(dateStr);
        return unavailable >= TIME_SLOTS.length;
    };

    /* ── Block / Unblock ── */
    const toggleSlot = async (dateStr, time) => {
        if (isBooked(dateStr, time)) return;
        setUpdating(true);
        try {
            if (isBlocked(dateStr, time)) {
                await fetch(`${API_BASE}/api/admin/blocked-slots/by-date-time`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ date: dateStr, time }),
                });
                showToast("Slot unblocked");
            } else {
                await fetch(`${API_BASE}/api/admin/blocked-slots`, {
                    method: "POST",
                    credentials: "include",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ slots: [{ date: dateStr, time }] }),
                });
                showToast("Slot blocked");
            }
            await fetchSlots();
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        } finally {
            setUpdating(false);
        }
    };

    const blockAllForDate = async (dateStr) => {
        const slotsToBlock = TIME_SLOTS.filter(
            (s) => !isBlocked(dateStr, s.value) && !isBooked(dateStr, s.value)
        ).map((s) => ({ date: dateStr, time: s.value }));

        if (slotsToBlock.length === 0) return;
        setUpdating(true);
        try {
            await fetch(`${API_BASE}/api/admin/blocked-slots`, {
                method: "POST",
                credentials: "include",
                headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify({ slots: slotsToBlock }),
            });
            showToast(`Blocked ${slotsToBlock.length} slot(s)`);
            await fetchSlots();
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        } finally {
            setUpdating(false);
        }
    };

    const unblockAllForDate = async (dateStr) => {
        const blockedForDate = blockedSlots.filter(
            (s) => (s.blocked_date?.split("T")[0] || s.blocked_date) === dateStr
        );
        if (blockedForDate.length === 0) return;
        setUpdating(true);
        try {
            await Promise.all(
                blockedForDate.map((s) =>
                    fetch(`${API_BASE}/api/admin/blocked-slots/${s.id}`, {
                        method: "DELETE",
                        credentials: "include",
                        headers: getAuthHeaders(),
                    })
                )
            );
            showToast(`Unblocked ${blockedForDate.length} slot(s)`);
            await fetchSlots();
        } catch (err) {
            console.error(err);
            alert("Something went wrong.");
        } finally {
            setUpdating(false);
        }
    };

    /* ── Selected date label ── */
    const selectedDateLabel = selectedDate
        ? new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
          })
        : "Select a date";

    /* ── Stats ── */
    const totalBlocked = blockedSlots.length;
    const totalBooked = bookedSlots.length;
    const todayStr = formatDate(today);
    const appointmentsToday = bookedSlots.filter((s) => normDate(s) === todayStr).length;

    const statCards = [
        { label: "Blocked Slots", value: totalBlocked, icon: <BanIcon className="w-5 h-5 text-red-500" /> },
        { label: "Booked Slots", value: totalBooked, icon: <CalendarIcon className="w-5 h-5 text-blue-500" /> },
        { label: "Today's Appointments", value: appointmentsToday, icon: <ClockIcon className="w-5 h-5 text-emerald-500" /> },
        { label: "Total Unavailable", value: totalBlocked + totalBooked, icon: <LockIcon className="w-5 h-5 text-neutral-500" /> },
    ];

    /* ── Appointments for selected date ── */
    const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

    return (
        <div className="flex flex-col [font-family:var(--font-neue)] relative pb-10">
            {/* Toast */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={springTransition}
                        className="fixed top-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700 shadow-lg"
                    >
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <p className="text-sm font-medium text-neutral-500">
                        Block time slots to prevent clients from booking. Already booked slots are shown as unavailable.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[114px] hover:border-neutral-300"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                                    {s.label}
                                </p>
                                <div className="text-neutral-300">{s.icon}</div>
                            </div>
                            <p className="text-3xl font-black text-neutral-900 mt-2">{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar + Time Slots */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
                    {/* Left: Calendar */}
                    <div className="p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold tracking-[0.2em] uppercase">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))}
                                    disabled={isPrevDisabled}
                                    type="button"
                                    className={`p-2 transition-colors cursor-pointer ${isPrevDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-neutral-100"}`}
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))}
                                    type="button"
                                    className="p-2 hover:bg-neutral-100 transition-colors cursor-pointer"
                                >
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {DAYS_OF_WEEK.map((day) => (
                                <div key={day} className="text-[10px] font-bold tracking-widest text-neutral-400 text-center py-2">
                                    {day}
                                </div>
                            ))}
                            {calendarDays.map((date, idx) => {
                                const past = isPastDate(date);
                                const dateStr = date ? formatDate(date) : null;
                                const selected = dateStr === selectedDate;
                                const isToday = date && date.getTime() === today.getTime();
                                const blockedCount = dateStr ? getBlockedCount(dateStr) : 0;
                                const bookedCount = dateStr ? getBookedCount(dateStr) : 0;
                                const fullyUnavailable = dateStr ? isDateFullyUnavailable(dateStr) : false;
                                const hasBlocked = blockedCount > 0;
                                const hasBooked = bookedCount > 0;

                                return (
                                    <div key={idx} className="aspect-square flex items-center justify-center">
                                        {date ? (
                                            <button
                                                type="button"
                                                disabled={past}
                                                onClick={() => setSelectedDate(dateStr)}
                                                className={`
                                                    relative w-10 h-10 flex items-center justify-center text-xs font-medium transition-all rounded-full
                                                    ${past ? "text-neutral-300 cursor-not-allowed" : "cursor-pointer"}
                                                    ${!past && !selected && !fullyUnavailable ? "hover:bg-neutral-200 text-black" : ""}
                                                    ${selected ? "bg-black text-white" : ""}
                                                    ${!selected && fullyUnavailable && !past ? "bg-red-50 text-red-400" : ""}
                                                    ${isToday && !selected ? "border border-neutral-300" : ""}
                                                `}
                                            >
                                                {date.getDate()}
                                                {!past && (hasBlocked || hasBooked) && !selected && (
                                                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                        {hasBlocked && <span className="w-1 h-1 rounded-full bg-red-400" />}
                                                        {hasBooked && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                                                    </span>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-10 h-10" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-neutral-100">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Blocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Booked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-50 border border-red-200" />
                                <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Fully Unavailable</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Time Slots */}
                    <div className="p-6 lg:p-8 flex flex-col min-h-[560px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold tracking-[0.2em] uppercase">
                                {selectedDateLabel}
                            </h3>
                            {selectedDate && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => blockAllForDate(selectedDate)}
                                        disabled={updating}
                                        className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Block All
                                    </button>
                                    <button
                                        onClick={() => unblockAllForDate(selectedDate)}
                                        disabled={updating}
                                        className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Unblock All
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="wait">
                                {!selectedDate ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-center h-full text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase text-center mt-20"
                                    >
                                        Select a date <br /> to manage time slots
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="slots"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col gap-2"
                                    >
                                        {TIME_SLOTS.map((slot) => {
                                            const blocked = isBlocked(selectedDate, slot.value);
                                            const booked = isBooked(selectedDate, slot.value);
                                            const unavailable = blocked || booked;

                                            const booking = booked ? getBookingForSlot(selectedDate, slot.value) : null;

                                            return (
                                                <button
                                                    key={slot.value}
                                                    type="button"
                                                    disabled={updating && !booked}
                                                    onClick={() => {
                                                        if (booked && booking) {
                                                            setSelectedBooking(booking);
                                                        } else {
                                                            toggleSlot(selectedDate, slot.value);
                                                        }
                                                    }}
                                                    className={`
                                                        w-full py-4 px-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-all rounded-none flex items-center justify-between
                                                        ${booked
                                                            ? "bg-blue-50 text-blue-600 border border-blue-200 cursor-pointer hover:bg-blue-100"
                                                            : blocked
                                                                ? "bg-red-50 text-red-500 border border-red-300 cursor-pointer hover:bg-red-100"
                                                                : "bg-transparent text-black border border-neutral-300 hover:border-black cursor-pointer"
                                                        }
                                                        ${updating && !booked ? "opacity-50 pointer-events-none" : ""}
                                                    `}
                                                >
                                                    <div className="flex flex-col items-start gap-0.5">
                                                        <span>{slot.label}</span>
                                                        {booked && booking?.client_name && (
                                                            <span className="text-[9px] tracking-normal normal-case font-medium text-blue-400">
                                                                {booking.client_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {booked && (
                                                        <span className="text-[9px] tracking-[0.15em] bg-blue-100 text-blue-500 px-2 py-0.5 rounded">
                                                            BOOKED
                                                        </span>
                                                    )}
                                                    {blocked && !booked && (
                                                        <span className="text-[9px] tracking-[0.15em] bg-red-100 text-red-500 px-2 py-0.5 rounded">
                                                            BLOCKED
                                                        </span>
                                                    )}
                                                    {!unavailable && (
                                                        <span className="text-[9px] tracking-[0.15em] text-neutral-400">
                                                            AVAILABLE
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments for selected date */}
            {selectedDate && selectedDateBookings.length > 0 && (
                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-600">
                            Appointments on {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {selectedDateBookings.map((b, i) => {
                            const hour = parseInt(b.blocked_time?.split(":")[0] || 0);
                            const min = b.blocked_time?.split(":")[1] || "00";
                            const hour12 = hour % 12 || 12;
                            const ampm = hour < 12 ? "AM" : "PM";
                            const timeLabel = `${hour12}:${min} ${ampm}`;
                            const statusColors = {
                                accepted: "bg-emerald-50 text-emerald-600 border-emerald-200",
                                pending: "bg-amber-50 text-amber-600 border-amber-200",
                                rescheduled: "bg-blue-50 text-blue-600 border-blue-200",
                            };

                            return (
                                <div
                                    key={i}
                                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                                    onClick={() => setSelectedBooking(b)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.client_name || "?")}&background=f3f4f6&color=000000&rounded=true&size=32`}
                                            alt=""
                                            className="w-8 h-8 rounded-full shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-neutral-900 truncate">{b.client_name}</p>
                                            <p className="text-[11px] font-medium text-neutral-400 truncate">{b.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-bold text-neutral-600">{timeLabel}</span>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${statusColors[b.status] || statusColors.pending}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Booking Detail Drawer */}
            <AnimatePresence>
                {selectedBooking && (
                    <>
                        <motion.div
                            key="booking-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[70] cursor-pointer"
                            onClick={() => setSelectedBooking(null)}
                        />
                        <motion.div
                            key="booking-drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[80] flex flex-col border-l border-neutral-200 [font-family:var(--font-neue)]"
                        >
                            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Appointment Details</h3>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBooking.client_name || "?")}&background=f3f4f6&color=000000&rounded=true&size=64`}
                                        alt=""
                                        className="w-14 h-14 rounded-full shrink-0"
                                    />
                                    <div>
                                        <p className="text-xl font-black text-neutral-900">{selectedBooking.client_name}</p>
                                        <p className="text-sm font-medium text-neutral-500 mt-0.5">{selectedBooking.email}</p>
                                        {selectedBooking.phone && (
                                            <p className="text-sm font-medium text-neutral-500 mt-0.5">{selectedBooking.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Date</p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {new Date(selectedBooking.blocked_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Time</p>
                                        <p className="text-sm font-bold text-neutral-900">
                                            {(() => {
                                                const h = parseInt(selectedBooking.blocked_time?.split(":")[0] || 0);
                                                const m = selectedBooking.blocked_time?.split(":")[1] || "00";
                                                return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Project Type</p>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                            {selectedBooking.project_type || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-2">Status</p>
                                        {(() => {
                                            const colors = {
                                                accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
                                                pending: "border-amber-200 bg-amber-50 text-amber-700",
                                                rescheduled: "border-blue-200 bg-blue-50 text-blue-700",
                                            };
                                            return (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[selectedBooking.status] || colors.pending}`}>
                                                    {selectedBooking.status}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                                <a
                                    href="/admin/consultations"
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-xs font-bold text-neutral-700 uppercase tracking-wider transition-all hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer"
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                    View in Appointments
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d1d1; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
            `}</style>
        </div>
    );
}

/* ──────────────── ICONS ──────────────── */
function CalendarIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function ClockIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    );
}

function BanIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <path d="M5.64 5.64l12.72 12.72" />
        </svg>
    );
}

function ChevronLeftIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    );
}

function ChevronRightIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9 18l6-6-6-6" />
        </svg>
    );
}

function LockIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function CloseIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
