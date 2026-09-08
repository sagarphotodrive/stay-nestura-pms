import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, Home, Settings } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Properties = React.lazy(() => import('./pages/Properties'));
const MasterCalendar = React.lazy(() => import('./pages/MasterCalendar'));
const Bookings = React.lazy(() => import('./pages/Bookings'));
const Guests = React.lazy(() => import('./pages/Guests'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Reports = React.lazy(() => import('./pages/Reports'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));
const PublicBooking = React.lazy(() => import('./pages/PublicBooking'));

// Main Layout Component
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname.replace(/^\/app\/?/, '').replace(/^\//, '') || 'dashboard';
    return path;
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="topbar-title">Stay Nestura PMS</div>
        <div className="topbar-actions">
          <a href="/" className="icon-btn" title="Back to Homepage">
            <Home size={20} />
          </a>
          <Link to="/settings" className="icon-btn">
            <Settings size={20} />
          </Link>
        </div>
      </header>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={getActiveTab()}
        setActiveTab={() => {}}
      />

      <main className="main-content">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/calendar" element={<MasterCalendar />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// App Component
function App() {
  return (
    <Router basename="/app">
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public, no-login booking widget — rendered without the admin Sidebar/Layout
                chrome so it can be linked or iframed from the property's own website. */}
            <Route path="/book" element={<PublicBooking />} />
            <Route path="/book/:propertyId" element={<PublicBooking />} />
            <Route path="/*" element={<Layout />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
