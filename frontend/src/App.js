import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  LayoutDashboard, Building2, Calendar, Users,
  IndianRupee, BarChart3, Settings, Bell, Menu, X,
  Plus, Search, ChevronRight, Home, LogOut,
  RefreshCw, TrendingUp, UserCheck,
  UserX, AlertCircle, CheckCircle, Clock, Link2, Trash2, ExternalLink, Edit3,
  Download, Upload, Copy
} from 'lucide-react';

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || '/api';
const socket = io(window.location.origin);

// Auth Context
const AuthContext = createContext(null);

// API Helper
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Components
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ backgroundColor: color }}>
      <Icon size={20} />
    </div>
    <div className="stat-content">
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
      {change && <span className="stat-change">{change}</span>}
    </div>
  </div>
);

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Stay Nestura</h1>
          <p>Properties Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Sign In
          </button>
        </form>
        <div className="login-demo">
          <p>Demo: demo@nestura.com / password</p>
        </div>
      </div>
    </div>
  );
};

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

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    socket.on('booking:created', fetchDashboard);
    socket.on('booking:updated', fetchDashboard);
    return () => {
      socket.off('booking:created', fetchDashboard);
      socket.off('booking:updated', fetchDashboard);
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your property overview.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Today's Check-ins"
          value={stats?.today?.today_checkins || 0}
          icon={UserCheck}
          color="#10b981"
        />
        <StatCard
          title="Today's Check-outs"
          value={stats?.today?.today_checkouts || 0}
          icon={LogOut}
          color="#f59e0b"
        />
        <StatCard
          title="Month Revenue"
          value={`₹${(stats?.month?.net_revenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="#3b82f6"
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pending?.length || 0}
          icon={AlertCircle}
          color="#ef4444"
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>Occupancy Rate</h3>
          </div>
          <div className="card-content">
            {stats?.occupancy?.map((prop) => (
              <div key={prop.name} className="occupancy-item">
                <span className="occupancy-name">{prop.name}</span>
                <div className="occupancy-bar">
                  <div
                    className="occupancy-fill"
                    style={{ width: `${prop.occupancy}%` }}
                  />
                </div>
                <span className="occupancy-percent">{prop.occupancy}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Upcoming Bookings</h3>
            <Link to="/bookings" className="view-all">View All</Link>
          </div>
          <div className="card-content">
            {stats?.upcoming?.length > 0 ? (
              stats.upcoming.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-info">
                    <span className="booking-guest">{booking.first_name || ''} {booking.last_name || ''}</span>
                    <span className="booking-property">{booking.property_name || 'Unknown'}</span>
                  </div>
                  <div className="booking-date">
                    {format(new Date(booking.check_in), 'MMM dd')}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No upcoming bookings</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/bookings?action=new" className="action-btn">
            <Plus size={20} />
            <span>New Booking</span>
          </Link>
          <Link to="/calendar" className="action-btn">
            <Calendar size={20} />
            <span>View Calendar</span>
          </Link>
          <Link to="/guests" className="action-btn">
            <Users size={20} />
            <span>Add Guest</span>
          </Link>
          <Link to="/reports" className="action-btn">
            <BarChart3 size={20} />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Properties Component
const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { name: '', property_type: 'Bungalow - 1 BHK', address: '', city: '', state: 'Maharashtra', pincode: '', total_rooms: 1, max_guests: 2, base_price: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => {
    if (searchParams.get('action') === 'new') { openAdd(); setSearchParams({}, { replace: true }); }
  }, []);

  const fetchProperties = async () => {
    try { const res = await api.get('/properties'); setProperties(res.data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => { setEditId(p.id); setForm({ name: p.name, property_type: p.property_type, address: p.address, city: p.city, state: p.state, pincode: p.pincode, total_rooms: p.total_rooms, max_guests: p.max_guests, base_price: p.base_price, description: p.description || '' }); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, base_price: parseFloat(form.base_price), total_rooms: parseInt(form.total_rooms), max_guests: parseInt(form.max_guests) };
    try {
      if (editId) { await api.put(`/properties/${editId}`, data); } else { await api.post('/properties', data); }
      setShowForm(false); setForm(emptyForm); setEditId(null); fetchProperties();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this property?')) return;
    try { await api.delete(`/properties/${id}`); fetchProperties(); } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="properties-page">
      <div className="page-header">
        <h1>Properties</h1>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Add Property</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Property' : 'Add New Property'}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>Property Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sunset Homestay"/></div>
              <div className="form-row">
                <div className="form-group"><label>Type</label><select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}><option>Bungalow - 1 BHK</option><option>Bungalow - 2 BHK</option><option>Bungalow - 3 BHK</option><option>Bungalow - 4 BHK</option><option>Single Room</option><option>Homestay</option><option>Villa</option><option>Apartment</option></select></div>
                <div className="form-group"><label>Base Price (per night) *</label><input required type="number" value={form.base_price} onChange={e => setForm({...form, base_price: e.target.value})} placeholder="e.g. 2500"/></div>
              </div>
              <div className="form-group"><label>Address *</label><input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address"/></div>
              <div className="form-row">
                <div className="form-group"><label>City *</label><input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City"/></div>
                <div className="form-group"><label>State</label><input value={form.state} onChange={e => setForm({...form, state: e.target.value})}/></div>
                <div className="form-group"><label>Pincode</label><input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Total Rooms</label><input type="number" min="1" value={form.total_rooms} onChange={e => setForm({...form, total_rooms: e.target.value})}/></div>
                <div className="form-group"><label>Max Guests</label><input type="number" min="1" value={form.max_guests} onChange={e => setForm({...form, max_guests: e.target.value})}/></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the property" rows="3"/></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Property'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="properties-grid">
        {properties.map((property) => (
          <div key={property.id} className="property-card" style={{ position: 'relative' }}>
            <div className="card-actions">
              <button className="card-edit-btn" onClick={() => openEdit(property)} title="Edit"><Edit3 size={14} /></button>
              <button className="card-edit-btn" onClick={() => handleDelete(property.id)} title="Delete"><Trash2 size={14} /></button>
            </div>
            <div className="property-image">
              <Building2 size={40} />
            </div>
            <div className="property-info">
              <h3>{property.name}</h3>
              <p className="property-type">{property.property_type}</p>
              <div className="property-details">
                <span><Building2 size={14} /> {property.total_rooms} rooms</span>
                <span><Users size={14} /> {property.max_guests} guests</span>
              </div>
              <div className="property-price">
                <span className="price">₹{property.base_price}</span>
                <span className="per-night">/night</span>
              </div>
            </div>
            <div className="property-stats">
              <div className="stat">
                <span className="stat-label">Current</span>
                <span className="stat-value">{property.current_bookings || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Month</span>
                <span className="stat-value">₹{parseFloat(property.month_revenue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Master Calendar Component
const generateBookingWhatsAppMsg = (b, prop) => {
  const ciDate = format(new Date(b.check_in), 'd MMMM');
  const coDate = format(new Date(b.check_out), 'd MMMM');
  const total = parseFloat(b.gross_amount || b.net_amount || 0);
  const advance = parseFloat(b.paid_amount || 0);
  const balance = total - advance;
  const guestCount = [];
  if (b.adults) guestCount.push(`${b.adults} Adult${b.adults > 1 ? 's' : ''}`);
  if (b.children) guestCount.push(`${b.children} Child${b.children > 1 ? 'ren' : ''}`);
  const checkInTime = b.check_in_time || '4:00 PM';
  const checkOutTime = b.check_out_time || '2:00 PM';
  let paymentLine = `Total ₹${total.toLocaleString('en-IN')}`;
  if (advance > 0 && balance > 0) {
    paymentLine += ` | Advance ₹${advance.toLocaleString('en-IN')}\nBalance ₹${balance.toLocaleString('en-IN')} (payable at check-in)`;
  } else if (advance >= total) {
    paymentLine += ` | Fully Paid ✓`;
  } else {
    paymentLine += ` (payable at check-in)`;
  }
  const locationLine = b.google_maps_link || (prop && prop.google_maps_link) || '';
  const propName = b.property_name || (prop && prop.name) || 'Stay Nestura';
  let msg = `*Booking Confirmed – ${propName} by Stay Nestura*\n\n`;
  msg += `Guest: ${b.first_name} ${b.last_name || ''}\n`;
  msg += `Guests: ${guestCount.join(', ') || '1 Adult'}\n\n`;
  msg += `Check-in: ${ciDate} | ${checkInTime} onwards\n`;
  msg += `Check-out: ${coDate} | ${checkOutTime}\n\n`;
  msg += `Payment:\n${paymentLine}\n`;
  if (locationLine) msg += `\nLocation:\n${locationLine}\n`;
  msg += `\n*MANDATORY before check-in*\nPlease complete online check-in:\nhttps://bnbhost.in/staynestura\n`;
  const isSolapurGroup = [3, 5, 6].includes(b.property_id);
  const contactNo = isSolapurGroup ? '9766504266' : '7499075244';
  const emergencyNo = isSolapurGroup ? '8308122281' : '9766504266';
  msg += `\nContact: ${contactNo}\nEmergency: ${emergencyNo}\n`;
  msg += `\n*House Rules:*\n`;
  msg += `• Kitchen utensils must be cleaned before check-out.\n  (₹250 charge if maid service required for utensils only. ₹500 for house cleaning if staying less than 3 days. For more than 3 days, every third day room service will be provided.)\n`;
  msg += `• Please use water & electricity wisely — Turn off taps and shower in time and don't let water just flow away as we receive corporation water supply once in 5 days!! Switch off all appliances and lights when they are not in use.\n`;
  msg += `• This is a homestay, not a hotel, so kindly take care of it and treat it as your own home. 😊\n`;
  msg += `\nTeam ${propName} by Stay Nestura`;
  return msg;
};

const openWhatsApp = (b, prop) => {
  const msg = generateBookingWhatsAppMsg(b, prop);
  const phone = (b.phone || '').replace(/\D/g, '');
  const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
};

const copyBookingMessage = (b, prop) => {
  const msg = generateBookingWhatsAppMsg(b, prop);
  navigator.clipboard.writeText(msg).then(() => alert('Booking message copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = msg; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Booking message copied!');
  });
};

