import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays } from 'date-fns';
import { AlertCircle, Copy, Link2, ExternalLink, Trash2, Plus, X } from 'lucide-react';
import { api } from '../lib/api';
import { format, safeFormat } from '../lib/format';
import { openWhatsApp, copyBookingMessage } from '../lib/whatsapp';
import LoadingSpinner from '../components/LoadingSpinner';

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
                <span className="detail-value">{safeFormat(selectedBooking.check_in, 'MMM dd, yyyy')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Check-out</span>
                <span className="detail-value">{safeFormat(selectedBooking.check_out, 'MMM dd, yyyy')}</span>
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
              <div className="availability-indicator conflict" style={{ marginTop: '12px' }}>
                <AlertCircle size={16} /> Guest ID proof (address visible) required at <strong>guestdetails@staynestura.com</strong> — entry may be denied if not received, regardless of check-in time. Extra guests/services are chargeable and require valid address proof.
              </div>
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

export default MasterCalendar;
