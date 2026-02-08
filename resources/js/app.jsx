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
import AuthPage from "./pages/Authpage";
import Projects from "./pages/Projects";          // <--- Imported here
import ProjectDetails from "./pages/ProjectDetails"; 

ReactDOM.createRoot(document.getElementById("app")).render(
  <BrowserRouter>
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} /> {/* ✅ CHANGE THIS */}
        <Route path="/contact" element={<Contact />} />
      </Route>

      <Route path="/admin/login" element={<AuthPage />} />
      
    </Routes>
  </BrowserRouter>
);
