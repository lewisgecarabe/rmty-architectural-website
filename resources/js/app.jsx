import './bootstrap';
import '../css/app.css';

// Map for Contact Page
import "leaflet/dist/leaflet.css";
import "./components/LeafletFix";

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/navbar';
import Footer from './components/footer';

import Contact from './pages/contact';
import AuthPage from './pages/authpage';

// Temporary placeholders so routes won't error
const Home = () => <p className="text-center mt-10">Home</p>;
const Projects = () => <p className="text-center mt-10">Projects</p>;
const Services = () => <p className="text-center mt-10">Services</p>;
const About = () => <p className="text-center mt-10">About</p>;

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AuthPage />} />
          <Route path="/admin/signup" element={<AuthPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
