import "./bootstrap";
import "../css/app.css";
import "leaflet/dist/leaflet.css";

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Outlet,
} from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

// Page Imports
import Home from "./pages/home";
import Contact from "./pages/contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import About from "./pages/About";
import Appointments from "./pages/Appointments";
import ClientAuthPage from "./pages/ClientAuthPage";

// Admin Imports
import ForgotPassword from "./pages/admin/ForgotPassword";
import AuthPage from "./pages/authpage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/dashboard";
import AdminBookingConsultations from "./pages/admin/AdminBookingConsultations";
import AdminContentServices from "./pages/admin/AdminContentServices";
import AdminContentProjects from "./pages/admin/AdminContentProjects";
import AdminContentAbout from "./pages/admin/AdminContentAbout";
import AdminContentContact from "./pages/admin/AdminContentContact";
import AdminContentHome from "./pages/admin/AdminContentHome";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";

const TIMEOUT_MS = 30 * 60 * 1000;

function clearSession() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_last_activity");
}

function ProtectedRoute() {
    const token =
        localStorage.getItem("admin_token") || localStorage.getItem("token");

    const lastActivity = parseInt(
        localStorage.getItem("admin_last_activity") || "0",
        10,
    );
    const isExpired =
        lastActivity > 0 && Date.now() - lastActivity > TIMEOUT_MS;

    useEffect(() => {
        if (!token) return;

        if (!localStorage.getItem("admin_last_activity")) {
            localStorage.setItem("admin_last_activity", Date.now().toString());
        }

        const stamp = () =>
            localStorage.setItem("admin_last_activity", Date.now().toString());

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "touchstart",
            "scroll",
        ];
        events.forEach((e) =>
            window.addEventListener(e, stamp, { passive: true }),
        );

        const timer = setInterval(() => {
            const last = parseInt(
                localStorage.getItem("admin_last_activity") || "0",
                10,
            );
            if (last > 0 && Date.now() - last > TIMEOUT_MS) {
                clearSession();
                window.location.replace("/admin/login");
            }
        }, 60_000);

        return () => {
            events.forEach((e) => window.removeEventListener(e, stamp));
            clearInterval(timer);
        };
    }, [token]);

    if (!token || isExpired) {
        clearSession();
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
}

ReactDOM.createRoot(document.getElementById("app")).render(
    <BrowserRouter>
        <Routes>
            <Route element={<RootLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/services" element={<Services />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/appointment" element={<Appointments />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Route>

            <Route path="/auth" element={<ClientAuthPage />} />
            <Route path="/admin/login" element={<AuthPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route
                        index
                        element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route
                        path="consultations"
                        element={<AdminBookingConsultations />}
                    />
                    <Route path="content/home" element={<AdminContentHome />} />
                    <Route
                        path="content/services"
                        element={<AdminContentServices />}
                    />
                    <Route
                        path="content/projects"
                        element={<AdminContentProjects />}
                    />
                    <Route
                        path="content/about"
                        element={<AdminContentAbout />}
                    />
                    <Route
                        path="content/contact"
                        element={<AdminContentContact />}
                    />
                    <Route path="users" element={<AdminManagement />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="inquiries" element={<AdminInquiries />} />
                    <Route
                        path="settings"
                        element={<AdminPlatformSettings />}
                    />
                </Route>
            </Route>
        </Routes>
    </BrowserRouter>,
);