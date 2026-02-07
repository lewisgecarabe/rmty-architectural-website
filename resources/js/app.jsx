import "./Bootstrap";
import "../css/app.css";
import "leaflet/dist/leaflet.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import RootLayout from "./layouts/RootLayout"; 

// Page Imports
import Home from "./pages/Home";       
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Projects from "./pages/Projects";          
import ProjectDetails from "./pages/ProjectDetails"; 

// Admin Imports
import AuthPage from "./pages/Authpage";
import AdminDashboard from "./pages/admin/Dashboard";

ReactDOM.createRoot(document.getElementById("app")).render(
  <BrowserRouter>
    <Routes>
      
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} /> 
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<p className="text-center mt-32">About</p>} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/admin/login" element={<AuthPage />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/inquiries" element={<AdminDashboard />} />
      <Route path="/admin/consultations" element={<AdminDashboard />} />
      
    </Routes>
  </BrowserRouter>
);