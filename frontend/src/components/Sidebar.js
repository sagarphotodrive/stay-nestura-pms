import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Calendar, Users,
  IndianRupee, BarChart3, Settings, X,
  Home, RefreshCw, UserCheck
} from 'lucide-react';

// Sidebar Component
const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'properties', icon: Building2, label: 'Properties' },
    { id: 'calendar', icon: Calendar, label: 'Master Calendar' },
    { id: 'bookings', icon: UserCheck, label: 'Bookings' },
    { id: 'guests', icon: Users, label: 'Guests' },
    { id: 'expenses', icon: IndianRupee, label: 'Expenses' },
    { id: 'reports', icon: BarChart3, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Home size={24} />
            <span>Stay Nestura</span>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={`/${item.id === 'dashboard' ? '' : item.id}`}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); onClose(); }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sync-status">
            <RefreshCw size={16} className="sync-icon" />
            <span>Synced 30s ago</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