const PROPERTY_COLOR_MAP = {
  'torna':     { bg: 'rgba(16, 185, 129, 0.20)', border: 'rgba(16, 185, 129, 0.15)', badge: '#10b981' },    // Green
  'shivneri':  { bg: 'rgba(245, 158, 11, 0.20)', border: 'rgba(245, 158, 11, 0.15)', badge: '#f59e0b' },    // Orange
  'homestay 1':{ bg: 'rgba(59, 130, 246, 0.20)', border: 'rgba(59, 130, 246, 0.15)', badge: '#3b82f6' },    // Blue (1BHK)
  'homestay 2':{ bg: 'rgba(239, 68, 68, 0.20)',  border: 'rgba(239, 68, 68, 0.15)',  badge: '#ef4444' },    // Red (Rajlaxmi)
  'single':    { bg: 'rgba(236, 72, 153, 0.20)', border: 'rgba(236, 72, 153, 0.15)', badge: '#ec4899' },    // Pink (SR1)
  'deluxe':    { bg: 'rgba(168, 85, 247, 0.20)', border: 'rgba(168, 85, 247, 0.15)', badge: '#a855f7' },    // Purple (SR2)
};
const DEFAULT_COLOR = { bg: 'rgba(148, 163, 184, 0.20)', border: 'rgba(148, 163, 184, 0.15)', badge: '#94a3b8' };
const getPropertyColor = (name) => {
  const n = (name || '').toLowerCase();
  for (const [key, color] of Object.entries(PROPERTY_COLOR_MAP)) {
    if (n.includes(key)) return color;
  }
  return DEFAULT_COLOR;
};

