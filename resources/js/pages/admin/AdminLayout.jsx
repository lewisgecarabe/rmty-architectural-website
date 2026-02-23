import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

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
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
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
        const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok && !cancelled) {
          const json = await res.json();
          const name = json?.data?.first_name ?? json?.data?.name?.split?.(" ")?.[0] ?? null;
          setFirstName(name);
        }
      } catch {
        if (!cancelled) setFirstName(null);
      }
    })();
    return () => { cancelled = true; };
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
            <p className="text-[11px] tracking-widest text-neutral-500">ADMIN</p>
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
            <SidebarLink key={item.to} to={item.to} active={isActive(item.to)}>
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
            <SidebarLink key={item.to} to={item.to} active={isActive(item.to)}>
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
            <SidebarLink key={item.to} to={item.to} active={isActive(item.to)}>
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

function SidebarLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
        active ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-100",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function AdminTopbar() {
  return (
    <header className="h-[72px] border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-full items-center justify-between px-6">
        <div className="text-lg font-medium tracking-wide">RMTY</div>

        <div className="flex items-center gap-4">
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

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
            aria-label="Notifications"
          >
            <BellIcon />
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 overflow-hidden rounded-full border border-neutral-200"
            aria-label="Profile"
          >
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=lewis"
              alt="Profile avatar"
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 21l-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 17H9" />
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
