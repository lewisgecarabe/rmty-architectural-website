import React, { useState, useEffect } from "react";

function subjectTypeLabel(type) {
  const labels = {
    project: "Project",
    service: "Service",
    about_section: "About Us",
  };
  return labels[type] ?? type;
}

function actionLabel(action) {
  const labels = {
    created: "Created",
    updated: "Updated",
    deleted: "Deleted",
  };
  return labels[action] ?? action;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    (async () => {
      setLoading(true);
      setError("");
      try {
        await fetch("/sanctum/csrf-cookie", { credentials: "include" });

        const [meRes, activitiesRes] = await Promise.all([
          fetch("/api/admin/me", { credentials: "include", headers }),
          fetch("/api/admin/profile/activities", { credentials: "include", headers }),
        ]);

        if (!cancelled && meRes.ok) {
          const meJson = await meRes.json();
          setProfile(meJson.data ?? null);
        }
        if (!cancelled && activitiesRes.ok) {
          const actJson = await activitiesRes.json();
          setActivities(Array.isArray(actJson.data) ? actJson.data : []);
        }
        if (!cancelled && !meRes.ok) {
          setError("Could not load profile.");
        }
      } catch {
        if (!cancelled) setError("Could not load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        <p className="ml-3 text-neutral-600">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error || "Profile not found."}
      </div>
    );
  }

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.name ||
    "Admin";
  const avatarSeed = profile.email || profile.id || "admin";

  return (
    <div>
      {/* Profile card - same container style as other admin pages */}
      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-md">
        <div className="flex flex-wrap items-center gap-6">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
            alt="Profile"
            className="h-24 w-24 rounded-full border-2 border-neutral-200 object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{displayName}</h1>
            <p className="mt-1 text-sm text-neutral-600">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Content changes table - same table style as Admin Management / Inquiries */}
      <div className="rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden">
        <div className="border-b border-neutral-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">Content changes</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Changes you made in Manage Content (Projects, Services, About Us)
          </p>
        </div>
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-neutral-500">
            No content changes yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {activities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-neutral-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                      {subjectTypeLabel(activity.subject_type)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-700">
                      {actionLabel(activity.action)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {activity.subject_title || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