const MasterCalendar = () => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return addDays(d, -1); });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [icalLinks, setIcalLinks] = useState([]);
  const [showIcalSection, setShowIcalSection] = useState(false);
  const [icalForm, setIcalForm] = useState({ property_id: '', channel: 'airbnb', ical_url: '', label: '' });
  const navigate = useNavigate();
  const days = Array.from({ length: 32 }, (_, i) => addDays(viewDate, i));

  useEffect(() => {
    fetchData();
  }, [viewDate]);

  const fetchData = async () => {
    try {
      const [propRes, bookingRes, icalRes] = await Promise.all([
        api.get('/properties'),
        api.get('/bookings', {
          params: {
            start_date: format(days[0], 'yyyy-MM-dd'),
            end_date: format(days[days.length - 1], 'yyyy-MM-dd')
          }
        }),
        api.get('/ical-links')
      ]);
      setProperties(propRes.data);
      setBookings(bookingRes.data.bookings || []);
      setIcalLinks(icalRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBookingForDate = (propertyId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.find(b =>
      b.property_id === propertyId &&
      b.check_in <= dateStr &&
      b.check_out > dateStr &&
      b.booking_status !== 'cancelled'
    );
  };

  const handleAddIcalLink = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ical-links', { ...icalForm, property_id: parseInt(icalForm.property_id) });
      setIcalForm({ property_id: '', channel: 'airbnb', ical_url: '', label: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteIcalLink = async (id) => {
    try { await api.delete(`/ical-links/${id}`); fetchData(); } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Master Calendar</h1>
        <div className="calendar-nav">
          <button onClick={() => setViewDate(addDays(viewDate, -7))}>&lt; Previous</button>
          <button className="btn btn-sm btn-secondary" onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setViewDate(addDays(d, -1)); }}>Today</button>
          <span>{format(days[0], 'd MMM')} – {format(days[days.length - 1], 'd MMM yyyy')}</span>
          <button onClick={() => setViewDate(addDays(viewDate, 7))}>Next &gt;</button>
        </div>
      </div>

      <div className="master-calendar">
        <div className="calendar-header">
          <div className="property-col">Property</div>
          {days.map(day => (
            <div key={day.toISOString()} className={`day-col ${format(day, 'EEE') === 'Sun' ? 'weekend' : ''}`}>
              <span className="day-name">{format(day, 'EEE')}</span>
              <span className="day-num">{format(day, 'd MMM')}</span>
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {properties.map((property, propIdx) => {
            const color = getPropertyColor(property.name);
            return (
            <div key={property.id} className="calendar-row">
              <div className="property-col" style={{ borderLeft: `4px solid ${color.badge}` }}>{property.name}</div>
              {days.map(day => {
                const booking = getBookingForDate(property.id, day);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div
                    key={day.toISOString()}
                    className={`day-cell ${booking ? 'booked' : 'available-click'} ${isToday ? 'today' : ''}`}
                    style={booking ? { background: color.bg, borderRightColor: color.border, cursor: 'pointer' } : { cursor: 'pointer' }}
                    onClick={() => {
                      if (booking) {
                        setSelectedBooking(booking);
                      } else {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const nextDay = format(addDays(day, 1), 'yyyy-MM-dd');
                        navigate(`/bookings?property_id=${property.id}&check_in=${dateStr}&check_out=${nextDay}&nightly_rate=${property.base_price}`);
                      }
                    }}
                    title={booking ? `${booking.first_name} ${booking.last_name} - ${booking.channel}` : `Click to book ${property.name} on ${format(day, 'MMM dd')}`}
                  >
                    {booking ? (
                      <div className="booking-badge" style={{ background: color.badge }} title={`${booking.first_name} ${booking.last_name}`}>
                        {booking.first_name?.[0]}
                      </div>
                    ) : (
                      <div className="empty-cell-plus">+</div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>Booked</span>
        </div>
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Today</span>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}><X size={20}/></button>
            </div>
            <div className="booking-detail-modal">
              <div className="detail-row">
                <span className="detail-label">Guest</span>
                <span className="detail-value">{selectedBooking.first_name} {selectedBooking.last_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Property</span>
                <span className="detail-value">{selectedBooking.property_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Check-in</span>
                <span className="detail-value">{format(new Date(selectedBooking.check_in), 'MMM dd, yyyy')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Check-out</span>
                <span className="detail-value">{format(new Date(selectedBooking.check_out), 'MMM dd, yyyy')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Channel</span>
                <span className="detail-value">{selectedBooking.channel}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className="detail-value">₹{parseFloat(selectedBooking.net_amount || 0).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${selectedBooking.booking_status}`}>{(selectedBooking.booking_status || '').replace(/-/g, ' ')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment</span>
                <span className="detail-value">{selectedBooking.payment_status} ({selectedBooking.payment_method || 'N/A'})</span>
              </div>
              {selectedBooking.special_requests && (
                <div className="detail-row">
                  <span className="detail-label">Requests</span>
                  <span className="detail-value">{selectedBooking.special_requests}</span>
                </div>
              )}
              <div className="form-actions" style={{ marginTop: '16px', gap: '8px' }}>
                <button className="btn btn-whatsapp" onClick={() => openWhatsApp(selectedBooking)}>WhatsApp</button>
                <button className="btn btn-secondary" onClick={() => copyBookingMessage(selectedBooking)}><Copy size={14} /> Copy</button>
                <button className="btn btn-primary" onClick={() => { setSelectedBooking(null); navigate('/bookings'); }}>
                  View All Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTA Calendar Links Section */}
      <div className="ical-section">
        <div className="ical-header" onClick={() => setShowIcalSection(!showIcalSection)} style={{ cursor: 'pointer' }}>
          <h3><Link2 size={18} /> OTA Calendar Links</h3>
          <span>{showIcalSection ? '▲' : '▼'}</span>
        </div>
        {showIcalSection && (
          <div className="ical-content">
            {properties.map(prop => {
              const propLinks = icalLinks.filter(l => l.property_id === prop.id);
              const propSlug = prop.name.toLowerCase().replace(/\s+by\s+stay\s+nestura/i, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
              const exportUrl = `${window.location.origin}/api/properties/${propSlug}/ical.ics`;
              return (
                <div key={prop.id} className="ical-property">
                  <h4>{prop.name}</h4>
                  <div className="ical-export-url">
                    <span className="channel-tag direct">Export Feed</span>
                    <input readOnly value={exportUrl} className="ical-url-input" onClick={e => e.target.select()} />
                    <button className="btn-icon-sm" title="Copy URL" onClick={() => { navigator.clipboard.writeText(exportUrl); }}><Copy size={14} /></button>
                    <a href={exportUrl} target="_blank" rel="noopener noreferrer" className="ical-url-link" title="Preview"><ExternalLink size={14} /></a>
                  </div>
                  {propLinks.length > 0 ? (
                    <div className="ical-links-list">
                      {propLinks.map(link => (
                        <div key={link.id} className="ical-link-item">
                          <span className={`channel-tag ${link.channel}`}>{link.channel}</span>
                          <span className="ical-label">{link.label}</span>
                          {link.ical_url && (
                            <a href={link.ical_url} target="_blank" rel="noopener noreferrer" className="ical-url-link"><ExternalLink size={14} /></a>
                          )}
                          <button className="btn-icon-sm" onClick={() => deleteIcalLink(link.id)}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state-sm">No OTA calendar links imported yet</p>
                  )}
                </div>
              );
            })}
            <form onSubmit={handleAddIcalLink} className="ical-add-form">
              <h4>Add Calendar Link</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Property</label>
                  <select required value={icalForm.property_id} onChange={e => setIcalForm({...icalForm, property_id: e.target.value})}>
                    <option value="">Select property</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>OTA Channel</label>
                  <select value={icalForm.channel} onChange={e => setIcalForm({...icalForm, channel: e.target.value})}>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking.com">Booking.com</option>
                    <option value="agoda">Agoda</option>
                    <option value="makemytrip">MakeMyTrip</option>
                    <option value="goibibo">Goibibo</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>iCal URL</label>
                  <input value={icalForm.ical_url} onChange={e => setIcalForm({...icalForm, ical_url: e.target.value})} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Label</label>
                  <input value={icalForm.label} onChange={e => setIcalForm({...icalForm, label: e.target.value})} placeholder="e.g. Airbnb - My Property" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Add Link</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Bookings Component
const Bookings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [filterProperty, setFilterProperty] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [hidePast, setHidePast] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const emptyBForm = { property_id: '', first_name: '', last_name: '', phone: '', email: '', check_in: '', check_out: '', adults: 1, children: 0, nightly_rate: '', channel: 'direct', payment_method: 'UPI', special_requests: '', advance_paid: 0 };
  const [bForm, setBForm] = useState(emptyBForm);

  // Auto-open prefilled form from calendar click or homepage action=new
  useEffect(() => {
    const pid = searchParams.get('property_id');
    const ci = searchParams.get('check_in');
    const co = searchParams.get('check_out');
    const rate = searchParams.get('nightly_rate');
    const action = searchParams.get('action');
    if (pid && ci) {
      setBForm(prev => ({ ...prev, property_id: pid, check_in: ci, check_out: co || '', nightly_rate: rate || '' }));
      api.get('/properties').then(res => {
        setProperties(res.data || []);
        setShowForm(true);
      }).catch(() => {});
      setSearchParams({}, { replace: true });
    } else if (action === 'new') {
      openForm();
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Auto-open booking edit when view param is set
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && allBookings.length > 0) {
      const booking = allBookings.find(b => String(b.id) === viewId);
      if (booking) { openEdit(booking); setSearchParams({}, { replace: true }); }
    }
  }, [allBookings]);

  useEffect(() => {
    // Apply all filters client-side
    let filtered = [...allBookings];
    if (filter !== 'all') filtered = filtered.filter(b => b.booking_status === filter);
    if (filterProperty) filtered = filtered.filter(b => b.property_id === parseInt(filterProperty));
    if (filterChannel) filtered = filtered.filter(b => b.channel === filterChannel);
    if (filterDateFrom) filtered = filtered.filter(b => b.check_in >= filterDateFrom);
    if (filterDateTo) filtered = filtered.filter(b => b.check_out <= filterDateTo);
    if (hidePast) { const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0]; filtered = filtered.filter(b => b.check_out >= today); }
    filtered.sort((a, b) => hidePast ? a.check_in.localeCompare(b.check_in) : b.check_in.localeCompare(a.check_in));
    setBookings(filtered);
  }, [filter, filterProperty, filterChannel, filterDateFrom, filterDateTo, hidePast, allBookings]);

  const fetchBookings = async () => {
    try {
      const [bRes, pRes] = await Promise.all([api.get('/bookings', { params: { limit: 500 } }), api.get('/properties')]);
      setAllBookings(bRes.data.bookings || []);
      setProperties(pRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check availability when property and dates change
  const checkAvailability = useCallback(async () => {
    if (bForm.property_id && bForm.check_in && bForm.check_out) {
      try {
        const params = { property_id: bForm.property_id, check_in: bForm.check_in, check_out: bForm.check_out };
        if (editId) params.exclude_booking_id = editId;
        const res = await api.get('/bookings/check-availability', { params });
        setAvailabilityStatus(res.data);
      } catch (err) { setAvailabilityStatus(null); }
    } else {
      setAvailabilityStatus(null);
    }
  }, [bForm.property_id, bForm.check_in, bForm.check_out, editId]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const openForm = async () => {
    try {
      const pRes = await api.get('/properties');
      setProperties(pRes.data || []);
      setEditId(null);
      setShowForm(true);
    } catch (err) { console.error(err); }
  };

  const openEdit = async (b) => {
    try {
      const pRes = await api.get('/properties');
      setProperties(pRes.data || []);
    } catch (err) {}
    setEditId(b.id);
    setBForm({ property_id: String(b.property_id), first_name: b.first_name || '', last_name: b.last_name || '', phone: b.phone || '', email: b.email || '', check_in: b.check_in, check_out: b.check_out, adults: b.adults || 1, children: b.children || 0, nightly_rate: b.nightly_rate || '', channel: b.channel || 'direct', payment_method: b.payment_method || 'UPI', special_requests: b.special_requests || '', advance_paid: b.paid_amount || 0 });
    setShowForm(true);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (availabilityStatus && !availabilityStatus.available) {
      alert('Cannot save booking: dates conflict with an existing booking.\n\n' + availabilityStatus.conflicts.map(c => `• ${c.guest_name} (${c.check_in} to ${c.check_out})`).join('\n'));
      return;
    }
    try {
      const nights = Math.max(1, Math.ceil((new Date(bForm.check_out) - new Date(bForm.check_in)) / 86400000));
      const gross = parseFloat(bForm.nightly_rate) * nights;
      const advancePaid = parseFloat(bForm.advance_paid) || 0;
      const data = { ...bForm, property_id: parseInt(bForm.property_id), nightly_rate: parseFloat(bForm.nightly_rate), gross_amount: gross, adults: parseInt(bForm.adults), children: parseInt(bForm.children), paid_amount: advancePaid, pending_amount: gross - advancePaid, payment_status: advancePaid >= gross ? 'paid' : advancePaid > 0 ? 'partial' : 'pending' };
      if (editId) { await api.put(`/bookings/${editId}`, data); } else { await api.post('/bookings', data); }
      setShowForm(false);
      setBForm(emptyBForm);
      setEditId(null);
      setAvailabilityStatus(null);
      fetchBookings();
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  const recordPayment = async (booking) => {
    const pending = (booking.pending_amount || booking.gross_amount || 0);
    const amount = prompt(`Balance due: ₹${pending.toLocaleString()}\nEnter amount received:`, pending);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    try {
      await api.patch(`/bookings/${booking.id}/payment`, { amount: parseFloat(amount) });
      fetchBookings();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Bookings</h1>
        <button className="btn btn-primary" onClick={openForm}>
          <Plus size={18} />
          New Booking
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Booking' : 'New Booking'}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleBooking} className="modal-form">
              <div className="form-group"><label>Property *</label><select required value={bForm.property_id} onChange={e => { const p = properties.find(pr => pr.id === parseInt(e.target.value)); setBForm({...bForm, property_id: e.target.value, nightly_rate: p ? p.base_price : bForm.nightly_rate}); }}><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.base_price}/night</option>)}</select></div>

              <h4 style={{ margin: '12px 0 8px', color: '#94a3b8', fontSize: '14px' }}>Guest Details</h4>
              <div className="form-row">
                <div className="form-group"><label>First Name *</label><input required value={bForm.first_name} onChange={e => setBForm({...bForm, first_name: e.target.value})} placeholder="First name"/></div>
                <div className="form-group"><label>Last Name *</label><input required value={bForm.last_name} onChange={e => setBForm({...bForm, last_name: e.target.value})} placeholder="Last name"/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone *</label><input required value={bForm.phone} onChange={e => setBForm({...bForm, phone: e.target.value})} placeholder="10-digit mobile"/></div>
                <div className="form-group"><label>Email</label><input type="email" value={bForm.email} onChange={e => setBForm({...bForm, email: e.target.value})} placeholder="Email address"/></div>
              </div>

              <h4 style={{ margin: '12px 0 8px', color: '#94a3b8', fontSize: '14px' }}>Booking Details</h4>
              <div className="form-row">
                <div className="form-group"><label>Check-in *</label><input required type="date" value={bForm.check_in} onChange={e => setBForm({...bForm, check_in: e.target.value})}/></div>
                <div className="form-group"><label>Check-out *</label><input required type="date" value={bForm.check_out} onChange={e => setBForm({...bForm, check_out: e.target.value})}/></div>
              </div>

              {/* Availability Check Indicator */}
              {availabilityStatus && (
                <div className={`availability-indicator ${availabilityStatus.available ? 'available' : 'conflict'}`}>
                  {availabilityStatus.available ? (
                    <><CheckCircle size={16} /> Dates are available</>
                  ) : (
                    <><AlertCircle size={16} /> Conflict: Overlaps with {availabilityStatus.conflicts.map(c => `${c.guest_name} (${c.check_in} to ${c.check_out})`).join(', ')}</>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group"><label>Adults</label><input type="number" min="1" value={bForm.adults} onChange={e => setBForm({...bForm, adults: e.target.value})}/></div>
                <div className="form-group"><label>Children</label><input type="number" min="0" value={bForm.children} onChange={e => setBForm({...bForm, children: e.target.value})}/></div>
                <div className="form-group"><label>Channel</label><select value={bForm.channel} onChange={e => setBForm({...bForm, channel: e.target.value})}><option value="direct">Offline</option><option value="airbnb">Airbnb</option><option value="booking.com">Booking.com</option><option value="makemytrip">MakeMyTrip</option><option value="goibibo">Goibibo</option></select></div>
              </div>

              <h4 style={{ margin: '12px 0 8px', color: '#94a3b8', fontSize: '14px' }}>Payment Details</h4>
              <div className="form-row">
                <div className="form-group"><label>Nightly Rate (₹) *</label><input required type="number" value={bForm.nightly_rate} onChange={e => setBForm({...bForm, nightly_rate: e.target.value})} placeholder="e.g. 2500"/></div>
                <div className="form-group"><label>Total Amount (₹)</label><input type="text" readOnly value={bForm.nightly_rate && bForm.check_in && bForm.check_out ? `₹${(parseFloat(bForm.nightly_rate) * Math.max(1, Math.ceil((new Date(bForm.check_out) - new Date(bForm.check_in)) / 86400000))).toLocaleString()}` : 'Fill dates & rate'} style={{ background: '#1e293b', color: '#e2e8f0', fontWeight: 600 }}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Advance Paid (₹)</label><input type="number" min="0" value={bForm.advance_paid} onChange={e => setBForm({...bForm, advance_paid: e.target.value})} placeholder="0"/></div>
                <div className="form-group"><label>Balance Due (₹)</label><input type="text" readOnly value={bForm.nightly_rate && bForm.check_in && bForm.check_out ? (() => { const t = parseFloat(bForm.nightly_rate) * Math.max(1, Math.ceil((new Date(bForm.check_out) - new Date(bForm.check_in)) / 86400000)); const b = t - (parseFloat(bForm.advance_paid) || 0); return `₹${b.toLocaleString()}`; })() : 'Fill dates & rate'} style={{ background: '#1e293b', fontWeight: 600, color: bForm.nightly_rate && bForm.check_in && bForm.check_out && (parseFloat(bForm.nightly_rate) * Math.max(1, Math.ceil((new Date(bForm.check_out) - new Date(bForm.check_in)) / 86400000)) - (parseFloat(bForm.advance_paid) || 0)) > 0 ? '#ef4444' : '#10b981' }}/></div>
                <div className="form-group"><label>Payment Method</label><select value={bForm.payment_method} onChange={e => setBForm({...bForm, payment_method: e.target.value})}><option value="UPI">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></select></div>
              </div>
              <div className="form-group"><label>Special Requests</label><textarea value={bForm.special_requests} onChange={e => setBForm({...bForm, special_requests: e.target.value})} rows="2" placeholder="Any special requests..."/></div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!editId && availabilityStatus && !availabilityStatus.available}>{editId ? 'Save Changes' : 'Create Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>Confirmed</button>
        <button className={`filter-btn ${filter === 'checked_in' ? 'active' : ''}`} onClick={() => setFilter('checked_in')}>Checked In</button>
        <button className={`filter-btn ${filter === 'checked_out' ? 'active' : ''}`} onClick={() => setFilter('checked_out')}>Checked Out</button>
        <button className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`} onClick={() => setFilter('cancelled')}>Cancelled</button>
      </div>
      <div className="filter-bar">
        <div className="filter-group">
          <label>Property</label>
          <select value={filterProperty} onChange={e => setFilterProperty(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Channel</label>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
            <option value="">All Channels</option>
            <option value="direct">Offline</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking.com">Booking.com</option>
            <option value="makemytrip">MakeMyTrip</option>
            <option value="goibibo">Goibibo</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>
        {(filterProperty || filterChannel || filterDateFrom || filterDateTo) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setFilterProperty(''); setFilterChannel(''); setFilterDateFrom(''); setFilterDateTo(''); }} style={{ alignSelf: 'flex-end' }}>Clear Filters</button>
        )}
      </div>

      <div className="bookings-toolbar">
        <div className="bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</div>
        <label className="toggle-switch">
          <input type="checkbox" checked={hidePast} onChange={() => setHidePast(!hidePast)} />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Hide past bookings</span>
        </label>
      </div>

      <div className="bookings-list">
        {bookings.map(booking => (
          <div key={booking.id} className="booking-card">
            <div className="booking-main">
              <div className="booking-guest-info">
                <h3>{booking.first_name} {booking.last_name}</h3>
                <p>{booking.property_name}</p>
              </div>
              <div className="booking-dates">
                <div className="date-range">
                  <span className="check-in">
                    <strong>Check-in</strong>
                    {format(new Date(booking.check_in), 'MMM dd, yyyy')}
                  </span>
                  <ChevronRight size={16} />
                  <span className="check-out">
                    <strong>Check-out</strong>
                    {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              <div className="booking-amount">
                <span className="amount">₹{parseFloat(booking.gross_amount || booking.net_amount).toLocaleString()}</span>
                <span className="channel">{booking.channel === 'direct' ? 'Offline' : booking.channel}</span>
                {booking.paid_amount > 0 && <span className="text-success" style={{fontSize:'12px'}}>Paid: ₹{parseFloat(booking.paid_amount).toLocaleString()}</span>}
                {(booking.pending_amount || 0) > 0 && <span className="text-danger" style={{fontSize:'12px'}}>Due: ₹{parseFloat(booking.pending_amount).toLocaleString()}</span>}
              </div>
            </div>
            <div className="booking-actions">
              <span className={`status-badge ${booking.booking_status}`}>
                {(booking.booking_status || '').replace(/-/g, ' ')}
              </span>
              <button className="btn btn-sm btn-edit" onClick={() => openEdit(booking)}><Edit3 size={14} /> Edit</button>
              {booking.booking_status !== 'cancelled' && (
                <>
                  <button className="btn btn-sm btn-whatsapp" onClick={() => openWhatsApp(booking)} title="Send via WhatsApp">WhatsApp</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => copyBookingMessage(booking)} title="Copy message"><Copy size={14} /></button>
                </>
              )}
              {(booking.pending_amount || 0) > 0 && booking.booking_status !== 'cancelled' && (
                <button className="btn btn-sm btn-success" onClick={() => recordPayment(booking)}><IndianRupee size={14} /> Record Payment</button>
              )}
              {booking.booking_status === 'confirmed' && (
                <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked_in')}>Check In</button>
              )}
              {booking.booking_status === 'checked_in' && (
                <>
                  <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked_out')}>Check Out</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => { if(window.confirm('Revert to Confirmed?')) updateStatus(booking.id, 'confirmed'); }}>Undo Check In</button>
                </>
              )}
              {booking.booking_status === 'checked_out' && (
                <button className="btn btn-sm btn-secondary" onClick={() => { if(window.confirm('Revert to Checked In?')) updateStatus(booking.id, 'checked_in'); }}>Undo Check Out</button>
              )}
              {booking.booking_status === 'cancelled' && (
                <>
                  <button className="btn btn-sm btn-success" onClick={() => { if(window.confirm('Rebook this booking?')) updateStatus(booking.id, 'confirmed'); }}>Rebook</button>
                  <button className="btn btn-sm btn-danger" onClick={async () => { if(window.confirm('Permanently delete this cancelled booking? This cannot be undone.')) { try { await api.delete(`/bookings/${booking.id}`); fetchBookings(); } catch(err) { alert('Failed to delete'); } } }}><Trash2 size={14} /> Delete</button>
                </>
              )}
              {booking.booking_status !== 'cancelled' && (
                <button className="btn btn-sm btn-danger" onClick={() => { if(window.confirm('Cancel this booking?')) updateStatus(booking.id, 'cancelled'); }}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Guests Component
const Guests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestBookings, setGuestBookings] = useState([]);
  const [guestPage, setGuestPage] = useState(1);
  const GUESTS_PER_PAGE = 10;
  const emptyGForm = { first_name: '', last_name: '', email: '', phone: '', address: '', nationality: 'Indian', id_proof_type: 'Aadhaar', id_proof_number: '', notes: '' };
  const [gForm, setGForm] = useState(emptyGForm);

  useEffect(() => { fetchGuests(); }, [search]);
  useEffect(() => {
    if (searchParams.get('action') === 'new') { openAdd(); setSearchParams({}, { replace: true }); }
  }, []);

  const fetchGuests = async () => {
    try { const params = search ? { search, limit: 9999 } : { limit: 9999 }; const res = await api.get('/guests', { params }); setGuests(res.data.guests || []); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openAdd = () => { setEditId(null); setGForm(emptyGForm); setShowForm(true); };
  const openEdit = (g) => { setEditId(g.id); setGForm({ first_name: g.first_name, last_name: g.last_name, email: g.email || '', phone: g.phone, address: g.address || '', nationality: g.nationality || 'Indian', id_proof_type: g.id_proof_type || 'Aadhaar', id_proof_number: g.id_proof_number || '', notes: g.notes || '' }); setShowForm(true); };

  const viewGuestDetails = async (guest) => {
    setSelectedGuest(guest);
    try {
      const res = await api.get('/bookings');
      const allBookings = res.data.bookings || res.data || [];
      const gb = allBookings.filter(b => b.guest_id === guest.id).sort((a, b) => b.check_in.localeCompare(a.check_in));
      setGuestBookings(gb);
    } catch (err) { setGuestBookings([]); }
  };

  const handleGuest = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/guests/${editId}`, gForm); } else { await api.post('/guests', gForm); }
      setShowForm(false); setGForm(emptyGForm); setEditId(null); fetchGuests();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="guests-page">
      <div className="page-header">
        <h1>Guests</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} />
          Add Guest
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Guest' : 'Add Guest'}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleGuest} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>First Name *</label><input required value={gForm.first_name} onChange={e => setGForm({...gForm, first_name: e.target.value})} placeholder="First name"/></div>
                <div className="form-group"><label>Last Name *</label><input required value={gForm.last_name} onChange={e => setGForm({...gForm, last_name: e.target.value})} placeholder="Last name"/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone *</label><input required value={gForm.phone} onChange={e => setGForm({...gForm, phone: e.target.value})} placeholder="10-digit phone"/></div>
                <div className="form-group"><label>Email</label><input type="email" value={gForm.email} onChange={e => setGForm({...gForm, email: e.target.value})} placeholder="Email address"/></div>
              </div>
              <div className="form-group"><label>Address</label><input value={gForm.address} onChange={e => setGForm({...gForm, address: e.target.value})} placeholder="Full address"/></div>
              <div className="form-row">
                <div className="form-group"><label>ID Proof Type</label><select value={gForm.id_proof_type} onChange={e => setGForm({...gForm, id_proof_type: e.target.value})}><option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Driving License</option></select></div>
                <div className="form-group"><label>ID Number</label><input value={gForm.id_proof_number} onChange={e => setGForm({...gForm, id_proof_number: e.target.value})} placeholder="ID number"/></div>
                <div className="form-group"><label>Nationality</label><input value={gForm.nationality} onChange={e => setGForm({...gForm, nationality: e.target.value})}/></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={gForm.notes} onChange={e => setGForm({...gForm, notes: e.target.value})} rows="2" placeholder="Any notes about the guest"/></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Guest'}</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="guest-filters-bar">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="guest-summary">
          <span className="guest-count">{guests.length} guests</span>
        </div>
      </div>

      <div className="guest-table-wrapper">
        <table className="guest-table">
          <thead>
            <tr>
              <th></th>
              <th>Guest Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Nationality</th>
              <th style={{ textAlign: 'center' }}>Stays</th>
              <th>Notes</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {guests.slice((guestPage - 1) * GUESTS_PER_PAGE, guestPage * GUESTS_PER_PAGE).map(guest => (
              <tr key={guest.id} onClick={() => viewGuestDetails(guest)} style={{ cursor: 'pointer' }}>
                <td><div className="guest-avatar-sm">{guest.first_name?.[0]}{guest.last_name?.[0]}</div></td>
                <td className="guest-td-name">{guest.first_name} {guest.last_name}</td>
                <td className="guest-td-phone">{guest.phone || '-'}</td>
                <td className="guest-td-email">{guest.email || '-'}</td>
                <td>{guest.nationality || '-'}</td>
                <td style={{ textAlign: 'center' }}><span className="guest-stays-badge">{guest.total_stays || 0}</span></td>
                <td className="guest-td-notes">{guest.notes || '-'}</td>
                <td style={{ textAlign: 'center' }}><button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(guest); }} title="Edit"><Edit3 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {guests.length > GUESTS_PER_PAGE && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
            <button className="btn btn-sm btn-secondary" disabled={guestPage === 1} onClick={() => setGuestPage(guestPage - 1)}>Previous</button>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Page {guestPage} of {Math.ceil(guests.length / GUESTS_PER_PAGE)}</span>
            <button className="btn btn-sm btn-secondary" disabled={guestPage >= Math.ceil(guests.length / GUESTS_PER_PAGE)} onClick={() => setGuestPage(guestPage + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Guest Detail Modal with Booking History */}
      {selectedGuest && (
        <div className="modal-overlay" onClick={() => setSelectedGuest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{selectedGuest.first_name} {selectedGuest.last_name}</h2>
              <button className="modal-close" onClick={() => setSelectedGuest(null)}><X size={20}/></button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Phone</span><div style={{ fontWeight: 500 }}>{selectedGuest.phone || '-'}</div></div>
                <div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Email</span><div style={{ fontWeight: 500 }}>{selectedGuest.email || '-'}</div></div>
                <div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Nationality</span><div style={{ fontWeight: 500 }}>{selectedGuest.nationality || '-'}</div></div>
                <div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Total Stays</span><div style={{ fontWeight: 500 }}>{selectedGuest.total_stays || 0}</div></div>
                {selectedGuest.notes && <div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Notes</span><div style={{ fontWeight: 500 }}>{selectedGuest.notes}</div></div>}
              </div>

              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', borderTop: '1px solid #334155', paddingTop: '16px' }}>Booking History</h3>
              {guestBookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {guestBookings.map(b => (
                    <div key={b.id} onClick={() => { setSelectedGuest(null); navigate(`/bookings?view=${b.id}`); }} style={{ background: '#1e293b', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{b.property_name || 'Property'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                          {format(new Date(b.check_in), 'MMM dd')} → {format(new Date(b.check_out), 'MMM dd, yyyy')} | {b.channel || 'direct'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>₹{(b.net_amount || 0).toLocaleString()}</div>
                        <span className={`status-badge ${b.booking_status}`} style={{ fontSize: '11px' }}>{(b.booking_status || '').replace(/-/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No bookings found for this guest</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Expenses Component
const Expenses = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [expFilterCategory, setExpFilterCategory] = useState('');
  const [expFilterProperty, setExpFilterProperty] = useState('');
  const [expFilterDateFrom, setExpFilterDateFrom] = useState('');
  const [expFilterDateTo, setExpFilterDateTo] = useState('');
  const [expFilterPayment, setExpFilterPayment] = useState('');
  const emptyEForm = { property_id: '', category: 'cleaning', description: '', amount: '', payment_method: 'cash', vendor_name: '', expense_date: new Date().toISOString().split('T')[0] };
  const [eForm, setEForm] = useState(emptyEForm);

  useEffect(() => {
    fetchExpenses();
    api.get('/properties').then(res => setProperties(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let filtered = [...allExpenses];
    if (expFilterCategory) filtered = filtered.filter(e => e.category === expFilterCategory);
    if (expFilterProperty) filtered = filtered.filter(e => String(e.property_id) === expFilterProperty);
    if (expFilterDateFrom) filtered = filtered.filter(e => e.expense_date >= expFilterDateFrom);
    if (expFilterDateTo) filtered = filtered.filter(e => e.expense_date <= expFilterDateTo);
    if (expFilterPayment) filtered = filtered.filter(e => e.payment_method === expFilterPayment);
    setExpenses(filtered);
  }, [expFilterCategory, expFilterProperty, expFilterDateFrom, expFilterDateTo, expFilterPayment, allExpenses]);
  useEffect(() => {
    if (searchParams.get('action') === 'new') { openExpForm(); setSearchParams({}, { replace: true }); }
  }, []);

  const fetchExpenses = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/summary')
      ]);
      const exps = expRes.data.expenses || [];
      setAllExpenses(exps);
      setExpenses(exps);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExpForm = async () => {
    try { const res = await api.get('/properties'); setProperties(res.data || []); } catch(e) {}
    setEditId(null); setEForm(emptyEForm); setShowForm(true);
  };

  const openEditExp = async (exp) => {
    try { const res = await api.get('/properties'); setProperties(res.data || []); } catch(e) {}
    setEditId(exp.id);
    setEForm({ property_id: String(exp.property_id), category: exp.category, description: exp.description, amount: exp.amount, payment_method: exp.payment_method || 'cash', vendor_name: exp.vendor_name || '', expense_date: exp.expense_date });
    setShowForm(true);
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      const data = { ...eForm, property_id: parseInt(eForm.property_id), amount: parseFloat(eForm.amount) };
      if (editId) { await api.put(`/expenses/${editId}`, data); } else { await api.post('/expenses', data); }
      setShowForm(false); setEForm(emptyEForm); setEditId(null); fetchExpenses();
    } catch (err) { console.error(err); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); fetchExpenses(); } catch (err) { console.error(err); }
  };

  const downloadExpensesPDF = () => {
    const dateRange = (expFilterDateFrom || expFilterDateTo) ? `${expFilterDateFrom || 'Start'} to ${expFilterDateTo || 'Now'}` : 'All Time';
    const total = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    generateReportPDF('Expenses', dateRange, [{
      title: `Expense Details (${expenses.length} transactions)`,
      head: ['Date', 'Description', 'Category', 'Property', 'Payment', 'Amount'],
      body: [...expenses.map(e => [format(new Date(e.expense_date), 'dd MMM yyyy'), e.description, e.category.replace(/_/g, ' '), e.property_id === 0 ? 'Common' : (e.property_name || '-'), e.payment_method, `₹${parseFloat(e.amount).toLocaleString()}`]),
        [{ content: 'Total', styles: { fontStyle: 'bold' }, colSpan: 5 }, `₹${total.toLocaleString()}`]]
    }], [{ label: 'Total Expenses', value: `₹${total.toLocaleString()}` }, { label: 'Transactions', value: String(expenses.length) }]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>Expenses</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={downloadExpensesPDF}><Download size={16} /> PDF</button>
          <button className="btn btn-primary" onClick={openExpForm}><Plus size={18} /> Add Expense</button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editId ? 'Edit Expense' : 'Add Expense'}</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleExpense} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Property *</label><select required value={eForm.property_id} onChange={e => setEForm({...eForm, property_id: e.target.value})}><option value="">Select property</option><option value="0">Common - Stay Nestura (All Properties)</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="form-group"><label>Category *</label><select value={eForm.category} onChange={e => setEForm({...eForm, category: e.target.value})}><option value="cleaning">Cleaning</option><option value="electricity">Electricity</option><option value="water">Water</option><option value="laundry">Laundry</option><option value="maintenance">Maintenance</option><option value="internet">Internet</option><option value="supplies">Supplies</option><option value="groceries">Groceries</option><option value="staff_salary">Staff Salary</option><option value="travel">Travel</option><option value="marketing">Marketing</option><option value="other">Other</option></select></div>
              </div>
              <div className="form-group"><label>Description *</label><input required value={eForm.description} onChange={e => setEForm({...eForm, description: e.target.value})} placeholder="What is this expense for?"/></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (₹) *</label><input required type="number" value={eForm.amount} onChange={e => setEForm({...eForm, amount: e.target.value})} placeholder="e.g. 1500"/></div>
                <div className="form-group"><label>Date</label><input type="date" value={eForm.expense_date} onChange={e => setEForm({...eForm, expense_date: e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Payment Method</label><select value={eForm.payment_method} onChange={e => setEForm({...eForm, payment_method: e.target.value})}><option value="cash">Cash</option><option value="UPI">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option></select></div>
                <div className="form-group"><label>Vendor</label><input value={eForm.vendor_name} onChange={e => setEForm({...eForm, vendor_name: e.target.value})} placeholder="Vendor name"/></div>
              </div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Expense'}</button></div>
            </form>
          </div>
        </div>
      )}

      {summary && (
        <div className="expense-summary-grid">
          <div className="expense-total-card">
            <div className="expense-total-label">Total This Month</div>
            <div className="expense-total-amount">₹{parseFloat(summary.total || 0).toLocaleString()}</div>
            <div className="expense-total-count">{expenses.length} transactions</div>
          </div>
          {summary.byCategory?.slice(0, 5).map(cat => (
            <div key={cat.category} className="expense-cat-card">
              <div className="expense-cat-header">
                <span className="expense-cat-name">{cat.category.replace(/_/g, ' ')}</span>
                <span className="expense-cat-count">{expenses.filter(e => e.category === cat.category).length} items</span>
              </div>
              <div className="expense-cat-amount">₹{parseFloat(cat.total).toLocaleString()}</div>
              <div className="expense-cat-bar"><div className="expense-cat-fill" style={{ width: `${Math.min(100, (cat.total / (summary.total || 1)) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-group">
          <label>Category</label>
          <select value={expFilterCategory} onChange={e => setExpFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="cleaning">Cleaning</option>
            <option value="electricity">Electricity</option>
            <option value="water">Water</option>
            <option value="laundry">Laundry</option>
            <option value="maintenance">Maintenance</option>
            <option value="internet">Internet</option>
            <option value="supplies">Supplies</option>
            <option value="groceries">Groceries</option>
            <option value="staff_salary">Staff Salary</option>
            <option value="travel">Travel</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Property</label>
          <select value={expFilterProperty} onChange={e => setExpFilterProperty(e.target.value)}>
            <option value="">All Properties</option>
            <option value="0">Common</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Payment</label>
          <select value={expFilterPayment} onChange={e => setExpFilterPayment(e.target.value)}>
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" value={expFilterDateFrom} onChange={e => setExpFilterDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" value={expFilterDateTo} onChange={e => setExpFilterDateTo(e.target.value)} />
        </div>
        {(expFilterCategory || expFilterProperty || expFilterDateFrom || expFilterDateTo || expFilterPayment) && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setExpFilterCategory(''); setExpFilterProperty(''); setExpFilterDateFrom(''); setExpFilterDateTo(''); setExpFilterPayment(''); }} style={{ alignSelf: 'flex-end' }}>Clear Filters</button>
        )}
      </div>

      <div className="expense-table-wrapper">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Property</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td className="expense-td-date">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</td>
                <td className="expense-td-desc">{expense.description}</td>
                <td><span className={`expense-cat-badge ${expense.category}`}>{expense.category.replace(/_/g, ' ')}</span></td>
                <td className="expense-td-prop">{expense.property_id === 0 ? 'Common' : expense.property_name || '-'}</td>
                <td className="expense-td-method">{expense.payment_method}</td>
                <td className="expense-td-amount">₹{parseFloat(expense.amount).toLocaleString()}</td>
                <td className="expense-td-actions">
                  <button className="btn-icon-sm" title="Edit" onClick={() => openEditExp(expense)}><Edit3 size={14}/></button>
                  <button className="btn-icon-sm" title="Delete" onClick={() => deleteExpense(expense.id)}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Reports Component — Enhanced with multiple tabs
const generateReportPDF = (title, monthLabel, tables, summaryCards) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 42, 74);
  doc.text('Stay Nestura', 14, 18);
  doc.setFontSize(13); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text(title, 14, 26);
  doc.setFontSize(10); doc.text(monthLabel, pageW - 14, 18, { align: 'right' });
  doc.setDrawColor(201, 169, 110); doc.setLineWidth(0.8); doc.line(14, 30, pageW - 14, 30);
  let y = 36;
  if (summaryCards && summaryCards.length > 0) {
    const colW = (pageW - 28) / Math.min(summaryCards.length, 4);
    summaryCards.forEach((card, i) => {
      const x = 14 + (i % 4) * colW;
      const row = Math.floor(i / 4);
      const cy = y + row * 20;
      doc.setFillColor(250, 248, 245); doc.roundedRect(x, cy, colW - 4, 16, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + 3, cy + 6);
      doc.setFontSize(11); doc.setTextColor(27, 42, 74); doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 3, cy + 13);
    });
    y += Math.ceil(summaryCards.length / 4) * 20 + 4;
  }
  tables.forEach(tbl => {
    if (y > 260) { doc.addPage(); y = 20; }
    if (tbl.title) { doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 42, 74); doc.text(tbl.title, 14, y); y += 6; }
    doc.autoTable({ startY: y, head: [tbl.head], body: tbl.body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' }, headStyles: { fillColor: [27, 42, 74], textColor: 255, fontStyle: 'bold', fontSize: 8 }, alternateRowStyles: { fillColor: [250, 248, 245] }, margin: { left: 14, right: 14 } });
    y = doc.lastAutoTable.finalY + 10;
  });
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')} | Stay Nestura PMS`, 14, doc.internal.pageSize.getHeight() - 8);
  doc.save(`Stay-Nestura-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${monthLabel.replace(/\s/g, '-')}.pdf`);
};

const Reports = () => {
  const [activeTab, setActiveTab] = useState('pnl');
  const [report, setReport] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [guestAnalytics, setGuestAnalytics] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [adrData, setAdrData] = useState(null);
  const [expSummary, setExpSummary] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [propertyId, setPropertyId] = useState('');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    api.get('/properties').then(res => setProperties(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAllReports();
  }, [year, month, propertyId]);

  const fetchAllReports = async () => {
    setLoading(true);
    const params = { year, month };
    if (propertyId) params.property_id = propertyId;
    const results = await Promise.allSettled([
      api.get('/reports/profit-loss', { params }),
      api.get('/reports/revenue', { params }),
      api.get('/reports/guest-analytics', { params }),
      api.get('/reports/payment-summary', { params }),
      api.get('/reports/adr', { params }),
      api.get('/expenses/summary', { params }),
      api.get('/bookings/stats/overview', { params })
    ]);
    const val = (i) => results[i].status === 'fulfilled' ? results[i].value.data : null;
    if (val(0)) setReport(val(0));
    if (val(1)) setRevenue(val(1));
    if (val(2)) setGuestAnalytics(val(2));
    if (val(3)) setPaymentSummary(val(3));
    if (val(4)) setAdrData(val(4));
    if (val(5)) setExpSummary(val(5));
    if (val(6)) setOccupancy(val(6));
    setLoading(false);
  };

  const monthLabel = `${format(new Date(year, month - 1), 'MMMM yyyy')}`;
  const propLabel = propertyId ? (properties.find(p => p.id === parseInt(propertyId))?.name || '') : 'All Properties';
  const subTitle = `${monthLabel} | ${propLabel}`;

  const downloadPnlPDF = () => {
    if (!report) return;
    generateReportPDF('Profit & Loss Report', subTitle, [{
      title: 'Property-wise P&L',
      head: ['Property', 'Nights Sold', 'Occupancy %', 'Gross Revenue', 'Expenses', 'Net Profit'],
      body: [...report.properties.map(p => [p.property_name, `${p.nights_sold}/${p.available_nights}`, `${p.occupancy_percent}%`, `₹${p.gross_revenue.toLocaleString()}`, `-₹${p.expenses.toLocaleString()}`, `₹${p.net_profit.toLocaleString()}`]),
        [{ content: 'Total', styles: { fontStyle: 'bold' } }, '', '', `₹${report.totals.total_gross.toLocaleString()}`, `-₹${report.totals.total_expenses.toLocaleString()}`, `₹${report.totals.total_net.toLocaleString()}`]]
    }], [
      { label: 'Total Revenue', value: `₹${report.totals.total_gross.toLocaleString()}` },
      { label: 'Expenses', value: `-₹${report.totals.total_expenses.toLocaleString()}` },
      { label: 'Net Profit', value: `₹${report.totals.total_net.toLocaleString()}` }
    ]);
  };

  const downloadRevenuePDF = () => {
    if (!revenue) return;
    const tables = [];
    if (revenue.byChannel?.length) tables.push({ title: 'Revenue by Channel', head: ['Channel', 'Bookings', 'Revenue'], body: [...revenue.byChannel.map(c => [c.channel, c.bookings, `₹${c.gross.toLocaleString()}`]), [{ content: 'Total', styles: { fontStyle: 'bold' } }, revenue.byChannel.reduce((s,c) => s+c.bookings, 0), `₹${revenue.byChannel.reduce((s,c) => s+c.gross, 0).toLocaleString()}`]] });
    if (revenue.byProperty?.length) tables.push({ title: 'Revenue by Property', head: ['Property', 'Gross Revenue'], body: [...revenue.byProperty.map(p => [p.property_name, `₹${p.gross.toLocaleString()}`]), [{ content: 'Total', styles: { fontStyle: 'bold' } }, `₹${revenue.byProperty.reduce((s,p) => s+p.gross, 0).toLocaleString()}`]] });
    generateReportPDF('Revenue Report', subTitle, tables);
  };

  const downloadOccupancyPDF = () => {
    if (!occupancy) return;
    generateReportPDF('Occupancy Report', subTitle, [{
      title: 'Property Occupancy',
      head: ['Property', 'Nights Booked', 'Nights Available', 'Occupancy %'],
      body: occupancy.occupancy?.map(p => [p.property_name, p.total_nights_booked, p.total_nights_available, `${p.occupancy_percent}%`]) || []
    }], [
      { label: 'Total Bookings', value: String(occupancy.summary?.total_bookings || 0) },
      { label: 'Unique Guests', value: String(occupancy.summary?.unique_guests || 0) },
      { label: 'Gross Revenue', value: `₹${(occupancy.summary?.total_gross || 0).toLocaleString()}` },
      { label: 'Net Revenue', value: `₹${(occupancy.summary?.total_net || 0).toLocaleString()}` }
    ]);
  };

  const downloadExpensesPDF = () => {
    if (!expSummary) return;
    const tables = [];
    if (expSummary.byCategory?.length) tables.push({ title: 'Expenses by Category', head: ['Category', 'Count', 'Total'], body: expSummary.byCategory.map(c => [c.category, c.count, `₹${c.total.toLocaleString()}`]) });
    if (expSummary.byProperty?.length) tables.push({ title: 'Expenses by Property', head: ['Property', 'Total'], body: expSummary.byProperty.map(p => [p.property_name, `₹${p.total.toLocaleString()}`]) });
    generateReportPDF('Expenses Report', subTitle, tables, [{ label: 'Total Expenses', value: `₹${(expSummary.total || 0).toLocaleString()}` }]);
  };

  const downloadGuestsPDF = () => {
    if (!guestAnalytics) return;
    generateReportPDF('Guest Analytics', subTitle, [{
      title: 'Top Guests by Lifetime Value',
      head: ['#', 'Guest', 'Phone', 'Stays', 'Lifetime Value'],
      body: guestAnalytics.topGuests?.map((g, i) => [i + 1, g.name, g.phone || '-', g.total_stays, `₹${g.lifetime_value.toLocaleString()}`]) || []
    }], [
      { label: 'Total Guests', value: String(guestAnalytics.total_guests) },
      { label: 'New Guests', value: String(guestAnalytics.new_guests) },
      { label: 'Repeat Guests', value: String(guestAnalytics.repeat_guests) },
      { label: 'Repeat Rate', value: `${guestAnalytics.repeat_rate}%` }
    ]);
  };

  const downloadPaymentsPDF = () => {
    if (!paymentSummary) return;
    generateReportPDF('Payment Summary', subTitle, [{
      title: 'Payment Breakdown',
      head: ['Status', 'Count', 'Amount'],
      body: [
        ['Fully Paid', paymentSummary.paid.count, `₹${paymentSummary.paid.total.toLocaleString()}`],
        ['Partial - Collected', paymentSummary.partial.count, `₹${paymentSummary.partial.collected.toLocaleString()}`],
        ['Partial - Remaining', '', `₹${paymentSummary.partial.remaining.toLocaleString()}`],
        ['Pending', paymentSummary.pending.count, `₹${paymentSummary.pending.total.toLocaleString()}`],
        [{ content: 'Total Collected', styles: { fontStyle: 'bold' } }, '', `₹${paymentSummary.total_collected.toLocaleString()}`],
        [{ content: 'Total Pending', styles: { fontStyle: 'bold' } }, '', `₹${paymentSummary.total_pending.toLocaleString()}`]
      ]
    }]);
  };

  const downloadAdrPDF = () => {
    if (!adrData) return;
    generateReportPDF('ADR Report', subTitle, [{
      title: 'Average Daily Rate by Property',
      head: ['Property', 'Base Price', 'Nights Sold', 'Total Revenue', 'ADR', 'vs Base'],
      body: adrData.properties?.map(p => [p.property_name, `₹${p.base_price.toLocaleString()}`, p.nights_sold, `₹${p.total_revenue.toLocaleString()}`, `₹${p.adr.toLocaleString()}`, p.base_price > 0 ? `${p.adr >= p.base_price ? '+' : ''}${Math.round((p.adr - p.base_price) / p.base_price * 100)}%` : 'N/A']) || []
    }], [{ label: 'Overall ADR', value: `₹${adrData.overall_adr.toLocaleString()}` }]);
  };

  const downloadMap = { pnl: downloadPnlPDF, revenue: downloadRevenuePDF, occupancy: downloadOccupancyPDF, expenses: downloadExpensesPDF, guests: downloadGuestsPDF, payments: downloadPaymentsPDF, adr: downloadAdrPDF };

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'pnl', label: 'P&L' },
    { id: 'revenue', label: 'Revenue' },
    { id: 'occupancy', label: 'Occupancy' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'guests', label: 'Guests' },
    { id: 'payments', label: 'Payments' },
    { id: 'adr', label: 'ADR' },
  ];

  const maxChannelGross = revenue?.byChannel?.length ? Math.max(...revenue.byChannel.map(c => c.gross)) : 1;
  const maxPropGross = revenue?.byProperty?.length ? Math.max(...revenue.byProperty.map(p => p.gross)) : 1;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <div className="report-filters">
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{format(new Date(2024, m - 1), 'MMMM')}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="report-tabs" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {tabs.map(tab => (
          <button key={tab.id} className={`report-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
        <button className="btn btn-sm btn-primary" onClick={() => downloadMap[activeTab]()} style={{ marginLeft: 'auto' }}><Download size={14} /> Download PDF</button>
      </div>

      {/* P&L Tab */}
      {activeTab === 'pnl' && report && (
        <>
          <div className="report-summary">
            <div className="summary-item">
              <span className="label">Total Revenue</span>
              <span className="value">₹{report.totals.total_gross.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Expenses</span>
              <span className="value text-red">-₹{report.totals.total_expenses.toLocaleString()}</span>
            </div>
            <div className="summary-item highlight">
              <span className="label">Net Profit</span>
              <span className="value">₹{report.totals.total_net.toLocaleString()}</span>
            </div>
          </div>
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Nights Sold</th>
                  <th>Occupancy %</th>
                  <th>Gross Revenue</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map(prop => (
                  <tr key={prop.property_id}>
                    <td>{prop.property_name}</td>
                    <td>{prop.nights_sold} / {prop.available_nights || '-'}</td>
                    <td>{prop.occupancy_percent}%</td>
                    <td>₹{prop.gross_revenue.toLocaleString()}</td>
                    <td className="text-red">-₹{prop.expenses.toLocaleString()}</td>
                    <td className="profit">₹{prop.net_profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && revenue && (
        <div className="report-sections">
          <div className="card">
            <div className="card-header"><h3>Revenue by Channel</h3></div>
            <div className="card-content">
              {revenue.byChannel?.map(ch => (
                <div key={ch.channel} className="bar-chart-row">
                  <span className="bar-label">{ch.channel}</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(ch.gross / maxChannelGross) * 100}%`, backgroundColor: ch.channel === 'direct' ? '#10b981' : ch.channel === 'airbnb' ? '#ff5a5f' : '#003580' }}></div>
                  </div>
                  <span className="bar-value">₹{ch.gross.toLocaleString()}</span>
                </div>
              ))}
              <div className="bar-chart-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontWeight: 700 }}>
                <span className="bar-label">Total</span>
                <div className="bar-container"></div>
                <span className="bar-value">₹{(revenue.byChannel?.reduce((s, c) => s + c.gross, 0) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Revenue by Property</h3></div>
            <div className="card-content">
              {revenue.byProperty?.map(p => (
                <div key={p.property_name} className="bar-chart-row">
                  <span className="bar-label">{p.property_name}</span>
                  <div className="bar-container">
                    <div className="bar-fill" style={{ width: `${(p.gross / maxPropGross) * 100}%`, backgroundColor: '#6366f1' }}></div>
                  </div>
                  <span className="bar-value">₹{p.gross.toLocaleString()}</span>
                </div>
              ))}
              <div className="bar-chart-row" style={{ borderTop: '2px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontWeight: 700 }}>
                <span className="bar-label">Total</span>
                <div className="bar-container"></div>
                <span className="bar-value">₹{(revenue.byProperty?.reduce((s, p) => s + p.gross, 0) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Channel Breakdown</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Channel</th><th>Bookings</th><th>Revenue</th></tr></thead>
                <tbody>
                  {revenue.byChannel?.map(ch => (
                    <tr key={ch.channel}>
                      <td>{ch.channel}</td>
                      <td>{ch.bookings}</td>
                      <td className="profit">₹{ch.gross.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                    <td>Total</td>
                    <td>{revenue.byChannel?.reduce((s, c) => s + c.bookings, 0)}</td>
                    <td className="profit">₹{(revenue.byChannel?.reduce((s, c) => s + c.gross, 0) || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Occupancy Tab */}
      {activeTab === 'occupancy' && occupancy && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Bookings" value={occupancy.summary?.total_bookings || 0} icon={UserCheck} color="#10b981" />
            <StatCard title="Unique Guests" value={occupancy.summary?.unique_guests || 0} icon={Users} color="#6366f1" />
            <StatCard title="Gross Revenue" value={`₹${(occupancy.summary?.total_gross || 0).toLocaleString()}`} icon={IndianRupee} color="#3b82f6" />
            <StatCard title="Net Revenue" value={`₹${(occupancy.summary?.total_net || 0).toLocaleString()}`} icon={TrendingUp} color="#10b981" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Property Occupancy</h3></div>
            <div className="card-content">
              {occupancy.occupancy?.map(p => (
                <div key={p.property_name} className="occupancy-item">
                  <span className="occupancy-name">{p.property_name}</span>
                  <div className="occupancy-bar">
                    <div className="occupancy-fill" style={{ width: `${p.occupancy_percent}%` }} />
                  </div>
                  <span className="occupancy-percent">{p.occupancy_percent}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Occupancy Details</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Nights Booked</th><th>Nights Available</th><th>Occupancy %</th></tr></thead>
                <tbody>
                  {occupancy.occupancy?.map(p => (
                    <tr key={p.property_name}>
                      <td>{p.property_name}</td>
                      <td>{p.total_nights_booked}</td>
                      <td>{p.total_nights_available}</td>
                      <td>{p.occupancy_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && expSummary && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Expenses" value={`₹${(expSummary.total || 0).toLocaleString()}`} icon={IndianRupee} color="#ef4444" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Expense by Category</h3></div>
            <div className="card-content">
              {expSummary.byCategory?.map(cat => {
                const maxCat = expSummary.byCategory.length ? Math.max(...expSummary.byCategory.map(c => c.total)) : 1;
                return (
                  <div key={cat.category} className="bar-chart-row">
                    <span className="bar-label">{cat.category}</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${(cat.total / maxCat) * 100}%`, backgroundColor: '#ef4444' }}></div>
                    </div>
                    <span className="bar-value">₹{cat.total.toLocaleString()} ({cat.count})</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Expense by Property</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Total Expenses</th></tr></thead>
                <tbody>
                  {expSummary.byProperty?.map(p => (
                    <tr key={p.property_id}>
                      <td>{p.property_name}</td>
                      <td className="text-red">₹{p.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Guest Analytics Tab */}
      {activeTab === 'guests' && guestAnalytics && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Total Guests" value={guestAnalytics.total_guests} icon={Users} color="#6366f1" />
            <StatCard title="New Guests" value={guestAnalytics.new_guests} icon={UserCheck} color="#10b981" />
            <StatCard title="Repeat Guests" value={guestAnalytics.repeat_guests} icon={RefreshCw} color="#f59e0b" />
            <StatCard title="Repeat Rate" value={`${guestAnalytics.repeat_rate}%`} icon={TrendingUp} color="#3b82f6" />
          </div>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <StatCard title="Avg Lifetime Value" value={`₹${guestAnalytics.avg_lifetime_value.toLocaleString()}`} icon={IndianRupee} color="#8b5cf6" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Top Guests by Lifetime Value</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>#</th><th>Guest</th><th>Phone</th><th>Stays</th><th>Lifetime Value</th></tr></thead>
                <tbody>
                  {guestAnalytics.topGuests?.map((g, i) => (
                    <tr key={g.id}>
                      <td>{i + 1}</td>
                      <td>{g.name}</td>
                      <td>{g.phone}</td>
                      <td>{g.total_stays}</td>
                      <td className="profit">₹{g.lifetime_value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary Tab */}
      {activeTab === 'payments' && paymentSummary && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Paid Bookings" value={paymentSummary.paid.count} icon={CheckCircle} color="#10b981" />
            <StatCard title="Paid Amount" value={`₹${paymentSummary.paid.total.toLocaleString()}`} icon={IndianRupee} color="#10b981" />
            <StatCard title="Pending Bookings" value={paymentSummary.pending.count} icon={Clock} color="#f59e0b" />
            <StatCard title="Pending Amount" value={`₹${paymentSummary.pending.total.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
          </div>
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <StatCard title="Partial Payments" value={paymentSummary.partial.count} icon={Clock} color="#8b5cf6" />
            <StatCard title="Collected (Partial)" value={`₹${paymentSummary.partial.collected.toLocaleString()}`} icon={IndianRupee} color="#6366f1" />
            <StatCard title="Remaining (Partial)" value={`₹${paymentSummary.partial.remaining.toLocaleString()}`} icon={AlertCircle} color="#ef4444" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Collection Summary</h3></div>
            <div className="card-content">
              <div className="bar-chart-row">
                <span className="bar-label">Collected</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${paymentSummary.total_collected / Math.max(1, paymentSummary.total_collected + paymentSummary.total_pending) * 100}%`, backgroundColor: '#10b981' }}></div>
                </div>
                <span className="bar-value">₹{paymentSummary.total_collected.toLocaleString()}</span>
              </div>
              <div className="bar-chart-row">
                <span className="bar-label">Pending</span>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${paymentSummary.total_pending / Math.max(1, paymentSummary.total_collected + paymentSummary.total_pending) * 100}%`, backgroundColor: '#ef4444' }}></div>
                </div>
                <span className="bar-value">₹{paymentSummary.total_pending.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADR Tab */}
      {activeTab === 'adr' && adrData && (
        <div className="report-sections">
          <div className="stats-grid">
            <StatCard title="Overall ADR" value={`₹${adrData.overall_adr.toLocaleString()}`} icon={TrendingUp} color="#6366f1" />
          </div>
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header"><h3>Average Daily Rate by Property</h3></div>
            <div className="report-table">
              <table>
                <thead><tr><th>Property</th><th>Base Price</th><th>Nights Sold</th><th>Total Revenue</th><th>ADR</th><th>vs Base</th></tr></thead>
                <tbody>
                  {adrData.properties?.map(p => (
                    <tr key={p.property_id}>
                      <td>{p.property_name}</td>
                      <td>₹{p.base_price.toLocaleString()}</td>
                      <td>{p.nights_sold}</td>
                      <td>₹{p.total_revenue.toLocaleString()}</td>
                      <td className="profit">₹{p.adr.toLocaleString()}</td>
                      <td className={p.adr >= p.base_price ? 'text-green' : 'text-red'}>
                        {p.base_price > 0 ? `${p.adr >= p.base_price ? '+' : ''}${Math.round((p.adr - p.base_price) / p.base_price * 100)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Component - Data Export/Import
const SettingsPage = () => {
  const [importStatus, setImportStatus] = useState(null);

  const handleExport = async () => {
    try {
      const res = await api.get('/data/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `stay-nestura-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Export failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!window.confirm(`Import data from "${file.name}"?\n\nThis will REPLACE all current data:\n- ${data.properties?.length || 0} properties\n- ${data.guests?.length || 0} guests\n- ${data.bookings?.length || 0} bookings\n- ${data.expenses?.length || 0} expenses\n\nAre you sure?`)) return;
      const res = await api.post('/data/import', data);
      setImportStatus(res.data);
      alert('Data imported successfully!');
      window.location.reload();
    } catch (err) { console.error(err); alert('Import failed: ' + err.message); }
    e.target.value = '';
  };

  return (
    <div className="settings-page">
      <div className="page-header"><h1>Settings</h1></div>
      <div className="settings-section">
        <h2>Data Management</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Export your data as a JSON backup file, or import data from a previous backup to migrate between deployments.</p>
        <div className="settings-cards">
          <div className="settings-card">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}><Download size={24} /></div>
            <h3>Export Data</h3>
            <p>Download all properties, bookings, guests, and expenses as a JSON file.</p>
            <button className="btn btn-primary" onClick={handleExport}><Download size={16} /> Export Backup</button>
          </div>
          <div className="settings-card">
            <div className="settings-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}><Upload size={24} /></div>
            <h3>Import Data</h3>
            <p>Upload a previously exported JSON backup file to restore or migrate data.</p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}><Upload size={16} /> Import Backup<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} /></label>
          </div>
        </div>
        {importStatus && (
          <div className="import-result">
            <CheckCircle size={16} /> Imported: {importStatus.imported?.properties || 0} properties, {importStatus.imported?.guests || 0} guests, {importStatus.imported?.bookings || 0} bookings, {importStatus.imported?.expenses || 0} expenses
          </div>
        )}
      </div>

      <div className="settings-section" style={{ marginTop: '20px' }}>
        <h2>CSV Export</h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Download individual data tables as CSV files for use in Excel or Google Sheets.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['properties', 'bookings', 'guests', 'expenses'].map(type => (
            <a key={type} href={`/api/data/export/csv/${type}`} download className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Download size={16} /> {type.charAt(0).toUpperCase() + type.slice(1)} CSV
            </a>
          ))}
        </div>
      </div>

      <div className="settings-section" style={{ marginTop: '20px' }}>
        <h2>Sync Data for Deployment</h2>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Save your current data into the source code so it persists across Render deployments. Run this before committing to Git.</p>
        <button className="btn btn-primary" onClick={async () => {
          if (!window.confirm('This will save all current data into database.js source code.\n\nAfter this, commit and push to Git for deployment.\n\nContinue?')) return;
          try {
            const res = await api.post('/data/sync-to-code');
            alert(res.data.message);
          } catch (err) { alert('Sync failed: ' + err.message); }
        }}><RefreshCw size={16} /> Sync Data to Code</button>
      </div>
    </div>
  );
};

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
      </main>
    </div>
  );
};

// Auth Provider - bypassed for demo, always logged in
const AuthProvider = ({ children }) => {
  const demoUser = { id: 'demo-001', email: 'test@test.com', name: 'Demo User', role: 'admin' };

  const login = async () => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user: demoUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// App Component
function App() {
  return (
    <Router basename="/app">
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  );
}

export default App;
