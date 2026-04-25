import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const smoothEase = [0.22, 1, 0.36, 1];

const API_BASE = import.meta.env.VITE_API_URL ?? "";

function getToken() {
    return localStorage.getItem("admin_token") || localStorage.getItem("token");
}

async function apiFetch(path) {
    const res = await fetch(`${API_BASE}/api${path}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

function timeAgo(dateStr) {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const getStatusMeta = (status) => {
    switch (status) {
        case "accepted":
            return { label: "Accepted", className: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
        case "cancelled":
            return { label: "Cancelled", className: "border-red-200 bg-red-50 text-red-700", dot: "bg-red-500" };
        case "rescheduled":
            return { label: "Rescheduled", className: "border-blue-200 bg-blue-50 text-blue-700", dot: "bg-blue-500" };
        default:
            return { label: "Pending", className: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" };
    }
};

function formatSchedule(dateStr) {
    if (!dateStr) return { date: "Not set", time: "" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: "" };
    return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }),
    };
}

function getRelativeDay(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: "Past", cls: "text-red-500 bg-red-50 border-red-200" };
    if (diff === 0) return { text: "Today", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (diff === 1) return { text: "Tomorrow", cls: "text-blue-600 bg-blue-50 border-blue-200" };
    if (diff <= 7) return { text: `In ${diff}d`, cls: "text-blue-600 bg-blue-50 border-blue-200" };
    return null;
}

function buildMonthlyChart(inquiries, consultations) {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: d.toLocaleString("default", { month: "short" }),
            year: d.getFullYear(),
            monthIdx: d.getMonth(),
            inquiries: 0,
            consultations: 0,
        });
    }
    inquiries.forEach((inq) => {
        const d = new Date(inq.created_at);
        const slot = months.find((m) => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
        if (slot) slot.inquiries++;
    });
    consultations.forEach((c) => {
        const d = new Date(c.created_at);
        const slot = months.find((m) => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
        if (slot) slot.consultations++;
    });
    const maxVal = Math.max(...months.map((m) => Math.max(m.inquiries, m.consultations)), 1);
    return months.map((m) => ({
        ...m,
        inquiriesPct: Math.round((m.inquiries / maxVal) * 100),
        consultationsPct: Math.round((m.consultations / maxVal) * 100),
    }));
}

export default function AdminDashboard() {
    const [adminName, setAdminName] = useState("Admin");
    const [loading, setLoading] = useState(true);
    const [inquiryStats, setInquiryStats] = useState({ total: 0, new: 0, replied: 0, archived: 0 });
    const [recentInquiries, setRecentInquiries] = useState([]);
    const [allInquiries, setAllInquiries] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [meRes, statsRes, recentRes, allInqRes, consultRes, projRes] = await Promise.allSettled([
                    apiFetch("/admin/me"),
                    apiFetch("/inquiries/stats"),
                    apiFetch("/inquiries?per_page=5&status=new"),
                    apiFetch("/inquiries?per_page=100"),
                    apiFetch("/admin/consultations"),
                    apiFetch("/admin/projects"),
                ]);

                if (cancelled) return;

                if (meRes.status === "fulfilled") {
                    const name = meRes.value?.data?.first_name || meRes.value?.data?.name?.split(" ")[0];
                    if (name) setAdminName(name);
                }
                if (statsRes.status === "fulfilled") setInquiryStats(statsRes.value);
                if (recentRes.status === "fulfilled") setRecentInquiries(recentRes.value?.data?.slice(0, 5) || []);
                if (allInqRes.status === "fulfilled") setAllInquiries(allInqRes.value?.data || []);
                if (consultRes.status === "fulfilled") setConsultations(Array.isArray(consultRes.value) ? consultRes.value : []);
                if (projRes.status === "fulfilled") setProjects(Array.isArray(projRes.value) ? projRes.value : []);
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const activeConsultations = consultations.filter((c) => c.is_published !== false && c.is_published !== 0 && c.status !== "archived");
    const pendingConsultations = activeConsultations.filter((c) => c.status === "pending").length;
    const upcomingConsultations = activeConsultations.filter((c) => {
        if (!["pending", "accepted", "rescheduled"].includes(c.status)) return false;
        const d = new Date(c.consultation_date);
        return !isNaN(d.getTime()) && d >= new Date();
    }).length;

    const nowDate = new Date();
    const todayDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    const tomorrowDate = new Date(todayDate.getTime() + 86400000);
    const todaysAppointments = activeConsultations.filter((c) => {
        if (!["pending", "accepted", "rescheduled"].includes(c.status)) return false;
        const d = new Date(c.consultation_date);
        return !isNaN(d.getTime()) && d >= todayDate && d < tomorrowDate;
    }).sort((a, b) => new Date(a.consultation_date) - new Date(b.consultation_date));

    const recentAppointments = [...activeConsultations]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const publishedProjects = projects.filter((p) => p.is_published).length;
    const draftProjects = projects.filter((p) => !p.is_published).length;
    const totalProjects = projects.length;
    const publishedPct = totalProjects > 0 ? publishedProjects / totalProjects : 0;

    const chartData = buildMonthlyChart(allInquiries, consultations);

    const stats = [
        {
            label: "New Inquiries",
            value: inquiryStats.new ?? 0,
            icon: <InboxIcon />,
            color: "text-blue-500",
        },
        {
            label: "Today's Appointments",
            value: todaysAppointments.length,
            icon: <ClockIcon />,
            color: "text-emerald-500",
        },
        {
            label: "Upcoming",
            value: upcomingConsultations,
            icon: <CalendarIcon />,
            color: "text-blue-500",
        },
        {
            label: "Pending Review",
            value: pendingConsultations,
            icon: <ActivityIcon />,
            color: "text-amber-500",
        },
    ];

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    if (loading) {
        return (
            <div className="flex flex-col [font-family:var(--font-neue)] items-center justify-center min-h-[50vh] gap-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                    Loading Dashboard
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: smoothEase }}
            className="flex flex-col [font-family:var(--font-neue)] relative pb-10 min-h-screen"
        >
            {/* Greeting Header */}
            <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 mb-1.5">
                        Welcome back, {adminName}
                    </h1>
                    <p className="text-sm font-medium text-neutral-500">
                        Here is what's happening with your platform today.
                    </p>
                </div>
                <div className="text-left md:text-right hidden sm:block">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase mb-1">
                        Today's Date
                    </p>
                    <p className="text-sm font-bold text-neutral-900">
                        {today}
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-neutral-200 bg-white p-5 flex flex-col justify-between min-h-[120px] transition-colors hover:border-neutral-300"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase w-2/3 leading-relaxed">
                                {stat.label}
                            </p>
                            <div className={`${stat.color}`}>{stat.icon}</div>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 mt-2">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Middle Row: Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-6">
                {/* 1. Premium Pill Bar Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col h-[360px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 shrink-0 gap-4">
                        <div>
                            <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                                Activity Overview
                            </h2>
                            <p className="text-xs font-medium text-neutral-400 mt-1">
                                Inquiries vs Consultations
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                <div className="w-2 h-2 rounded-full bg-neutral-900"></div>{" "}
                                Inquiries
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                <div className="w-2 h-2 rounded-full bg-neutral-200"></div>{" "}
                                Consultations
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex relative">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[28px]">
                            {[100, 75, 50, 25, 0].map((val, i) => (
                                <div
                                    key={i}
                                    className="w-full flex items-center gap-4"
                                >
                                    <span className="text-[9px] font-bold text-neutral-300 w-5 text-right">
                                        {val}
                                    </span>
                                    <div className="flex-1 border-t border-neutral-100"></div>
                                </div>
                            ))}
                        </div>

                        {/* Bars Container */}
                        <div className="flex w-full justify-between items-end h-full z-10 pl-12 pr-4 md:pr-8">
                            {chartData.map((data, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center flex-1 h-full justify-end group"
                                >
                                    {/* Pill Bars */}
                                    <div className="flex items-end justify-center w-full gap-1.5 sm:gap-2.5 h-[calc(100%-28px)]">
                                        {/* Inquiries Pill */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: `${data.inquiriesPct}%`,
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                ease: smoothEase,
                                                delay: idx * 0.1,
                                            }}
                                            className="w-3 sm:w-4 lg:w-5 bg-neutral-900 rounded-full relative cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                                                {data.inquiries} inquiries
                                            </div>
                                        </motion.div>

                                        {/* Consultations Pill */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{
                                                height: `${data.consultationsPct}%`,
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                ease: smoothEase,
                                                delay: 0.1 + idx * 0.1,
                                            }}
                                            className="w-3 sm:w-4 lg:w-5 bg-neutral-200 rounded-full relative cursor-pointer hover:bg-neutral-300 transition-colors"
                                        >
                                            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-white border border-neutral-200 text-neutral-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                                                {data.consultations} consultations
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-400 mt-4 uppercase tracking-wider h-[16px] block">
                                        {data.month}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Custom Thin Radial SVG Chart — Project Status */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col h-[360px]">
                    <div className="mb-2 shrink-0">
                        <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                            Project Status
                        </h2>
                        <p className="text-xs font-medium text-neutral-400 mt-1">
                            Current active portfolio
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
                        <div className="relative w-44 h-44 mb-8 shrink-0">
                            <svg
                                className="w-full h-full transform -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <circle cx="50" cy="50" r="44" fill="transparent" stroke="#f5f5f5" strokeWidth="4" />
                                <motion.circle
                                    cx="50" cy="50" r="44"
                                    fill="transparent"
                                    stroke="#0a0a0a"
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 44}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 44 - 2 * Math.PI * 44 * publishedPct }}
                                    transition={{ duration: 1.5, ease: smoothEase, delay: 0.5 }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-neutral-900 leading-none">{totalProjects}</span>
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-400 mt-1">Total</span>
                            </div>
                        </div>

                        <div className="w-full flex justify-around px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-lg font-black text-neutral-900">{publishedProjects}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900"></span> Published
                                </div>
                            </div>
                            <div className="w-px h-8 bg-neutral-100"></div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-lg font-black text-neutral-400">{draftProjects}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-200"></span> Archived
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            {todaysAppointments.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                                Today's Schedule
                            </h2>
                            <span className="text-[10px] font-bold tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                                {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <Link
                            to="/admin/consultations"
                            className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer outline-none"
                        >
                            Manage <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-neutral-100">
                        {todaysAppointments.map((c) => {
                            const sched = formatSchedule(c.consultation_date);
                            const meta = getStatusMeta(c.status);
                            return (
                                <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${c.first_name || ""} ${c.last_name || ""}`)}&background=f3f4f6&color=000000&rounded=true&size=32`}
                                            alt=""
                                            className="w-8 h-8 rounded-full shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-neutral-900 truncate">{c.first_name} {c.last_name}</p>
                                            <p className="text-[11px] font-medium text-neutral-400 truncate">{c.project_type || "General"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-bold text-neutral-700">{sched.time}</span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                            {meta.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-6">
                {/* Left Column: Recent Inquiries */}
                <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
                        <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                            Recent Inquiries
                        </h2>
                        <Link
                            to="/admin/inquiries"
                            className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-1 transition-colors outline-none cursor-pointer"
                        >
                            View All <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap h-full">
                            <thead className="bg-white border-b border-neutral-100">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Contact</th>
                                    <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Platform</th>
                                    <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">Received</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {recentInquiries.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-12 px-6 text-center text-sm font-medium text-neutral-400">
                                            No new inquiries
                                        </td>
                                    </tr>
                                ) : (
                                    recentInquiries.map((inq) => (
                                        <tr key={inq.id} className="group hover:bg-neutral-50 transition-colors h-[73px]">
                                            <td className="py-4 px-6 align-middle">
                                                <p className="text-sm font-bold text-neutral-900">
                                                    {inq.name || inq.first_name || "Unknown"}
                                                </p>
                                                <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                                                    {inq.email || inq.phone || "—"}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-200 bg-blue-50 text-blue-700">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                                                    {inq.platform || "website"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-right">
                                                <p className="text-xs font-medium text-neutral-500">
                                                    {timeAgo(inq.created_at)}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Status */}
                <div className="flex flex-col gap-6 h-full justify-between">
                    {/* Quick Actions (flex-1 forces it to expand and push System Status down) */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 flex-1 flex flex-col">
                        <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase mb-4 shrink-0">
                            Quick Actions
                        </h2>
                        <div className="space-y-3 flex-1 flex flex-col justify-center">
                            <Link
                                to="/admin/content/projects"
                                className="flex items-center gap-3 w-full p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-700 cursor-pointer outline-none"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500">
                                    <FolderIcon className="w-4 h-4" />
                                </div>
                                Upload New Project
                            </Link>
                            <Link
                                to="/admin/consultations"
                                className="flex items-center gap-3 w-full p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-700 cursor-pointer outline-none"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500">
                                    <CalendarIcon className="w-4 h-4" />
                                </div>
                                Manage Schedule
                            </Link>
                            <Link
                                to="/admin/users"
                                className="flex items-center gap-3 w-full p-3 rounded-xl border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-700 cursor-pointer outline-none"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500">
                                    <UsersIcon className="w-4 h-4" />
                                </div>
                                Add Administrator
                            </Link>
                        </div>
                    </div>

                    {/* System Status (shrink-0 ensures it stays exactly at its required height at the bottom) */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shrink-0">
                        <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase mb-4">
                            System Status
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                        Website Live
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-neutral-400">
                                    All systems go
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                        Database Sync
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-neutral-400">
                                    Updated just now
                                </span>
                            </div>
                            <div className="pt-4 border-t border-neutral-100 mt-2">
                                <Link
                                    to="/admin/settings"
                                    className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer outline-none"
                                >
                                    Check API Integrations{" "}
                                    <ArrowRightIcon className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Appointments */}
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-50/50">
                    <h2 className="text-sm font-bold tracking-widest text-neutral-900 uppercase">
                        Recent Appointments
                    </h2>
                    <Link
                        to="/admin/consultations"
                        className="text-[10px] font-bold text-neutral-400 hover:text-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer outline-none"
                    >
                        View All <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-white border-b border-neutral-100">
                            <tr>
                                <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Client</th>
                                <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">Project</th>
                                <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-center">Schedule</th>
                                <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-center">Status</th>
                                <th className="py-4 px-6 text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase text-right">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {recentAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 px-6 text-center text-sm font-medium text-neutral-400">
                                        No appointments yet
                                    </td>
                                </tr>
                            ) : (
                                recentAppointments.map((c) => {
                                    const sched = formatSchedule(c.consultation_date);
                                    const rel = getRelativeDay(c.consultation_date);
                                    const meta = getStatusMeta(c.status);
                                    const isPast = rel?.text === "Past" && c.status !== "cancelled";
                                    return (
                                        <tr key={c.id} className={`group hover:bg-neutral-50 transition-colors h-[73px] ${isPast ? "opacity-50" : ""}`}>
                                            <td className="py-4 px-6 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${c.first_name || ""} ${c.last_name || ""}`)}&background=f3f4f6&color=000000&rounded=true&size=32`}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full shrink-0"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-900 truncate max-w-[160px]">{c.first_name} {c.last_name}</p>
                                                        <p className="text-[11px] font-medium text-neutral-400 truncate max-w-[200px] mt-0.5">{c.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 align-middle">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-neutral-50 text-neutral-600 border-neutral-200">
                                                    {c.project_type || "N/A"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <p className={`text-sm font-bold ${isPast ? "text-red-400" : "text-neutral-900"}`}>
                                                        {sched.date}
                                                    </p>
                                                    {sched.time && (
                                                        <p className="text-[11px] font-medium text-neutral-400">{sched.time}</p>
                                                    )}
                                                    {rel && (
                                                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${rel.cls}`}>
                                                            {rel.text}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.className}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 align-middle text-right">
                                                <p className="text-xs font-medium text-neutral-500">{timeAgo(c.created_at)}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function InboxIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path
                d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                strokeLinecap="round"
            />
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
function FolderIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
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
function UsersIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={className}
        >
            <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="9"
                cy="7"
                r="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ArrowRightIcon({ className = "w-4 h-4" }) {
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
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
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
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    );
}
