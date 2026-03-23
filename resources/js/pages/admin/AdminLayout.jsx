import React, { useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

/* ─────────────────────────────────────────
   ROOT LAYOUT — holds shared profile state
───────────────────────────────────────── */
export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <div className="flex">
                <AdminSidebar />
                <div className="flex-1">
                    <AdminTopbar />
                    <main className="min-h-[calc(100vh-72px)] bg-[#f3f3f3] p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

function AdminSidebar() {
    const location = useLocation();
    const [contentOpen, setContentOpen] = React.useState(false);
    const [firstName, setFirstName] = React.useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

    const isActive = (to) => location.pathname === to;

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

    React.useEffect(() => {
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
                    setFirstName(name);
                }
            } catch {
                if (!cancelled) setFirstName(null);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const mainNav = [
        { label: "Dashboard", to: "/admin/dashboard" },
        { label: "Inquiries", to: "/admin/inquiries" },
        { label: "Consultation", to: "/admin/consultations" },
    ];

    const contentNav = [
        { label: "Projects", to: "/admin/content/projects" },
        { label: "Services", to: "/admin/content/services" },
        { label: "About Us", to: "/admin/content/about" },
    ];

    const secondNav = [{ label: "Analytics", to: "/admin/analytics" }];

    const systemNav = [
        { label: "Platform Settings", to: "/admin/settings" },

        { label: "User Management", to: "/admin/users" },
        { label: "Profile", to: "/admin/profile" },
    ];

    React.useEffect(() => {
        if (location.pathname.startsWith("/admin/content")) {
            setContentOpen(true);
        }
    }, [location.pathname]);

    return (
        <aside className="w-[260px] border-r border-neutral-200 bg-white">
            <div className="px-5 py-6">
                <div className="flex items-center gap-3">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
                        alt="Admin avatar"
                        className="h-10 w-10 rounded-full border border-neutral-200"
                    />
                    <div className="leading-tight">
                        <p className="text-sm font-medium text-neutral-900">
                            Hello, {firstName != null ? firstName : "Admin"}!
                        </p>
                        <p className="text-[11px] tracking-widest text-neutral-500">
                            ADMIN
                        </p>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-200" />

            <div className="px-5 py-5">
                <p className="mb-2 text-[10px] tracking-widest text-neutral-500">
                    MAIN NAVIGATION
                </p>
                <nav className="space-y-1">
                    {mainNav.map((item) => (
                        <SidebarLink
                            key={item.to}
                            to={item.to}
                            active={isActive(item.to)}
                        >
                            <GridIcon />
                            {item.label}
                        </SidebarLink>
                    ))}
                </nav>

                <div className="my-5 border-t border-neutral-200" />

                <p className="mb-2 text-[10px] tracking-widest text-neutral-500">
                    SECOND NAVIGATION
                </p>

                <button
                    type="button"
                    onClick={() => setContentOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                >
                    <span className="inline-flex items-center gap-3">
                        <GridIcon />
                        Manage Content
                    </span>
                    <span className="text-neutral-500">
                        {contentOpen ? <ChevronDown /> : <ChevronRight />}
                    </span>
                </button>

                {contentOpen && (
                    <div className="mt-1 space-y-1 pl-8">
                        {contentNav.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={[
                                    "block rounded-md px-3 py-2 text-sm transition",
                                    isActive(item.to)
                                        ? "bg-neutral-100 text-neutral-900"
                                        : "text-neutral-700 hover:bg-neutral-100",
                                ].join(" ")}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mt-2 space-y-1">
                    {secondNav.map((item) => (
                        <SidebarLink
                            key={item.to}
                            to={item.to}
                            active={isActive(item.to)}
                        >
                            <GridIcon />
                            {item.label}
                        </SidebarLink>
                    ))}
                </div>

                <div className="my-5 border-t border-neutral-200" />

                <p className="mb-2 text-[10px] tracking-widest text-neutral-500">
                    SYSTEM / ACCOUNT
                </p>
                <nav className="space-y-1">
                    {systemNav.map((item) => (
                        <SidebarLink
                            key={item.to}
                            to={item.to}
                            active={isActive(item.to)}
                        >
                            <GridIcon />
                            {item.label}
                        </SidebarLink>
                    ))}

                    <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                        onClick={() => setShowLogoutConfirm(true)}
                    >
                        <span className="inline-flex items-center gap-3">
                            <GridIcon />
                            Logout
                        </span>
                    </button>
                </nav>
            </div>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
                        <p className="text-center text-neutral-800 font-medium">
                            Are you sure you want to logout?
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
   TOPBAR
───────────────────────────────────────── */
function AdminTopbar({ profile, onProfileUpdate }) {
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [editModalOpen, setEditModalOpen] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    React.useEffect(() => {
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

    const confirmLogout = () => {
        const token =
            localStorage.getItem("admin_token") ||
            localStorage.getItem("token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        fetch("/api/admin/logout", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }).catch(() => {});

        window.location.href = "/admin/login";
    };

    const avatarSrc =
        profile?.profile_photo_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.first_name || "admin")}`;

    return (
        <>
            <header className="h-[72px] border-b border-neutral-200 bg-white">
                <div className="mx-auto flex h-full items-center justify-between px-6">
                    <div className="text-lg font-medium tracking-wide">
                        RMTY
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder=""
                                className="h-9 w-[320px] rounded-full bg-neutral-100 pl-9 pr-4 text-sm outline-none"
                            />
                        </div>

                        {/* Bell */}
                        <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                            aria-label="Notifications"
                        >
                            <BellIcon />
                        </button>

                        {/* Profile button + dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen((v) => !v)}
                                className="inline-flex h-9 w-9 overflow-hidden rounded-full border border-neutral-200 hover:ring-2 hover:ring-neutral-300 transition-all"
                                aria-label="Profile"
                            >
                                <img
                                    src={avatarSrc}
                                    alt="Profile avatar"
                                    className="h-full w-full object-cover"
                                />
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-neutral-200 bg-white shadow-lg z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-neutral-100">
                                        <p className="text-sm font-medium text-neutral-900 truncate">
                                            {profile?.first_name
                                                ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
                                                : "Admin"}
                                        </p>
                                        <p className="text-xs text-neutral-500 truncate">
                                            {profile?.email}
                                        </p>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                setEditModalOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                                        >
                                            <PencilIcon />
                                            Edit Profile
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                setShowLogoutConfirm(true);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogoutIcon />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Edit Profile Modal */}
            {editModalOpen && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setEditModalOpen(false)}
                    onSaved={(updated) => {
                        onProfileUpdate(updated); // updates shared state → both sidebar + topbar re-render
                        setEditModalOpen(false);
                    }}
                />
            )}

            {/* Logout Confirm */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-xl">
                        <p className="text-center text-neutral-800 font-medium">
                            Are you sure you want to logout?
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                            >
                                Logout
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
    const [form, setForm] = React.useState({
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        email: profile?.email ?? "",
        profile_photo: null,
    });
    const [preview, setPreview] = React.useState(
        profile?.profile_photo_url ?? null,
    );
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);

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

    const avatarSrc =
        preview ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(form.first_name || "admin")}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                    <h2 className="text-base font-semibold text-neutral-900">
                        Edit Profile
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Avatar picker */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-neutral-200"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors"
                            >
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-neutral-500 underline hover:text-neutral-700 transition-colors"
                        >
                            Change photo
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    {/* First name */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
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
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300 transition"
                            placeholder="First name"
                        />
                    </div>

                    {/* Last name */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
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
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300 transition"
                            placeholder="Last name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                            Email
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
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300 transition"
                            placeholder="Email address"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-md">
                            Profile updated successfully!
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
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
   SIDEBAR LINK
───────────────────────────────────────── */
function SidebarLink({ to, active, children }) {
    return (
        <Link
            to={to}
            className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
                active
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100",
            ].join(" ")}
        >
            {children}
        </Link>
    );
}

function GridIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        </svg>
    );
}
function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M21 21l-4.3-4.3" />
            <circle cx="11" cy="11" r="7" />
        </svg>
    );
}
function BellIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M15 17H9" />
            <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
    );
}
function PencilIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            strokeWidth="2"
        >
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
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
            strokeWidth="2"
        >
            <path d="M9 18l6-6-6-6" />
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
            strokeWidth="2"
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}
