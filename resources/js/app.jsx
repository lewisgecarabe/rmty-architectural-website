import "./Bootstrap";
import "../css/app.css";
import "leaflet/dist/leaflet.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

// Page Imports
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import About from "./pages/About";

// Admin Imports
import ForgotPassword from "./pages/admin/ForgotPassword";

import AuthPage from "./pages/AuthPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookingConsultations from "./pages/admin/AdminBookingConsultations";
import AdminContentServices from "./pages/admin/AdminContentServices";
import AdminContentProjects from "./pages/admin/AdminContentProjects";
import AdminContentAbout from "./pages/admin/AdminContentAbout";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";

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
            </Route>

            <Route path="/admin/login" element={<AuthPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />

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
                <Route
                    path="content/services"
                    element={<AdminContentServices />}
                />
                <Route
                    path="content/projects"
                    element={<AdminContentProjects />}
                />
                <Route path="content/about" element={<AdminContentAbout />} />
                <Route path="users" element={<AdminManagement />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="inquiries" element={<AdminInquiries />} />
                <Route path="settings" element={<AdminPlatformSettings />} />
            </Route>
        </Routes>
    </BrowserRouter>,
);
