import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, X, Search, Edit3 } from 'lucide-react';
import { api } from '../lib/api';
import { safeFormat } from '../lib/format';
import LoadingSpinner from '../components/LoadingSpinner';
import PhoneInput from '../components/PhoneInput';

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

  useEffect(() => { fetchGuests(); setGuestPage(1); }, [search]);
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
                <div className="form-group"><label>Phone *</label><PhoneInput required value={gForm.phone} onChange={v => setGForm({...gForm, phone: v})} placeholder="Phone number"/></div>
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
          <div className="pagination">
            <button className="btn btn-sm btn-secondary" disabled={guestPage === 1} onClick={() => setGuestPage(guestPage - 1)}>Prev</button>
            <span className="pagination-text">Page {guestPage} of {Math.ceil(guests.length / GUESTS_PER_PAGE)}</span>
            <button className="btn btn-sm btn-secondary" disabled={guestPage >= Math.ceil(guests.length / GUESTS_PER_PAGE)} onClick={() => setGuestPage(guestPage + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Guest Detail Modal with Booking History */}
      {selectedGuest && (
        <div className="modal-overlay" onClick={() => setSelectedGuest(null)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedGuest.first_name} {selectedGuest.last_name}</h2>
              <button className="modal-close" onClick={() => setSelectedGuest(null)}><X size={20}/></button>
            </div>
            <div className="guest-detail-body">
              <div className="guest-detail-grid">
                <div><span className="detail-label-sm">Phone</span><div className="detail-value-sm">{selectedGuest.phone || '-'}</div></div>
                <div><span className="detail-label-sm">Email</span><div className="detail-value-sm">{selectedGuest.email || '-'}</div></div>
                <div><span className="detail-label-sm">Nationality</span><div className="detail-value-sm">{selectedGuest.nationality || '-'}</div></div>
                <div><span className="detail-label-sm">Total Stays</span><div className="detail-value-sm">{selectedGuest.total_stays || 0}</div></div>
                {selectedGuest.notes && <div><span className="detail-label-sm">Notes</span><div className="detail-value-sm">{selectedGuest.notes}</div></div>}
              </div>

              <h3 className="guest-booking-history-title">Booking History</h3>
              {guestBookings.length > 0 ? (
                <div className="guest-booking-list">
                  {guestBookings.map(b => (
                    <div key={b.id} onClick={() => { setSelectedGuest(null); navigate(`/bookings?view=${b.id}`); }} className="guest-booking-item">
                      <div>
                        <div className="guest-booking-prop">{b.property_name || 'Property'}</div>
                        <div className="guest-booking-dates">
                          {safeFormat(b.check_in, 'MMM dd')} → {safeFormat(b.check_out, 'MMM dd, yyyy')} | {b.channel || 'direct'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="guest-booking-amount">₹{(b.net_amount || 0).toLocaleString()}</div>
                        <span className={`status-badge ${b.booking_status}`} style={{ fontSize: '11px' }}>{(b.booking_status || '').replace(/-/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No bookings found for this guest</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guests;
