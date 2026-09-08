import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, X, ChevronRight, CheckCircle, AlertCircle,
  Edit3, FileText, Copy, IndianRupee, Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { format, safeFormat, toPaise, paiseToRupees, computeNights } from '../lib/format';
import { generateBookingBillPDF } from '../lib/pdf';
import { openWhatsApp, copyBookingMessage } from '../lib/whatsapp';
import LoadingSpinner from '../components/LoadingSpinner';
import PhoneInput from '../components/PhoneInput';

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
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const emptyBForm = { property_id: '', first_name: '', last_name: '', phone: '', email: '', check_in: '', check_out: '', adults: 1, children: 0, nightly_rate: '', final_amount: '', channel: 'direct', payment_method: 'UPI', special_requests: '', advance_paid: 0 };
  const [bForm, setBForm] = useState(emptyBForm);

  // Auto-open prefilled form from calendar click or homepage action=new
  useEffect(() => {
    const pid = searchParams.get('property_id');
    const ci = searchParams.get('check_in');
    const co = searchParams.get('check_out');
    const rate = searchParams.get('nightly_rate');
    const action = searchParams.get('action');
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setFilter(filterParam);
      setSearchParams({}, { replace: true });
    }
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
    setBForm({ property_id: String(b.property_id), first_name: b.first_name || '', last_name: b.last_name || '', phone: b.phone || '', email: b.email || '', check_in: b.check_in, check_out: b.check_out, adults: b.adults || 1, children: b.children || 0, nightly_rate: b.nightly_rate || '', final_amount: (b.gross_amount != null ? b.gross_amount : '') , channel: b.channel || 'direct', payment_method: b.payment_method || 'UPI', special_requests: b.special_requests || '', advance_paid: b.paid_amount || 0 });
    setShowForm(true);
  };

  const pendingCount = allBookings.filter(b => b.booking_status === 'pending').length;

  const bNights = computeNights(bForm.check_in, bForm.check_out);
  const bPerDayPaise = toPaise(bForm.nightly_rate);
  const bFinalPaise = toPaise(bForm.final_amount);
  const bCalculatedPaise = bPerDayPaise * bNights;
  const bAmountsReady = bForm.nightly_rate !== '' && bForm.final_amount !== '' && bNights > 0;
  const bAmountsMatch = !bAmountsReady || bCalculatedPaise === bFinalPaise;

  const handlePerDayChange = (val) => {
    setBForm(prev => {
      const next = { ...prev, nightly_rate: val };
      const nights = computeNights(prev.check_in, prev.check_out);
      if (nights > 0 && val !== '') next.final_amount = paiseToRupees(toPaise(val) * nights).toFixed(2);
      return next;
    });
  };

  const handleFinalAmountChange = (val) => {
    setBForm(prev => {
      const next = { ...prev, final_amount: val };
      const nights = computeNights(prev.check_in, prev.check_out);
      if (nights > 0 && val !== '') next.nightly_rate = paiseToRupees(toPaise(val) / nights).toFixed(2);
      return next;
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!bForm.check_in || !bForm.check_out || bForm.check_in >= bForm.check_out) {
      alert('Check-out date must be after check-in date.');
      return;
    }
    if (!bForm.property_id) {
      alert('Please select a property.');
      return;
    }
    if (bNights <= 0) {
      alert('Number of days must be greater than zero.');
      return;
    }
    if (!(parseFloat(bForm.nightly_rate) > 0) || !(parseFloat(bForm.final_amount) > 0)) {
      alert('Per-day amount and final amount must be greater than zero.');
      return;
    }
    if (!bAmountsMatch) {
      alert('Amount mismatch: Per-day amount × number of days does not match the final amount. Please check the entered amounts.');
      return;
    }
    if (availabilityStatus && !availabilityStatus.available) {
      alert('Cannot save booking: dates conflict with an existing booking.\n\n' + availabilityStatus.conflicts.map(c => `• ${c.guest_name} (${c.check_in} to ${c.check_out})`).join('\n'));
      return;
    }
    setSubmitting(true);
    try {
      const gross = paiseToRupees(bFinalPaise);
      const advancePaid = parseFloat(bForm.advance_paid) || 0;
      const data = { ...bForm, property_id: parseInt(bForm.property_id), nightly_rate: parseFloat(bForm.nightly_rate), gross_amount: gross, adults: parseInt(bForm.adults), children: parseInt(bForm.children), paid_amount: advancePaid, pending_amount: gross - advancePaid, payment_status: advancePaid >= gross ? 'paid' : advancePaid > 0 ? 'partial' : 'pending' };
      if (editId) { await api.put(`/bookings/${editId}`, data); } else { await api.post('/bookings', data); }
      setShowForm(false);
      setBForm(emptyBForm);
      setEditId(null);
      setAvailabilityStatus(null);
      fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save booking';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update status';
      alert(msg);
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
              <div className="form-group"><label>Property *</label><select required value={bForm.property_id} onChange={e => { const p = properties.find(pr => pr.id === parseInt(e.target.value)); setBForm(prev => ({...prev, property_id: e.target.value})); if (p && !bForm.nightly_rate) handlePerDayChange(String(p.base_price)); }}><option value="">Select property</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.base_price}/night</option>)}</select></div>

              <h4 style={{ margin: '12px 0 8px', color: '#94a3b8', fontSize: '14px' }}>Guest Details</h4>
              <div className="form-row">
                <div className="form-group"><label>First Name *</label><input required value={bForm.first_name} onChange={e => setBForm({...bForm, first_name: e.target.value})} placeholder="First name"/></div>
                <div className="form-group"><label>Last Name *</label><input required value={bForm.last_name} onChange={e => setBForm({...bForm, last_name: e.target.value})} placeholder="Last name"/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone *</label><PhoneInput required value={bForm.phone} onChange={v => setBForm({...bForm, phone: v})} placeholder="Mobile number"/></div>
                <div className="form-group"><label>Email</label><input type="email" value={bForm.email} onChange={e => setBForm({...bForm, email: e.target.value})} placeholder="Email address"/></div>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '-4px 0 12px' }}>
                Reminder: all guests' ID proofs (address visible) must be collected — send/forward to <strong>guestdetails@staynestura.com</strong>. Entry may be denied without them, regardless of check-in time.
              </p>

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
                <div className="form-group"><label>Number of Nights</label><input type="text" readOnly value={bNights > 0 ? bNights : (bForm.check_in && bForm.check_out ? '0' : 'Select dates')} style={{ background: '#1e293b', color: '#e2e8f0', fontWeight: 600 }}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Per Day Amount (₹) *</label><input required type="number" step="0.01" min="0" value={bForm.nightly_rate} onChange={e => handlePerDayChange(e.target.value)} placeholder="e.g. 1800"/></div>
                <div className="form-group"><label>Final Amount (₹) *</label><input required type="number" step="0.01" min="0" value={bForm.final_amount} onChange={e => handleFinalAmountChange(e.target.value)} placeholder="e.g. 7200" style={!bAmountsMatch ? { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' } : undefined}/></div>
              </div>
              {bAmountsReady && (
                <div className={`availability-indicator ${bAmountsMatch ? 'available' : 'conflict'}`} style={{ marginBottom: '12px' }}>
                  {bAmountsMatch ? (
                    <><CheckCircle size={16} /> ₹{parseFloat(bForm.nightly_rate).toLocaleString()} × {bNights} = ₹{paiseToRupees(bCalculatedPaise).toLocaleString()} — Amounts match</>
                  ) : (
                    <><AlertCircle size={16} /> ₹{parseFloat(bForm.nightly_rate).toLocaleString()} × {bNights} = ₹{paiseToRupees(bCalculatedPaise).toLocaleString()} — Amount mismatch. Per-day amount × number of days must equal final amount.</>
                  )}
                </div>
              )}
              <div className="form-row">
                <div className="form-group"><label>Advance Paid (₹)</label><input type="number" min="0" value={bForm.advance_paid} onChange={e => setBForm({...bForm, advance_paid: e.target.value})} placeholder="0"/></div>
                <div className="form-group"><label>Balance Due (₹)</label><input type="text" readOnly value={bForm.final_amount !== '' ? `₹${(paiseToRupees(bFinalPaise) - (parseFloat(bForm.advance_paid) || 0)).toLocaleString()}` : 'Fill amounts'} style={{ background: '#1e293b', fontWeight: 600, color: bForm.final_amount !== '' && (paiseToRupees(bFinalPaise) - (parseFloat(bForm.advance_paid) || 0)) > 0 ? '#ef4444' : '#10b981' }}/></div>
                <div className="form-group"><label>Payment Method</label><select value={bForm.payment_method} onChange={e => setBForm({...bForm, payment_method: e.target.value})}><option value="UPI">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option></select></div>
              </div>
              <div className="form-group"><label>Special Requests</label><textarea value={bForm.special_requests} onChange={e => setBForm({...bForm, special_requests: e.target.value})} rows="2" placeholder="Any special requests..."/></div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !bAmountsMatch || (!editId && availabilityStatus && !availabilityStatus.available)}>{submitting ? 'Saving...' : editId ? 'Save Changes' : 'Create Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          Pending{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
        <button className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`} onClick={() => setFilter('confirmed')}>Confirmed</button>
        <button className={`filter-btn ${filter === 'checked-in' ? 'active' : ''}`} onClick={() => setFilter('checked-in')}>Checked In</button>
        <button className={`filter-btn ${filter === 'checked-out' ? 'active' : ''}`} onClick={() => setFilter('checked-out')}>Checked Out</button>
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
                    {safeFormat(booking.check_in, 'MMM dd, yyyy')}
                  </span>
                  <ChevronRight size={16} />
                  <span className="check-out">
                    <strong>Check-out</strong>
                    {format(new Date(booking.check_out), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              <div className="booking-amount">
                <span className="amount">₹{(parseFloat(booking.gross_amount || booking.net_amount) || 0).toLocaleString()}</span>
                <span className="channel">{booking.channel === 'direct' ? 'Offline' : booking.channel}</span>
                {(booking.paid_amount || 0) > 0 && <span className="text-success" style={{fontSize:'12px'}}>Paid: ₹{(parseFloat(booking.paid_amount) || 0).toLocaleString()}</span>}
                {(booking.pending_amount || 0) > 0 && <span className="text-danger" style={{fontSize:'12px'}}>Due: ₹{parseFloat(booking.pending_amount).toLocaleString()}</span>}
              </div>
            </div>
            <div className="booking-actions">
              <span className={`status-badge ${booking.booking_status}`}>
                {(booking.booking_status || '').replace(/-/g, ' ')}
              </span>
              <button className="btn btn-sm btn-edit" onClick={() => openEdit(booking)}><Edit3 size={14} /> Edit</button>
              <button className="btn btn-sm btn-secondary" onClick={() => generateBookingBillPDF(booking)} title="Download PDF bill"><FileText size={14} /> Bill</button>
              {booking.booking_status === 'pending' && (
                <>
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(booking.id, 'confirmed')}><CheckCircle size={14} /> Confirm Booking</button>
                  <button className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Decline this booking request?')) updateStatus(booking.id, 'cancelled'); }}>Decline</button>
                </>
              )}
              {booking.booking_status !== 'cancelled' && booking.booking_status !== 'pending' && (
                <>
                  <button className="btn btn-sm btn-whatsapp" onClick={() => openWhatsApp(booking)} title="Send via WhatsApp">WhatsApp</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => copyBookingMessage(booking)} title="Copy message"><Copy size={14} /></button>
                </>
              )}
              {(booking.pending_amount || 0) > 0 && booking.booking_status !== 'cancelled' && booking.booking_status !== 'pending' && (
                <button className="btn btn-sm btn-success" onClick={() => recordPayment(booking)}><IndianRupee size={14} /> Record Payment</button>
              )}
              {booking.booking_status === 'confirmed' && (
                <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked-in')}>Check In</button>
              )}
              {booking.booking_status === 'checked-in' && (
                <>
                  <button className="btn btn-sm" onClick={() => updateStatus(booking.id, 'checked-out')}>Check Out</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => { if(window.confirm('Revert to Confirmed?')) updateStatus(booking.id, 'confirmed'); }}>Undo Check In</button>
                </>
              )}
              {booking.booking_status === 'checked-out' && (
                <button className="btn btn-sm btn-secondary" onClick={() => { if(window.confirm('Revert to Checked In?')) updateStatus(booking.id, 'checked-in'); }}>Undo Check Out</button>
              )}
              {booking.booking_status === 'cancelled' && (
                <>
                  <button className="btn btn-sm btn-success" onClick={() => { if(window.confirm('Rebook this booking?')) updateStatus(booking.id, 'confirmed'); }}>Rebook</button>
                  <button className="btn btn-sm btn-danger" onClick={async () => { if(window.confirm('Permanently delete this cancelled booking? This cannot be undone.')) { try { await api.delete(`/bookings/${booking.id}`); fetchBookings(); } catch(err) { alert('Failed to delete'); } } }}><Trash2 size={14} /> Delete</button>
                </>
              )}
              {booking.booking_status !== 'cancelled' && booking.booking_status !== 'pending' && (
                <button className="btn btn-sm btn-danger" onClick={() => { if(window.confirm('Cancel this booking?')) updateStatus(booking.id, 'cancelled'); }}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookings;
