import "./bootstrap";
import "../css/app.css";

import "leaflet/dist/leaflet.css";
import "./components/LeafletFix";

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";

import Contact from "./pages/contact";
import Services from "./pages/services"; // ✅ add this
import AuthPage from "./pages/authpage";

import AdminDashboard from "./pages/admin/dashboard";

const Home = () => <p className="text-center mt-10">Home</p>;
const Projects = () => <p className="text-center mt-10">Projects</p>;
const About = () => <p className="text-center mt-10">About</p>;

function Layout() {
  const location = useLocation();

  // Hide navbar & footer on admin/login
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminPage && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/services" element={<Services />} /> {/* ✅ now real page */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin login */}
          <Route path="/admin/login" element={<AuthPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

      {!isAdminPage && <Footer />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
);
