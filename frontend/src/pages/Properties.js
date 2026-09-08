import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, Edit3, Trash2, Building2, Users } from 'lucide-react';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

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

export default Properties;
