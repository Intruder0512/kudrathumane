import React from 'react';
import { Route, Routes, BrowserRouter as Router, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';

import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import HomePage from '@/pages/HomePage.jsx';
import DogsPage from '@/pages/DogsPage.jsx';
import DogProfilePage from '@/pages/DogProfilePage.jsx';
import VirtualAdoptionPage from '@/pages/VirtualAdoptionPage.jsx';
import FosteringPage from '@/pages/FosteringPage.jsx';
import FundraisingPage from '@/pages/FundraisingPage.jsx';
import ContactPage from '@/pages/ContactPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import AdoptionSuccessPage from '@/pages/AdoptionSuccessPage.jsx';
import FosterPortalPage from '@/pages/FosterPortalPage.jsx';
import LostFoundPage from '@/pages/LostFoundPage.jsx';

// Simple Route Change Logger
const RouteLogger = () => {
  const location = React.useRef(window.location.pathname);
  React.useEffect(() => {
    if (location.current !== window.location.pathname) {
      console.log(`Route changed: ${location.current} -> ${window.location.pathname}`);
      location.current = window.location.pathname;
    }
  });
  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <RouteLogger />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/dogs" element={<DogsPage />} />
          <Route path="/dogs/:dogId" element={<DogProfilePage />} />
          <Route path="/adoption" element={<VirtualAdoptionPage />} />
          <Route path="/adoption/success" element={<AdoptionSuccessPage />} />
          <Route path="/fostering" element={<FosteringPage />} />
          <Route path="/fundraising" element={<FundraisingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/lost-and-found" element={<LostFoundPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/foster-portal"
            element={
              <ProtectedRoute>
                <FosterPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
      <h2 className="text-3xl font-semibold mb-4">Page not found</h2>
      <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button size="lg">Back to Home</Button>
      </Link>
    </div>
  </div>
);

export default App;