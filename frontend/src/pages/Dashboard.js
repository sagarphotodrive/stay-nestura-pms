import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee, BarChart3,
  Plus, Calendar, LogOut,
  UserCheck, Users, Clock,
  X, FileText
} from 'lucide-react';
import { api, socket } from '../lib/api';
import { format, safeFormat } from '../lib/format';
import { generateBookingBillPDF } from '../lib/pdf';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';

// Generate Bill modal — property -> date -> booking -> PDF
const GenerateBillModal = ({ onClose }) => {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [date, setDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    api.get('/properties').then(res => setProperties(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!propertyId || !date) { setBookings([]); return; }
    setLoadingBookings(true);
    api.get('/bookings', { params: { property_id: propertyId, start_date: date, end_date: date, limit: 100 } })
      .then(res => setBookings((res.data.bookings || res.data || []).filter(b => b.booking_status !== 'cancelled')))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, [propertyId, date]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>Generate Bill</h2><button className="modal-close" onClick={onClose}><X size={20}/></button></div>
        <div className="modal-form">
          <div className="form-group">
            <label>Property *</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)}>
              <option value="">Select property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {propertyId && date && (
            loadingBookings ? <LoadingSpinner /> : (
              bookings.length === 0 ? (
                <p className="empty-state">No bookings found for this property on this date.</p>
              ) : (
                <div className="form-group">
                  <label>Select Booking *</label>
                  {bookings.map(b => (
                    <div key={b.id} className="booking-item" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => { generateBookingBillPDF(b); onClose(); }}>
                      <div className="booking-info">
                        <span className="booking-guest">{b.first_name} {b.last_name}</span>
                        <span className="booking-property">{safeFormat(b.check_in, 'MMM dd')} - {safeFormat(b.check_out, 'MMM dd, yyyy')} | ₹{(parseFloat(b.gross_amount || b.net_amount) || 0).toLocaleString()}</span>
                      </div>
                      <FileText size={16} />
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBillModal, setShowBillModal] = useState(false);

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

  const totalPending = (stats?.pending || []).reduce((s, p) => s + (p.pending_amount || 0), 0);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your property overview.</p>
      </div>

      <div className="stats-grid">
        {(stats?.pending_requests || 0) > 0 && (
          <Link to="/bookings?filter=pending" style={{ textDecoration: 'none', color: 'inherit' }}>
            <StatCard
              title="Pending Requests"
              value={stats.pending_requests}
              icon={Clock}
              color="#d97706"
            />
          </Link>
        )}
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
          title="Currently Staying"
          value={stats?.today?.currently_staying || 0}
          icon={Users}
          color="#8b5cf6"
        />
        <StatCard
          title="This Month Revenue"
          value={`₹${(stats?.month?.gross_revenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="#3b82f6"
        />
      </div>

      {/* Financial Pacing */}
      {stats?.pacing && (
        <div className="card pacing-widget" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Revenue Pacing</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Day {stats.pacing.days_elapsed} of {stats.pacing.days_in_month}</span>
          </div>
          <div className="card-content">
            <div className="pacing-row">
              <div className="pacing-item">
                <span className="pacing-label">Current Month</span>
                <span className="pacing-value">₹{stats.pacing.current_month.toLocaleString()}</span>
              </div>
              <div className="pacing-item">
                <span className="pacing-label">Last Month (Full)</span>
                <span className="pacing-value">₹{stats.pacing.prev_month.toLocaleString()}</span>
              </div>
              <div className="pacing-item">
                <span className="pacing-label">Projected</span>
                <span className="pacing-value">₹{stats.pacing.projected_month_end.toLocaleString()}</span>
              </div>
              <div className="pacing-item">
                <span className="pacing-label">vs Last Month</span>
                <span className={`pacing-value ${stats.pacing.delta_pct >= 0 ? 'text-green' : 'text-red'}`}>
                  {stats.pacing.delta_pct >= 0 ? '+' : ''}{stats.pacing.delta_pct}%
                </span>
              </div>
            </div>
            <div className="pacing-bar-container">
              <div className="pacing-bar-track">
                <div className="pacing-bar-fill" style={{ width: `${Math.min(100, stats.pacing.prev_month > 0 ? (stats.pacing.current_month / stats.pacing.prev_month * 100) : 100)}%` }} />
                <div className="pacing-bar-marker" style={{ left: `${Math.min(100, (stats.pacing.days_elapsed / stats.pacing.days_in_month) * 100)}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                <span>₹0</span>
                <span>Last month: ₹{stats.pacing.prev_month.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3>This Month Occupancy</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{stats?.month?.total_bookings || 0} bookings</span>
          </div>
          <div className="card-content">
            {stats?.occupancy?.length > 0 ? stats.occupancy.map((prop) => (
              <div key={prop.name} className="occupancy-item">
                <span className="occupancy-name">{prop.name}</span>
                <div className="occupancy-bar">
                  <div
                    className="occupancy-fill"
                    style={{ width: `${Math.min(prop.occupancy, 100)}%` }}
                  />
                </div>
                <span className="occupancy-percent">{prop.occupancy}%</span>
              </div>
            )) : <p className="empty-state">No properties found</p>}
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
                    {booking.check_in ? format(new Date(booking.check_in + 'T00:00:00'), 'MMM dd') : '-'}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">No upcoming bookings</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      {(stats?.pending?.length || 0) > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <h3>Pending Payments</h3>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>₹{totalPending.toLocaleString()} due</span>
          </div>
          <div className="card-content">
            {stats.pending.map(p => (
              <div key={p.id} className="booking-item">
                <div className="booking-info">
                  <span className="booking-guest">{p.guest_name}</span>
                  <span className="booking-property">{p.property_name} | {p.check_in ? format(new Date(p.check_in + 'T00:00:00'), 'MMM dd') : ''}</span>
                </div>
                <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '14px' }}>₹{(p.pending_amount || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <Link to="/guests?action=new" className="action-btn">
            <Users size={20} />
            <span>Add Guest</span>
          </Link>
          <Link to="/reports" className="action-btn">
            <BarChart3 size={20} />
            <span>View Reports</span>
          </Link>
          <button type="button" className="action-btn" onClick={() => setShowBillModal(true)}>
            <FileText size={20} />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {showBillModal && <GenerateBillModal onClose={() => setShowBillModal(false)} />}
    </div>
  );
};

export default Dashboard;
