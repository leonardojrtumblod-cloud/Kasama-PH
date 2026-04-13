import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Initialize GA4
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_MEASUREMENT_ID) {
  ReactGA.initialize(GA_MEASUREMENT_ID);
}

function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    // Track page view in GA4
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: location.pathname });
    }
  }, [location]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteLogger />
      <Routes>
        {/* Public Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Legal Pages */}
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Admin Dashboard (Metrics & Waitlist) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
