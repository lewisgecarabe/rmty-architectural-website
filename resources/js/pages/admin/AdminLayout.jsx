import React, { useRef, useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

/* ─────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────── */
export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-[#f7f7f8] font-sans overflow-hidden text-neutral-900">
            {/* Mobile/Tablet Backdrop Overlay */}
            <div
                className={`fixed inset-0 z-20 bg-black/20 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
                    sidebarOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
            />

            <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="flex flex-1 flex-col overflow-hidden relative">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0 md:pt-0 lg:pt-0">
                    <div className="mx-auto h-full w-full transition-all">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
function AdminSidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const [contentOpen, setContentOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isActive = (to) => location.pathname === to;

    // Helper to close sidebar on mobile when a link is clicked
    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    const confirmLogout = () => {
        const token =
            localStorage.getItem("admin_token") ||
            localStorage.getItem("token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        const apiBase = import.meta.env.VITE_API_URL || "";
        fetch(`${apiBase}/api/admin/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }).catch(() => {});

        window.location.href = "/admin/login";
    };

    const mainNav = [
        { label: "Dashboard", to: "/admin/dashboard", icon: <DashboardIcon /> },
        { label: "Inquiries", to: "/admin/inquiries", icon: <InboxIcon /> },
        {
            label: "Consultation",
            to: "/admin/consultations",
            icon: <CalendarIcon />,
        },
    ];

    const contentNav = [
        {
            label: "Projects",
            to: "/admin/content/projects",
            icon: <FolderIcon />,
        },
        {
            label: "Services",
            to: "/admin/content/services",
            icon: <LayersIcon />,
        },
        {
            label: "About Us",
            to: "/admin/content/about",
            icon: <DocumentIcon />,
        },
    ];

    const secondNav = [
        { label: "Analytics", to: "/admin/analytics", icon: <ChartIcon /> },
    ];

    const systemNav = [
        {
            label: "Platform Settings",
            to: "/admin/settings",
            icon: <SettingsIcon />,
        },
        { label: "User Management", to: "/admin/users", icon: <UsersIcon /> },
        { label: "Profile", to: "/admin/profile", icon: <UserIcon /> },
    ];

    useEffect(() => {
        if (location.pathname.startsWith("/admin/content")) {
            setContentOpen(true);
        }
    }, [location.pathname]);

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col bg-[#0A0A0A] text-[#888888] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:static lg:translate-x-0 ${
                isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            {/* Logo Area */}
            <div className="px-8 py-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/rmty-logo.jpg"
                        alt="RMTY Logo"
                        className="h-8 w-auto object-contain"
                    />
                    <div className="text-3xl font-black tracking-tighter text-white">
                        RMTY<span></span>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden text-white/50 hover:text-white transition-colors outline-none"
                >
                    <CloseIcon />
                </button>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
                <div className="mb-8">
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        OVERVIEW
                    </p>
                    <nav className="space-y-1">
                        {mainNav.map((item) => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                active={isActive(item.to)}
                                icon={item.icon}
                                onClick={handleLinkClick}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}
                    </nav>
                </div>

                <div className="mb-8">
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        CONTENT
                    </p>
                    <button
                        type="button"
                        onClick={() => setContentOpen((v) => !v)}
                        className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-[#888888] transition-all duration-300 hover:bg-white/5 hover:text-[#EDEDED] cursor-pointer"
                    >
                        <span className="inline-flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
                            <ContentIcon />
                            Manage Content
                        </span>
                        <span className="text-white/30 transition-transform duration-300">
                            {contentOpen ? <ChevronDown /> : <ChevronRight />}
                        </span>
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            contentOpen
                                ? "max-h-60 opacity-100"
                                : "max-h-0 opacity-0"
                        }`}
                    >
                        <div className="mt-2 space-y-1 pl-10 pr-2">
                            {contentNav.map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={handleLinkClick}
                                    className={[
                                        "flex items-center gap-3 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-300",
                                        isActive(item.to)
                                            ? "bg-white/10 text-white"
                                            : "text-[#666666] hover:bg-white/5 hover:text-white hover:translate-x-1",
                                    ].join(" ")}
                                >
                                    <span className="opacity-50">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="mt-2 space-y-1">
                        {secondNav.map((item) => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                active={isActive(item.to)}
                                icon={item.icon}
                                onClick={handleLinkClick}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="mb-4 px-4 text-[10px] font-semibold tracking-widest text-white/30">
                        SETTINGS
                    </p>
                    <nav className="space-y-1">
                        {systemNav.map((item) => (
                            <SidebarLink
                                key={item.to}
                                to={item.to}
                                active={isActive(item.to)}
                                icon={item.icon}
                                onClick={handleLinkClick}
                            >
                                {item.label}
                            </SidebarLink>
                        ))}

                        <button
                            type="button"
                            className="group flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-[#888888] transition-all duration-300 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            <span className="inline-flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
                                <LogoutIcon />
                                Logout
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Logout Confirm Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity">
                    <div className="w-full max-w-sm scale-100 rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl transition-transform">
                        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <LogoutIcon />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900">
                            Ready to leave?
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500">
                            You are about to log out of the admin panel. You
                            will need your credentials to return.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 hover:shadow-red-600/40"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

/* ─────────────────────────────────────────
   TOPBAR - Minimalist Path-focused Design
───────────────────────────────────────── */
function AdminTopbar({ profile, onProfileUpdate, onMenuClick }) {
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [fetchedName, setFetchedName] = useState(null);
    const dropdownRef = useRef(null);

    // Dynamic path title
    const getPageTitle = () => {
        const pathSegments = location.pathname.split("/").filter(Boolean);
        const lastSegment =
            pathSegments[pathSegments.length - 1] || "Dashboard";
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch user info for fallback
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token =
                    localStorage.getItem("admin_token") ||
                    localStorage.getItem("token");
                const res = await fetch("/api/admin/me", {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok && !cancelled) {
                    const json = await res.json();
                    const name =
                        json?.data?.first_name ??
                        json?.data?.name?.split?.(" ")?.[0] ??
                        null;
                    setFetchedName(name);
                }
            } catch {
                if (!cancelled) setFetchedName(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const confirmLogout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        fetch("/api/admin/logout", {
            method: "POST",
            credentials: "include",
        }).catch(() => {});
        window.location.href = "/admin/login";
    };

    const displayName = profile?.first_name || fetchedName || "Admin";
    const avatarSrc =
        profile?.profile_photo_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0A0A0A&color=ffffff&bold=true`;

    return (
        <>
            <header className="h-[90px] md:h-[100px] w-full bg-transparent flex items-center z-10 shrink-0">
                {/* 
                    MATCHING PADDING: 
                    px-4 md:px-6 lg:px-8 is used here to perfectly align with 
                    the <main> section's padding below.
                */}
                <div className="mx-auto flex w-full items-end justify-between px-4 md:px-6 lg:px-8 pb-2">
                    {/* Left: Hamburger (Mobile) + Dynamic Page Path/Title */}
                    <div className="flex items-end gap-3 md:gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden pb-1 pr-2 text-neutral-900 hover:text-neutral-600 transition-colors outline-none"
                        >
                            <MenuIcon />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase mb-1">
                                Current View
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
                                {getPageTitle()}
                            </h1>
                        </div>
                    </div>

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-4 md:gap-8 mb-1 md:mb-2">
                        {/* Minimalist Search Icon Only */}
                        <button className="hidden md:block text-neutral-400 hover:text-black transition-colors duration-200">
                            <SleekSearchIcon />
                        </button>

                        {/* Minimalist Bell Icon Only */}
                        <button className="relative text-neutral-400 hover:text-black transition-colors duration-200">
                            <SleekBellIcon />
                            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-[#f7f7f8]"></span>
                        </button>

                        {/* Profile Block */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="flex items-center gap-3 group outline-none"
                            >
                                <img
                                    src={avatarSrc}
                                    alt="User"
                                    className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover border border-neutral-200 transition-transform group-hover:scale-105"
                                />
                                <div className="hidden text-left lg:block">
                                    <p className="text-sm font-bold text-neutral-900 leading-none">
                                        {displayName}
                                    </p>
                                </div>
                                <div className="hidden lg:block text-neutral-300 transition-transform group-hover:translate-y-0.5">
                                    <ChevronDown />
                                </div>
                            </button>

                            {/* Crisp Dropdown */}
                            <div
                                className={`absolute right-0 top-[calc(100%+12px)] z-50 w-[200px] md:w-[220px] origin-top-right rounded-2xl border border-neutral-100 bg-white p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                                    dropdownOpen
                                        ? "translate-y-0 opacity-100 scale-100"
                                        : "translate-y-2 opacity-0 scale-95 pointer-events-none"
                                }`}
                            >
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setEditModalOpen(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Modals */}
            {editModalOpen && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setEditModalOpen(false)}
                    onSaved={(updated) => {
                        if (onProfileUpdate) onProfileUpdate(updated);
                        setEditModalOpen(false);
                    }}
                />
            )}

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-sm p-4">
                    <div className="w-full max-w-[320px] rounded-[2.5rem] bg-white p-8 shadow-2xl text-center">
                        <h3 className="text-xl font-black text-neutral-900">
                            Sign Out
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500 font-medium">
                            End your session securely?
                        </p>
                        <div className="mt-8 flex flex-col gap-2">
                            <button
                                onClick={confirmLogout}
                                className="w-full rounded-full bg-black py-4 text-sm font-bold text-white hover:bg-neutral-800 transition-all"
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-4 text-sm font-bold text-neutral-400 hover:text-black transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─────────────────────────────────────────
   EDIT PROFILE MODAL
───────────────────────────────────────── */
function EditProfileModal({ profile, onClose, onSaved }) {
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        email: profile?.email ?? "",
        profile_photo: null,
    });
    const [preview, setPreview] = useState(profile?.profile_photo_url ?? null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setForm((f) => ({ ...f, profile_photo: file }));
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token =
                localStorage.getItem("admin_token") ||
                localStorage.getItem("token");
            const fd = new FormData();
            fd.append("first_name", form.first_name);
            fd.append("last_name", form.last_name);
            fd.append("email", form.email);
            if (form.profile_photo) {
                fd.append("profile_photo", form.profile_photo);
            }

            const res = await fetch("/api/admin/profile", {
                method: "POST",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: fd,
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json?.message ?? "Something went wrong.");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                onSaved(json.data);
            }, 800);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const displayName = form.first_name || "Admin";
    const avatarSrc =
        preview ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            displayName,
        )}&background=0A0A0A&color=ffffff&size=128&font-size=0.33&bold=true&rounded=true`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all duration-300">
            <div className="w-full max-w-md scale-100 rounded-[2rem] border border-neutral-100 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden transition-transform">
                <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100/60 bg-white/50 backdrop-blur-md">
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                        Profile Settings
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
                    {/* Avatar picker */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* First name */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={form.first_name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        first_name: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border border-neutral-200/60 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                                placeholder="Jane"
                            />
                        </div>

                        {/* Last name */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={form.last_name}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        last_name: e.target.value,
                                    }))
                                }
                                className="w-full rounded-xl border border-neutral-200/60 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold tracking-[0.05em] text-neutral-400 uppercase">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    email: e.target.value,
                                }))
                            }
                            className="w-full rounded-xl border border-neutral-200/60 bg-neutral-50/50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 hover:bg-white"
                            placeholder="jane@example.com"
                        />
                    </div>

                    {/* Alerts */}
                    <div className="min-h-[24px]">
                        {error && (
                            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                                Profile updated successfully!
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-neutral-200/80 bg-white px-4 py-3.5 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 rounded-xl bg-[#0A0A0A] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-neutral-800 hover:shadow-black/40 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────
   COMPONENTS & CUSTOM MODERN ICONS
───────────────────────────────────────── */
function SidebarLink({ to, active, icon, children, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={[
                "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                active
                    ? "bg-white/10 text-[#EDEDED] shadow-sm"
                    : "text-[#888888] hover:bg-white/5 hover:text-[#EDEDED]",
            ].join(" ")}
        >
            <div className="transition-transform duration-300 group-hover:translate-x-1 flex items-center gap-4 w-full">
                {icon}
                {children}
            </div>
        </Link>
    );
}

function MenuIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}

// Custom Awwwards-style Icons (Premium 1.5 stroke width)
function DashboardIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}
function InboxIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
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
function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}
function ContentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M21 8V21H3V3H16L21 8Z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M16 3V8H21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
function FolderIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function LayersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <polygon
                points="12 2 2 7 12 12 22 7 12 2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 12 12 17 22 12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="2 17 12 22 22 17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function DocumentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="14 2 14 8 20 8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="13"
                x2="8"
                y2="13"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="16"
                y1="17"
                x2="8"
                y2="17"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="10"
                y1="9"
                x2="8"
                y2="9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ChartIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <line
                x1="18"
                y1="20"
                x2="18"
                y2="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="12"
                y1="20"
                x2="12"
                y2="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="6"
                y1="20"
                x2="6"
                y2="14"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SettingsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
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
function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="7"
                r="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SleekSearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <circle cx="11" cy="11" r="7" />
            <path
                d="M21 21l-4.35-4.35"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function SleekBellIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
        </svg>
    );
}
function LogoutIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="16 17 21 12 16 7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <line
                x1="21"
                y1="12"
                x2="9"
                y2="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ChevronRight() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M9 18l6-6-6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function ChevronDown() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
        >
            <path
                d="M6 9l6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
