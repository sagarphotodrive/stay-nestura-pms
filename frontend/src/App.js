import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { 
  LayoutDashboard, Building2, Calendar, Users, 
  Receipt, BarChart3, Settings, Bell, Menu, X,
  Plus, Search, ChevronRight, Home, LogOut,
  RefreshCw, DollarSign, TrendingUp, UserCheck,
  UserX, AlertCircle, CheckCircle, Clock
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
    { id: 'expenses', icon: Receipt, label: 'Expenses' },
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
          icon={DollarSign}
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
                    <span className="booking-guest">{booking.first_name} {booking.last_name}</span>
                    <span className="booking-property">{booking.property_name}</span>
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
          <Link to="/bookings/new" className="action-btn">
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
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', property_type: 'Homestay', address: '', city: '', state: 'Maharashtra', pincode: '', total_rooms: 1, max_guests: 2, base_price: '', description: '' });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/properties', { ...form, base_price: parseFloat(form.base_price), total_rooms: parseInt(form.total_rooms), max_guests: parseInt(form.max_guests) });
      setShowForm(false);
      setForm({ name: '', property_type: 'Homestay', address: '', city: '', state: 'Maharashtra', pincode: '', total_rooms: 1, max_guests: 2, base_price: '', description: '' });
      fetchProperties();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="properties-page">
      <div className="page-header">
        <h1>Properties</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Property
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add New Property</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group"><label>Property Name *</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Sunset Homestay"/></div>
              <div className="form-row">
                <div className="form-group"><label>Type</label><select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}><option>Homestay</option><option>Room</option><option>Villa</option><option>Apartment</option></select></div>
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
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Property</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="properties-grid">
        {properties.map((property) => (
          <div key={property.id} className="property-card">
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
const MasterCalendar = () => {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const days = Array.from({ length: 35 }, (_, i) => addDays(viewDate, i - 7));

  useEffect(() => {
    fetchData();
  }, [viewDate]);

  const fetchData = async () => {
    try {
      const [propRes, bookingRes] = await Promise.all([
        api.get('/properties'),
        api.get('/bookings', {
          params: {
            start_date: days[0].toISOString().split('T')[0],
            end_date: days[days.length - 1].toISOString().split('T')[0]
          }
        })
      ]);
      setProperties(propRes.data);
      setBookings(bookingRes.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBookingForDate = (propertyId, date) => {
    return bookings.find(b => 
      b.property_id === propertyId &&
      new Date(b.check_in) <= date &&
      new Date(b.check_out) > date
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Master Calendar</h1>
        <div className="calendar-nav">
          <button onClick={() => setViewDate(addDays(viewDate, -7))}>&lt; Previous</button>
          <span>{format(viewDate, 'MMMM yyyy')}</span>
          <button onClick={() => setViewDate(addDays(viewDate, 7))}>Next &gt;</button>
        </div>
      </div>

      <div className="master-calendar">
        <div className="calendar-header">
          <div className="property-col">Property</div>
          {days.map(day => (
            <div key={day.toISOString()} className={`day-col ${format(day, 'EEE') === 'Sun' ? 'weekend' : ''}`}>
              <span className="day-name">{format(day, 'EEE')}</span>
              <span className="day-num">{format(day, 'd')}</span>
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {properties.map(property => (
            <div key={property.id} className="calendar-row">
              <div className="property-col">{property.name}</div>
              {days.map(day => {
                const booking = getBookingForDate(property.id, day);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`day-cell ${booking ? 'booked' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {booking && (
                      <div className="booking-badge" title={`${booking.first_name} ${booking.last_name}`}>
                        {booking.first_name?.[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
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
    </div>
  );
};

// Bookings Component
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState([]);
  const [guests, setGuests] = useState([]);
  const [bForm, setBForm] = useState({ property_id: '', guest_id: '', check_in: '', check_out: '', adults: 1, children: 0, nightly_rate: '', channel: 'direct', payment_method: 'UPI', special_requests: '' });

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/bookings', { params });
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openForm = async () => {
    try {
      const [pRes, gRes] = await Promise.all([api.get('/properties'), api.get('/guests')]);
      setProperties(pRes.data || []);
      setGuests(gRes.data.guests || []);
      setShowForm(true);
    } catch (err) { console.error(err); }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const nights = Math.max(1, Math.ceil((new Date(bForm.check_out) - new Date(bForm.check_in)) / 86400000));
      const gross = parseFloat(bForm.nightly_rate) * nights;
      await api.post('/bookings', { ...bForm, property_id: parseInt(bForm.property_id), guest_id: parseInt(bForm.guest_id), nightly_rate: parseFloat(bForm.nightly_rate), gross_amount: gross, adults: parseInt(bForm.adults), children: parseInt(bForm.children) });
      setShowForm(false);
      setBForm({ property_id: '', guest_id: '', check_in: '', check_out: '', adults: 1, children: 0, nightly_rate: '', channel: 'direct', payment_method: 'UPI', special_requests: '' });
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Booking</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleBooking} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Property *</label><select required value={bForm.property_id} onChange={e => setBForm({...bForm, property_id: e.target.value})}><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name} - Rs.{p.base_price}/night</option>)}</select></div>
                <div className="form-group"><label>Guest *</label><select required value={bForm.guest_id} onChange={e => setBForm({...bForm, guest_id: e.target.value})}><option value="">Select guest</option>{guests.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.phone})</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Check-in *</label><input required type="date" value={bForm.check_in} onChange={e => setBForm({...bForm, check_in: e.target.value})}/></div>
                <div className="form-group"><label>Check-out *</label><input required type="date" value={bForm.check_out} onChange={e => setBForm({...bForm, check_out: e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Nightly Rate (Rs.) *</label><input required type="number" value={bForm.nightly_rate} onChange={e => setBForm({...bForm, nightly_rate: e.target.value})} placeholder="e.g. 2500"/></div>
                <div className="form-group"><label>Channel</label><select value={bForm.channel} onChange={e => setBForm({...bForm, channel: e.target.value})}><option value="direct">Direct</option><option value="airbnb">Airbnb</option><option value="booking.com">Booking.com</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Adults</label><input type="number" min="1" value={bForm.adults} onChange={e => setBForm({...bForm, adults: e.target.value})}/></div>
                <div className="form-group"><label>Children</label><input type="number" min="0" value={bForm.children} onChange={e => setBForm({...bForm, children: e.target.value})}/></div>
                <div className="form-group"><label>Payment</label><select value={bForm.payment_method} onChange={e => setBForm({...bForm, payment_method: e.target.value})}><option value="UPI">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></select></div>
              </div>
              <div className="form-group"><label>Special Requests</label><textarea value={bForm.special_requests} onChange={e => setBForm({...bForm, special_requests: e.target.value})} rows="2" placeholder="Any special requests..."/></div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Booking</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        <button className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>
          Confirmed
        </button>
        <button className={`filter-btn ${filter === 'checked-in' ? 'active' : ''}`} onClick={() => setFilter('checked-in')}>
          Checked In
        </button>
        <button className={`filter-btn ${filter === 'checked-out' ? 'active' : ''}`} onClick={() => setFilter('checked-out')}>
          Checked Out
        </button>
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
                <span className="amount">₹{parseFloat(booking.net_amount).toLocaleString()}</span>
                <span className="channel">{booking.channel}</span>
              </div>
            </div>
            <div className="booking-actions">
              <span className={`status-badge ${booking.booking_status}`}>
                {booking.booking_status}
              </span>
              {booking.booking_status === 'confirmed' && (
                <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked-in')}>
                  Check In
                </button>
              )}
              {booking.booking_status === 'checked-in' && (
                <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked-out')}>
                  Check Out
                </button>
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
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [gForm, setGForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address: '', nationality: 'Indian', id_proof_type: 'Aadhaar', id_proof_number: '', notes: '' });

  useEffect(() => {
    fetchGuests();
  }, [search]);

  const fetchGuests = async () => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/guests', { params });
      setGuests(res.data.guests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/guests', gForm);
      setShowForm(false);
      setGForm({ first_name: '', last_name: '', email: '', phone: '', address: '', nationality: 'Indian', id_proof_type: 'Aadhaar', id_proof_number: '', notes: '' });
      fetchGuests();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="guests-page">
      <div className="page-header">
        <h1>Guests</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add Guest
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Guest</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
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
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Guest</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="search-bar">
        <Search size={20} />
        <input 
          type="text" 
          placeholder="Search guests by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="guests-grid">
        {guests.map(guest => (
          <div key={guest.id} className="guest-card">
            <div className="guest-avatar">
              {guest.first_name?.[0]}{guest.last_name?.[0]}
            </div>
            <div className="guest-info">
              <h3>{guest.first_name} {guest.last_name}</h3>
              <p>{guest.phone}</p>
              <p>{guest.email}</p>
            </div>
            <div className="guest-stats">
              <div className="guest-stat">
                <span className="label">Stays</span>
                <span className="value">{guest.total_stays}</span>
              </div>
              <div className="guest-stat">
                <span className="label">Lifetime</span>
                <span className="value">₹{parseFloat(guest.lifetime_value || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Expenses Component
const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState([]);
  const [eForm, setEForm] = useState({ property_id: '', category: 'cleaning', description: '', amount: '', payment_method: 'cash', vendor_name: '', expense_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/summary')
      ]);
      setExpenses(expRes.data.expenses || []);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openExpForm = async () => {
    try { const res = await api.get('/properties'); setProperties(res.data || []); } catch(e) {}
    setShowForm(true);
  };

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...eForm, property_id: parseInt(eForm.property_id), amount: parseFloat(eForm.amount) });
      setShowForm(false);
      setEForm({ property_id: '', category: 'cleaning', description: '', amount: '', payment_method: 'cash', vendor_name: '', expense_date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="expenses-page">
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn btn-primary" onClick={openExpForm}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Add Expense</h2><button className="modal-close" onClick={() => setShowForm(false)}><X size={20}/></button></div>
            <form onSubmit={handleExpense} className="modal-form">
              <div className="form-row">
                <div className="form-group"><label>Property *</label><select required value={eForm.property_id} onChange={e => setEForm({...eForm, property_id: e.target.value})}><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="form-group"><label>Category *</label><select value={eForm.category} onChange={e => setEForm({...eForm, category: e.target.value})}><option value="cleaning">Cleaning</option><option value="electricity">Electricity</option><option value="water">Water</option><option value="laundry">Laundry</option><option value="maintenance">Maintenance</option><option value="internet">Internet</option><option value="supplies">Supplies</option><option value="groceries">Groceries</option><option value="staff_salary">Staff Salary</option><option value="travel">Travel</option><option value="marketing">Marketing</option><option value="other">Other</option></select></div>
              </div>
              <div className="form-group"><label>Description *</label><input required value={eForm.description} onChange={e => setEForm({...eForm, description: e.target.value})} placeholder="What is this expense for?"/></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (Rs.) *</label><input required type="number" value={eForm.amount} onChange={e => setEForm({...eForm, amount: e.target.value})} placeholder="e.g. 1500"/></div>
                <div className="form-group"><label>Date</label><input type="date" value={eForm.expense_date} onChange={e => setEForm({...eForm, expense_date: e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Payment Method</label><select value={eForm.payment_method} onChange={e => setEForm({...eForm, payment_method: e.target.value})}><option value="cash">Cash</option><option value="UPI">UPI</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option></select></div>
                <div className="form-group"><label>Vendor</label><input value={eForm.vendor_name} onChange={e => setEForm({...eForm, vendor_name: e.target.value})} placeholder="Vendor name"/></div>
              </div>
              <div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Expense</button></div>
            </form>
          </div>
        </div>
      )}

      {summary && (
        <div className="expense-summary">
          <div className="summary-card">
            <h3>Total This Month</h3>
            <span className="amount">₹{parseFloat(summary.total || 0).toLocaleString()}</span>
          </div>
          <div className="summary-breakdown">
            {summary.byCategory?.slice(0, 5).map(cat => (
              <div key={cat.category} className="category-item">
                <span className="category-name">{cat.category}</span>
                <span className="category-amount">₹{parseFloat(cat.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="expenses-list">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-item">
            <div className="expense-info">
              <span className="expense-category">{expense.category}</span>
              <span className="expense-desc">{expense.description}</span>
              <span className="expense-date">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="expense-amount">
              -₹{parseFloat(expense.amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Reports Component
const Reports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/profit-loss', { params: { year, month } });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Monthly P&L Report</h1>
        <div className="report-filters">
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{format(new Date(2024, m - 1), 'MMMM')}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {report && (
        <>
          <div className="report-summary">
            <div className="summary-item">
              <span className="label">Total Revenue</span>
              <span className="value">₹{report.totals.total_gross.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Commissions</span>
              <span className="value">-₹{report.totals.total_commission.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Expenses</span>
              <span className="value">-₹{report.totals.total_expenses.toLocaleString()}</span>
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
                  <th>Occupancy %</th>
                  <th>Gross Revenue</th>
                  <th>Commission</th>
                  <th>Expenses</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {report.properties.map(prop => (
                  <tr key={prop.property_id}>
                    <td>{prop.property_name}</td>
                    <td>{prop.occupancy_percent}%</td>
                    <td>₹{prop.gross_revenue.toLocaleString()}</td>
                    <td>-₹{prop.commission.toLocaleString()}</td>
                    <td>-₹{prop.expenses.toLocaleString()}</td>
                    <td className="profit">₹{prop.net_profit.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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
          <button className="icon-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
          <button className="icon-btn">
            <Settings size={20} />
          </button>
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
