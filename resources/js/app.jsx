import './bootstrap';
import '../css/app.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import Navbar from './components/navbar';
import Footer from './components/footer';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Navbar />

      {/* Main content */}
      <main className="flex-1">
        <p className="text-center mt-10">Main content </p>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
