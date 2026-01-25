import './bootstrap';
import '../css/app.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-blue-500">
                    Hello React!
                </h1>
                <p className="mt-4 text-xl text-gray-300">
                    Running on Laravel with Tailwind CSS v4.
                </p>
            </div>
        </div>
    );
}

// This looks for <div id="app"> in your blade file
ReactDOM.createRoot(document.getElementById('app')).render(<App />);