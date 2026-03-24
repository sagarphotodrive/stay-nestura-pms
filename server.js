// Stay Nestura Properties Management System
// Main Server Entry Point
// MongoDB Atlas - stay_nestura database

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
require('dotenv').config();

// Import in-memory data store (fallback when no MongoDB)
const { store } = require('./backend/config/database');

// MongoDB support
const { connectDB, isMongoConnected } = require('./backend/config/mongoose');
const { Property, Guest, Booking, Expense, ChannelAccount, User, Availability, SyncLog, Counter } = require('./backend/models');

// Helper: get next auto-increment ID for MongoDB
async function nextId(collection) {
  return Counter.getNextId(collection);
}

// Import auth route (has demo login)
const authRoutes = require('./backend/routes/auth');

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time updates
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', `http://localhost:${process.env.PORT || 5000}`],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Auth route
app.use('/api/auth', authRoutes);

// ============ API ROUTES (MongoDB or In-Memory) ============
let _idCounter = 500;
const _nextId = () => ++_idCounter;

// useMongo flag — set after connectDB() resolves
let useMongo = false;

// --- PROPERTIES ---
app.get('/api/properties', async (req, res) => {
  try {
    if (useMongo) {
      const props = await Property.find({ is_active: true }).lean();
      const bookings = await Booking.find({ booking_status: { $ne: 'cancelled' } }).lean();
      const enriched = props.map(p => {
        const bks = bookings.filter(b => b.property_id === p.id);
        return { ...p, current_bookings: bks.length, month_revenue: bks.reduce((s,b) => s + (b.net_amount||0), 0) };
      });
      return res.json(enriched);
    }
    const active = store.properties.filter(p => p.is_active !== false);
    const enriched = active.map(p => {
      const bks = store.bookings.filter(b => b.property_id === p.id && b.booking_status !== 'cancelled');
      return { ...p, current_bookings: bks.length, month_revenue: bks.reduce((s,b) => s + (b.net_amount||0), 0) };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/properties/:id', async (req, res) => {
  try {
    if (useMongo) {
      const prop = await Property.findOne({ id: parseInt(req.params.id) }).lean();
      if (!prop) return res.status(404).json({ error: 'Not found' });
      const avail = await Availability.find({ property_id: prop.id }).lean();
      return res.json({ ...prop, availability: avail });
    }
    const prop = store.properties.find(p => p.id == req.params.id);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    const avail = store.availability.filter(a => a.property_id === prop.id);
    res.json({ ...prop, availability: avail });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/properties', async (req, res) => {
  try {
    const b = req.body;
    if (useMongo) {
      const id = await nextId('properties');
      const prop = await Property.create({ id, name: b.name, property_type: b.property_type || 'Homestay', address: b.address, city: b.city, state: b.state, pincode: b.pincode, total_rooms: b.total_rooms || 1, max_guests: b.max_guests || 2, base_price: b.base_price || 0, description: b.description, amenities: b.amenities || [], images: b.images || [], latitude: b.latitude, longitude: b.longitude, google_maps_link: b.google_maps_link, is_active: true });
      const availDocs = [];
      for (let i = 0; i < 60; i++) { const d = new Date(); d.setDate(d.getDate()+i); const aid = await nextId('availability'); availDocs.push({ id: aid, property_id: prop.id, date: d.toISOString().split('T')[0], rooms_available: prop.total_rooms, is_blocked: false, min_stay: 1, max_stay: 30 }); }
      await Availability.insertMany(availDocs);
      return res.status(201).json(prop.toObject());
    }
    const prop = { id: _nextId(), name: b.name, property_type: b.property_type || 'Homestay', address: b.address, city: b.city, state: b.state, pincode: b.pincode, total_rooms: b.total_rooms || 1, max_guests: b.max_guests || 2, base_price: b.base_price || 0, description: b.description, amenities: b.amenities || [], images: b.images || [], latitude: b.latitude, longitude: b.longitude, google_maps_link: b.google_maps_link, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.properties.push(prop);
    for (let i = 0; i < 60; i++) { const d = new Date(); d.setDate(d.getDate()+i); store.availability.push({ id: _nextId(), property_id: prop.id, date: d.toISOString().split('T')[0], rooms_available: prop.total_rooms, is_blocked: false, blocked_reason: null, min_stay: 1, max_stay: 30, closed_to_arrival: false, closed_to_departure: false, updated_at: new Date().toISOString() }); }
    res.status(201).json(prop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/properties/:id', async (req, res) => {
  try {
    if (useMongo) {
      const prop = await Property.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: req.body }, { new: true }).lean();
      if (!prop) return res.status(404).json({ error: 'Not found' });
      return res.json(prop);
    }
    const prop = store.properties.find(p => p.id == req.params.id);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    Object.assign(prop, req.body, { updated_at: new Date().toISOString() });
    res.json(prop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/properties/:id', async (req, res) => {
  try {
    if (useMongo) {
      await Property.findOneAndUpdate({ id: parseInt(req.params.id) }, { is_active: false });
      return res.json({ message: 'Deleted' });
    }
    const prop = store.properties.find(p => p.id == req.params.id);
    if (prop) prop.is_active = false;
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/properties/:id/calendar', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (useMongo) {
      const filter = { property_id: parseInt(req.params.id) };
      if (start) filter.date = { ...filter.date, $gte: start };
      if (end) filter.date = { ...filter.date, $lte: end };
      return res.json(await Availability.find(filter).lean());
    }
    let avail = store.availability.filter(a => a.property_id == req.params.id);
    if (start) avail = avail.filter(a => a.date >= start);
    if (end) avail = avail.filter(a => a.date <= end);
    res.json(avail);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/properties/:id/block', async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;
    if (useMongo) {
      await Availability.updateMany({ property_id: parseInt(req.params.id), date: { $gte: start_date, $lte: end_date } }, { is_blocked: true, blocked_reason: reason });
      return res.json({ message: 'Dates blocked' });
    }
    store.availability.forEach(a => { if (a.property_id == req.params.id && a.date >= start_date && a.date <= end_date) { a.is_blocked = true; a.blocked_reason = reason; } });
    res.json({ message: 'Dates blocked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/properties/:id/rates', async (req, res) => {
  try {
    const { rates } = req.body;
    if (useMongo && rates) {
      for (const r of rates) { await Availability.findOneAndUpdate({ property_id: parseInt(req.params.id), date: r.date }, { rooms_available: r.rate, min_stay: r.min_stay, max_stay: r.max_stay }); }
      return res.json({ message: 'Rates updated' });
    }
    if (rates) rates.forEach(r => { const a = store.availability.find(av => av.property_id == req.params.id && av.date === r.date); if (a) { a.rooms_available = r.rate || a.rooms_available; a.min_stay = r.min_stay || a.min_stay; a.max_stay = r.max_stay || a.max_stay; } });
    res.json({ message: 'Rates updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BOOKINGS ---
// Helper: enrich booking with property/guest names
async function enrichBooking(b, propsCache, guestsCache) {
  const p = propsCache ? propsCache.find(pr => pr.id === b.property_id) : (useMongo ? await Property.findOne({ id: b.property_id }).lean() : store.properties.find(pr => pr.id === b.property_id)) || {};
  const g = guestsCache ? guestsCache.find(gs => gs.id === b.guest_id) : (useMongo ? await Guest.findOne({ id: b.guest_id }).lean() : store.guests.find(gs => gs.id === b.guest_id)) || {};
  return { ...b, property_name: p.name, address: p.address, google_maps_link: p.google_maps_link, first_name: g.first_name, last_name: g.last_name, email: g.email, phone: g.phone, guest_name: `${g.first_name || ''} ${g.last_name || ''}`.trim(), guests: (b.adults||0)+(b.children||0) };
}

app.get('/api/bookings/today', async (req, res) => {
  try {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
    let checkIns, checkOuts, currentStay, props, guests;
    if (useMongo) {
      [checkIns, checkOuts, currentStay, props, guests] = await Promise.all([
        Booking.find({ check_in: today, booking_status: { $in: ['confirmed', 'checked-in'] } }).lean(),
        Booking.find({ check_out: today, booking_status: 'checked-in' }).lean(),
        Booking.find({ check_in: { $lte: today }, check_out: { $gt: today }, booking_status: 'checked-in' }).lean(),
        Property.find().lean(), Guest.find().lean()
      ]);
    } else {
      checkIns = store.bookings.filter(b => b.check_in === today && (b.booking_status === 'confirmed' || b.booking_status === 'checked-in'));
      checkOuts = store.bookings.filter(b => b.check_out === today && b.booking_status === 'checked-in');
      currentStay = store.bookings.filter(b => b.check_in <= today && b.check_out > today && b.booking_status === 'checked-in');
      props = store.properties; guests = store.guests;
    }
    res.json({
      checkIns: await Promise.all(checkIns.map(b => enrichBooking(b, props, guests))),
      checkOuts: await Promise.all(checkOuts.map(b => enrichBooking(b, props, guests))),
      currentStay: await Promise.all((currentStay || []).map(b => enrichBooking(b, props, guests)))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/bookings/stats/overview', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const daysInMonth = new Date(year, month, 0).getDate();
    let allBks, allProps;
    if (useMongo) {
      [allBks, allProps] = await Promise.all([Booking.find().lean(), Property.find({ is_active: true }).lean()]);
    } else {
      allBks = store.bookings;
      allProps = store.properties.filter(p => p.is_active);
    }
    let bks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    let cancelledBks = allBks.filter(b => b.booking_status === 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) { bks = bks.filter(b => b.property_id === propFilter); cancelledBks = cancelledBks.filter(b => b.property_id === propFilter); }
    const props = propFilter ? allProps.filter(p => p.id === propFilter) : allProps;
    const monthEnd = new Date(year, month, 1);
    const calcNights = (propBks) => propBks.reduce((s, b) => {
      const ci = new Date(Math.max(new Date(b.check_in), new Date(startDate)));
      const co = new Date(Math.min(new Date(b.check_out), monthEnd));
      return s + Math.max(0, Math.ceil((co - ci) / 86400000));
    }, 0);
    res.json({ summary: { total_bookings: bks.length, cancelled_bookings: cancelledBks.length, total_gross: bks.reduce((s,b) => s+b.gross_amount, 0), total_net: bks.reduce((s,b) => s+b.gross_amount, 0), confirmed_bookings: bks.length, unique_guests: new Set(bks.map(b => b.guest_id)).size }, occupancy: props.map(p => { const propBks = bks.filter(b => b.property_id === p.id); const nightsBooked = calcNights(propBks); const available = p.total_rooms * daysInMonth; return { property_id: p.id, property_name: p.name, total_nights_booked: nightsBooked, total_nights_available: available, occupancy_percent: Math.round(nightsBooked / Math.max(1, available) * 100) }; }) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/bookings/:id', async (req, res) => {
  try {
    let b;
    if (useMongo) { b = await Booking.findOne({ id: parseInt(req.params.id) }).lean(); }
    else { b = store.bookings.find(bk => bk.id == req.params.id); }
    if (!b) return res.status(404).json({ error: 'Not found' });
    const enriched = await enrichBooking(b);
    res.json({ ...enriched, messages: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/bookings', async (req, res) => {
  try {
    let bks, props, guests;
    if (useMongo) {
      const filter = {};
      if (req.query.property_id) filter.property_id = parseInt(req.query.property_id);
      if (req.query.status) filter.booking_status = req.query.status;
      if (req.query.channel) filter.channel = req.query.channel;
      if (req.query.start_date || req.query.end_date) {
        filter.$and = [];
        if (req.query.end_date) filter.$and.push({ check_in: { $lte: req.query.end_date } });
        if (req.query.start_date) filter.$and.push({ check_out: { $gte: req.query.start_date } });
        if (filter.$and.length === 0) delete filter.$and;
      }
      [bks, props, guests] = await Promise.all([Booking.find(filter).lean(), Property.find().lean(), Guest.find().lean()]);
    } else {
      bks = [...store.bookings];
      if (req.query.property_id) bks = bks.filter(b => b.property_id == req.query.property_id);
      if (req.query.status) bks = bks.filter(b => b.booking_status === req.query.status);
      if (req.query.channel) bks = bks.filter(b => b.channel === req.query.channel);
      if (req.query.start_date) bks = bks.filter(b => b.check_out >= req.query.start_date);
      if (req.query.end_date) bks = bks.filter(b => b.check_in <= req.query.end_date);
      props = store.properties; guests = store.guests;
    }
    const enriched = bks.map(b => { const p = (props || []).find(pr => pr.id === b.property_id) || {}; const g = (guests || []).find(gs => gs.id === b.guest_id) || {}; return { ...b, property_name: p.name, address: p.address, google_maps_link: p.google_maps_link, first_name: g.first_name, last_name: g.last_name, email: g.email, phone: g.phone }; });
    const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || (req.query.start_date ? 500 : 20);
    res.json({ bookings: enriched.slice((page-1)*limit, page*limit), total: enriched.length, page, pages: Math.ceil(enriched.length/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/bookings/check-availability', async (req, res) => {
  try {
    const { property_id, check_in, check_out, exclude_booking_id } = req.query;
    if (!property_id || !check_in || !check_out) return res.json({ available: true, conflicts: [] });
    const excludeId = exclude_booking_id ? parseInt(exclude_booking_id) : null;
    let conflictBookings;
    if (useMongo) {
      const filter = { property_id: parseInt(property_id), booking_status: { $ne: 'cancelled' }, check_in: { $lt: check_out }, check_out: { $gt: check_in } };
      if (excludeId) filter.id = { $ne: excludeId };
      conflictBookings = await Booking.find(filter).lean();
    } else {
      conflictBookings = store.bookings.filter(b => b.property_id == property_id && b.booking_status !== 'cancelled' && b.check_in < check_out && b.check_out > check_in && (!excludeId || b.id !== excludeId));
    }
    const guestsList = useMongo ? await Guest.find().lean() : store.guests;
    const conflicts = conflictBookings.map(b => { const g = guestsList.find(gs => gs.id === b.guest_id) || {}; return { id: b.id, guest_name: `${g.first_name || ''} ${g.last_name || ''}`.trim(), check_in: b.check_in, check_out: b.check_out, channel: b.channel }; });
    res.json({ available: conflicts.length === 0, conflicts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bookings', async (req, res) => {
  try {
    const b = req.body;
    let guestId = b.guest_id ? parseInt(b.guest_id) : null;
    if (!guestId && (b.first_name || b.phone)) {
      const key = [(b.first_name||'').trim().toLowerCase(), (b.last_name||'').trim().toLowerCase(), (b.phone||'').trim(), (b.email||'').trim().toLowerCase()].join('|');
      let guest;
      if (useMongo) {
        const allGuests = await Guest.find().lean();
        guest = allGuests.find(g => [(g.first_name||'').trim().toLowerCase(), (g.last_name||'').trim().toLowerCase(), (g.phone||'').trim(), (g.email||'').trim().toLowerCase()].join('|') === key);
        if (!guest) {
          const gid = await nextId('guests');
          guest = await Guest.create({ id: gid, first_name: (b.first_name||'').trim(), last_name: (b.last_name||'').trim(), email: (b.email||'').trim(), phone: (b.phone||'').trim(), nationality: 'Indian' });
          guest = guest.toObject();
        }
      } else {
        guest = store.guests.find(g => [(g.first_name||'').trim().toLowerCase(), (g.last_name||'').trim().toLowerCase(), (g.phone||'').trim(), (g.email||'').trim().toLowerCase()].join('|') === key);
        if (!guest) {
          guest = { id: _nextId(), first_name: (b.first_name||'').trim(), last_name: (b.last_name||'').trim(), email: (b.email||'').trim(), phone: (b.phone||'').trim(), id_proof_type: null, id_proof_number: null, id_proof_encrypted: null, address: '', date_of_birth: null, nationality: 'Indian', total_stays: 0, total_spent: 0, lifetime_value: 0, preferences: '', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          store.guests.push(guest);
        }
      }
      guestId = guest.id;
    }
    const nights = Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / 86400000));
    const subtotal = (b.nightly_rate || 0) * nights;
    const gross = (b.gross_amount || subtotal + (b.cleaning_fee||0) + (b.service_fee||0) + (b.taxes||0));
    const bookingData = { property_id: parseInt(b.property_id), guest_id: guestId, channel: b.channel || 'direct', channel_booking_id: b.channel_booking_id, check_in: b.check_in, check_out: b.check_out, adults: b.adults || 1, children: b.children || 0, infants: b.infants || 0, nightly_rate: b.nightly_rate || 0, subtotal, cleaning_fee: b.cleaning_fee || 0, service_fee: b.service_fee || 0, taxes: b.taxes || 0, gross_amount: gross, commission_percent: 0, commission_amount: 0, net_amount: gross, currency: 'INR', payment_status: b.payment_status || 'pending', payment_method: b.payment_method, paid_amount: b.paid_amount || 0, pending_amount: gross - (b.paid_amount || 0), booking_status: 'confirmed', guest_message: b.guest_message || '', special_requests: b.special_requests || '', check_in_time: b.check_in_time || '4:00 PM', check_out_time: b.check_out_time || '2:00 PM', confirmed_at: new Date().toISOString() };

    let booking;
    if (useMongo) {
      const bid = await nextId('bookings');
      booking = await Booking.create({ id: bid, ...bookingData });
      booking = booking.toObject();
      await Guest.findOneAndUpdate({ id: guestId }, { $inc: { total_stays: 1, total_spent: booking.net_amount, lifetime_value: booking.net_amount } });
    } else {
      booking = { id: _nextId(), ...bookingData, actual_check_in: null, actual_check_out: null, cancelled_at: null, cancellation_reason: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.bookings.push(booking);
      const g = store.guests.find(gs => gs.id === booking.guest_id);
      if (g) { g.total_stays++; g.total_spent += booking.net_amount; g.lifetime_value += booking.net_amount; }
    }
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/bookings/:id/status', async (req, res) => {
  try {
    const update = { booking_status: req.body.status };
    if (req.body.status === 'checked_in') update.actual_check_in = new Date().toISOString();
    if (req.body.status === 'checked_out') update.actual_check_out = new Date().toISOString();
    if (req.body.status === 'cancelled') { update.cancelled_at = new Date().toISOString(); update.cancellation_reason = req.body.cancellation_reason; }
    if (useMongo) {
      const b = await Booking.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: update }, { new: true }).lean();
      if (!b) return res.status(404).json({ error: 'Not found' });
      return res.json(b);
    }
    const b = store.bookings.find(bk => bk.id == req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    Object.assign(b, update, { updated_at: new Date().toISOString() });
    res.json(b);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/bookings/:id', async (req, res) => {
  try {
    if (useMongo) {
      const b = await Booking.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: req.body }, { new: true }).lean();
      if (!b) return res.status(404).json({ error: 'Not found' });
      return res.json(b);
    }
    const b = store.bookings.find(bk => bk.id == req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    Object.assign(b, req.body, { updated_at: new Date().toISOString() });
    res.json(b);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.patch('/api/bookings/:id/payment', async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount) || 0;
    if (useMongo) {
      let b = await Booking.findOne({ id: parseInt(req.params.id) });
      if (!b) return res.status(404).json({ error: 'Not found' });
      b.paid_amount = (b.paid_amount || 0) + amount;
      b.pending_amount = (b.gross_amount || 0) - b.paid_amount;
      b.payment_status = b.pending_amount <= 0 ? 'paid' : 'partial';
      if (b.pending_amount < 0) b.pending_amount = 0;
      await b.save();
      return res.json(b.toObject());
    }
    const b = store.bookings.find(bk => bk.id == req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    b.paid_amount = (b.paid_amount || 0) + amount;
    b.pending_amount = (b.gross_amount || 0) - b.paid_amount;
    if (b.pending_amount <= 0) { b.pending_amount = 0; b.payment_status = 'paid'; }
    else { b.payment_status = 'partial'; }
    b.updated_at = new Date().toISOString();
    res.json(b);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    if (useMongo) {
      const b = await Booking.findOne({ id: parseInt(req.params.id) });
      if (!b) return res.status(404).json({ error: 'Not found' });
      if (b.booking_status !== 'cancelled') return res.status(400).json({ error: 'Only cancelled bookings can be deleted' });
      await Booking.deleteOne({ id: parseInt(req.params.id) });
      return res.json({ message: 'Booking deleted' });
    }
    const idx = store.bookings.findIndex(bk => bk.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (store.bookings[idx].booking_status !== 'cancelled') return res.status(400).json({ error: 'Only cancelled bookings can be deleted' });
    store.bookings.splice(idx, 1);
    res.json({ message: 'Booking deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    if (useMongo) {
      const b = await Booking.findOneAndUpdate({ id: parseInt(req.params.id) }, { booking_status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: req.body.cancellation_reason || 'Cancelled' }, { new: true }).lean();
      if (!b) return res.status(404).json({ error: 'Not found' });
      return res.json(b);
    }
    const b = store.bookings.find(bk => bk.id == req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    b.booking_status = 'cancelled'; b.cancelled_at = new Date().toISOString(); b.cancellation_reason = req.body.cancellation_reason || 'Cancelled';
    res.json(b);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GUESTS ---
app.get('/api/guests/search/query', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    if (q.length < 2) return res.json([]);
    if (useMongo) {
      const regex = new RegExp(q, 'i');
      return res.json(await Guest.find({ $or: [{ first_name: regex }, { last_name: regex }, { email: regex }, { phone: regex }] }).limit(10).lean());
    }
    const found = store.guests.filter(g => (g.first_name+' '+g.last_name+' '+g.email+' '+g.phone).toLowerCase().includes(q));
    res.json(found.slice(0, 10));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/guests/vip/list', async (req, res) => {
  try {
    if (useMongo) return res.json(await Guest.find({ $or: [{ total_stays: { $gte: 3 } }, { lifetime_value: { $gte: 50000 } }] }).lean());
    res.json(store.guests.filter(g => g.total_stays >= 3 || g.lifetime_value >= 50000));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/guests/stats/summary', async (req, res) => {
  try {
    const gs = useMongo ? await Guest.find().lean() : store.guests;
    res.json({ total_guests: gs.length, total_stays: gs.reduce((s,g) => s+(g.total_stays||0),0), total_revenue: gs.reduce((s,g) => s+(g.lifetime_value||0),0), avg_lifetime_value: gs.length ? Math.round(gs.reduce((s,g) => s+(g.lifetime_value||0),0)/gs.length) : 0, repeat_guests: gs.filter(g => (g.total_stays||0)>1).length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/guests/:id', async (req, res) => {
  try {
    let g, guestBookings;
    if (useMongo) {
      g = await Guest.findOne({ id: parseInt(req.params.id) }).lean();
      if (!g) return res.status(404).json({ error: 'Not found' });
      const bks = await Booking.find({ guest_id: g.id }).lean();
      const props = await Property.find().lean();
      guestBookings = bks.map(b => { const p = props.find(pr => pr.id === b.property_id) || {}; return { ...b, property_name: p.name }; });
    } else {
      g = store.guests.find(gs => gs.id == req.params.id);
      if (!g) return res.status(404).json({ error: 'Not found' });
      guestBookings = store.bookings.filter(b => b.guest_id === g.id).map(b => { const p = store.properties.find(pr => pr.id === b.property_id) || {}; return { ...b, property_name: p.name }; });
    }
    res.json({ ...g, bookings: guestBookings, messages: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/guests', async (req, res) => {
  try {
    let gs;
    if (useMongo) {
      if (req.query.search) {
        const regex = new RegExp(req.query.search, 'i');
        gs = await Guest.find({ $or: [{ first_name: regex }, { last_name: regex }, { email: regex }, { phone: regex }] }).lean();
      } else { gs = await Guest.find().lean(); }
    } else {
      gs = [...store.guests];
      if (req.query.search) { const s = req.query.search.toLowerCase(); gs = gs.filter(g => (g.first_name+' '+g.last_name+' '+g.email+' '+g.phone).toLowerCase().includes(s)); }
    }
    const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 20;
    res.json({ guests: gs.slice((page-1)*limit, page*limit), total: gs.length, page, pages: Math.ceil(gs.length/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/guests', async (req, res) => {
  try {
    const b = req.body;
    if (useMongo) {
      if (b.phone) {
        const existing = await Guest.findOne({ phone: b.phone });
        if (existing) { Object.assign(existing, b); await existing.save(); return res.json({ ...existing.toObject(), isNew: false }); }
      }
      const gid = await nextId('guests');
      const guest = await Guest.create({ id: gid, ...b });
      return res.status(201).json({ ...guest.toObject(), isNew: true });
    }
    const existing = store.guests.find(g => g.phone === b.phone);
    if (existing) { Object.assign(existing, b, { updated_at: new Date().toISOString() }); return res.json({ ...existing, isNew: false }); }
    const guest = { id: _nextId(), first_name: b.first_name, last_name: b.last_name, email: b.email, phone: b.phone, id_proof_type: b.id_proof_type, id_proof_number: b.id_proof_number, id_proof_encrypted: null, address: b.address, date_of_birth: b.date_of_birth, nationality: b.nationality, total_stays: 0, total_spent: 0, lifetime_value: 0, preferences: b.preferences || '', notes: b.notes || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    store.guests.push(guest);
    res.status(201).json({ ...guest, isNew: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/guests/:id', async (req, res) => {
  try {
    if (useMongo) {
      const g = await Guest.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: req.body }, { new: true }).lean();
      if (!g) return res.status(404).json({ error: 'Not found' });
      return res.json(g);
    }
    const g = store.guests.find(gs => gs.id == req.params.id);
    if (!g) return res.status(404).json({ error: 'Not found' });
    Object.assign(g, req.body, { updated_at: new Date().toISOString() });
    res.json(g);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/guests/:id', async (req, res) => {
  try {
    if (useMongo) { await Guest.findOneAndDelete({ id: parseInt(req.params.id) }); return res.json({ message: 'Deleted' }); }
    const idx = store.guests.findIndex(g => g.id == req.params.id);
    if (idx >= 0) store.guests.splice(idx, 1);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- EXPENSES ---
app.get('/api/expenses/summary', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const allExps = useMongo ? await Expense.find().lean() : store.expenses;
    let exps = allExps.filter(e => e.expense_date >= startDate && e.expense_date <= endDate);
    if (propFilter) exps = exps.filter(e => e.property_id === propFilter || e.property_id === 0);
    const props = useMongo ? await Property.find().lean() : store.properties;
    const byCategory = {}; const byProperty = {};
    exps.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { category: e.category, total: 0, count: 0 };
      byCategory[e.category].total += e.amount; byCategory[e.category].count++;
      const pn = (props.find(p => p.id === e.property_id) || { name: 'General' }).name;
      if (!byProperty[e.property_id]) byProperty[e.property_id] = { property_id: e.property_id, property_name: pn, total: 0 };
      byProperty[e.property_id].total += e.amount;
    });
    res.json({ byCategory: Object.values(byCategory), total: exps.reduce((s,e) => s+e.amount, 0), byProperty: Object.values(byProperty) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/expenses/categories', (req, res) => {
  res.json(['laundry','electricity','water','staff_salary','cleaning','maintenance','internet','supplies','groceries','travel','marketing','other']);
});
app.get('/api/expenses', async (req, res) => {
  try {
    let exps;
    if (useMongo) {
      const filter = {};
      if (req.query.property_id) filter.property_id = parseInt(req.query.property_id);
      if (req.query.category) filter.category = req.query.category;
      exps = await Expense.find(filter).lean();
    } else {
      exps = [...store.expenses];
      if (req.query.property_id) exps = exps.filter(e => e.property_id == req.query.property_id);
      if (req.query.category) exps = exps.filter(e => e.category === req.query.category);
    }
    const props = useMongo ? await Property.find().lean() : store.properties;
    const enriched = exps.map(e => ({ ...e, property_name: e.property_id === 0 ? 'Common - Stay Nestura' : (props.find(p => p.id === e.property_id) || {}).name }));
    const page = parseInt(req.query.page) || 1; const limit = parseInt(req.query.limit) || 50;
    res.json({ expenses: enriched.slice((page-1)*limit, page*limit), total: enriched.length, page, pages: Math.ceil(enriched.length/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/expenses', async (req, res) => {
  try {
    const b = req.body;
    const expData = { property_id: parseInt(b.property_id), category: b.category, subcategory: b.subcategory, description: b.description, amount: parseFloat(b.amount) || 0, payment_method: b.payment_method || 'cash', vendor_name: b.vendor_name, receipt_number: b.receipt_number, expense_date: b.expense_date || new Date().toISOString().split('T')[0], is_recurring: b.is_recurring || false, recurring_frequency: b.recurring_frequency, created_by: 'demo-001' };
    if (useMongo) {
      const eid = await nextId('expenses');
      const exp = await Expense.create({ id: eid, ...expData });
      return res.status(201).json(exp.toObject());
    }
    const exp = { id: _nextId(), ...expData, created_at: new Date().toISOString() };
    store.expenses.push(exp);
    res.status(201).json(exp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/expenses/bulk', async (req, res) => {
  try {
    const items = req.body.expenses || [];
    if (useMongo) {
      const docs = [];
      for (const b of items) { const eid = await nextId('expenses'); docs.push({ id: eid, ...b }); }
      const created = await Expense.insertMany(docs);
      return res.json({ created: created.length, expenses: created });
    }
    const created = items.map(b => { const e = { id: _nextId(), ...b, created_at: new Date().toISOString() }; store.expenses.push(e); return e; });
    res.json({ created: created.length, expenses: created });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/expenses/:id', async (req, res) => {
  try {
    if (useMongo) {
      const e = await Expense.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: req.body }, { new: true }).lean();
      if (!e) return res.status(404).json({ error: 'Not found' });
      return res.json(e);
    }
    const e = store.expenses.find(ex => ex.id == req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    Object.assign(e, req.body); res.json(e);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    if (useMongo) { await Expense.findOneAndDelete({ id: parseInt(req.params.id) }); return res.json({ message: 'Deleted' }); }
    const idx = store.expenses.findIndex(e => e.id == req.params.id);
    if (idx >= 0) store.expenses.splice(idx, 1);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REPORTS ---
app.get('/api/reports/dashboard', async (req, res) => {
  try {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    const bks = allBks.filter(b => b.booking_status !== 'cancelled');
    const props = useMongo ? await Property.find({ is_active: true }).lean() : store.properties.filter(p => p.is_active);
    const guests = useMongo ? await Guest.find().lean() : store.guests;
    const monthStart = today.substring(0, 7) + '-01';
    const monthBks = bks.filter(b => b.check_in >= monthStart && b.check_in <= today);
    res.json({
      today: {
        today_checkins: bks.filter(b => b.check_in === today && (b.booking_status === 'confirmed' || b.booking_status === 'checked-in')).length,
        today_checkouts: bks.filter(b => b.check_out === today && b.booking_status === 'checked-in').length,
        today_revenue: bks.filter(b => b.check_in === today).reduce((s,b) => s+b.net_amount, 0)
      },
      month: { total_bookings: monthBks.length, gross_revenue: monthBks.reduce((s,b) => s+b.gross_amount, 0), net_revenue: monthBks.reduce((s,b) => s+b.net_amount, 0) },
      occupancy: props.map(p => { const pb = bks.filter(b => b.property_id === p.id && b.check_in <= today && b.check_out > today); return { name: p.name, booked_nights: pb.length, available_nights: p.total_rooms * 30, occupancy: Math.round(pb.length / Math.max(1, p.total_rooms * 30) * 100) }; }),
      upcoming: bks.filter(b => b.check_in >= today && b.booking_status === 'confirmed').sort((a,b) => a.check_in.localeCompare(b.check_in)).slice(0, 5).map(b => { const p = props.find(pr => pr.id === b.property_id) || {}; const g = guests.find(gs => gs.id === b.guest_id) || {}; return { id: b.id, check_in: b.check_in, check_out: b.check_out, property_name: p.name, first_name: g.first_name, last_name: g.last_name }; })
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/reports/profit-loss', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const daysInMonth = new Date(year, month, 0).getDate();
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    let bks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) bks = bks.filter(b => b.property_id === propFilter);
    const allExps = useMongo ? await Expense.find().lean() : store.expenses;
    let monthExps = allExps.filter(e => e.expense_date >= startDate && e.expense_date <= endDate);
    if (propFilter) monthExps = monthExps.filter(e => e.property_id === propFilter || e.property_id === 0);
    const commonExps = monthExps.filter(e => e.property_id === 0).reduce((s,e) => s+e.amount, 0);
    const activeProps = useMongo ? await Property.find({ is_active: true }).lean() : store.properties.filter(p => p.is_active);
    const filteredProps = propFilter ? activeProps.filter(p => p.id === propFilter) : activeProps;
    const commonPerProp = filteredProps.length ? Math.round(commonExps / filteredProps.length) : 0;
    const properties = filteredProps.map(p => {
      const pb = bks.filter(b => b.property_id === p.id);
      const nightsSold = pb.reduce((s, b) => {
        const ci = new Date(Math.max(new Date(b.check_in), new Date(startDate)));
        const co = new Date(Math.min(new Date(b.check_out), new Date(year, month, 1)));
        return s + Math.max(0, Math.ceil((co - ci) / 86400000));
      }, 0);
      const gross = pb.reduce((s,b) => s+b.gross_amount, 0);
      const propExps = monthExps.filter(e => e.property_id === p.id).reduce((s,e) => s+e.amount, 0);
      const exps = propExps + commonPerProp;
      const availableNights = p.total_rooms * daysInMonth;
      return { property_id: p.id, property_name: p.name, occupancy_percent: Math.round(nightsSold / Math.max(1, availableNights) * 100), nights_sold: nightsSold, available_nights: availableNights, gross_revenue: gross, expenses: exps, net_profit: gross - exps };
    });
    const totals = { total_gross: properties.reduce((s,p) => s+p.gross_revenue, 0), total_expenses: properties.reduce((s,p) => s+p.expenses, 0), total_net: properties.reduce((s,p) => s+p.net_profit, 0), total_occupancy: properties.length ? Math.round(properties.reduce((s,p) => s+p.occupancy_percent, 0)/properties.length) : 0 };
    res.json({ period: { year, month, startDate, endDate }, properties, totals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/reports/daily-brief', async (req, res) => {
  try {
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
    const tomorrow = new Date(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getTime()+86400000).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    const bks = allBks.filter(b => b.booking_status !== 'cancelled');
    const props = useMongo ? await Property.find().lean() : store.properties;
    const guests = useMongo ? await Guest.find().lean() : store.guests;
    const enrich = b => { const p = props.find(pr => pr.id === b.property_id) || {}; const g = guests.find(gs => gs.id === b.guest_id) || {}; return { ...b, property_name: p.name, address: p.address, google_maps_link: p.google_maps_link, first_name: g.first_name, last_name: g.last_name, phone: g.phone, guest_name: `${g.first_name || ''} ${g.last_name || ''}`.trim(), guests: (b.adults||0)+(b.children||0) }; };
    res.json({ date: today, checkIns: bks.filter(b => b.check_in === today && (b.booking_status === 'confirmed' || b.booking_status === 'checked-in')).map(enrich), checkOuts: bks.filter(b => b.check_out === today && b.booking_status === 'checked-in').map(enrich), pendingPayments: bks.filter(b => b.pending_amount > 0).map(enrich), cleaningRequired: [...new Set(bks.filter(b => b.check_out === today || b.check_in === tomorrow).map(b => (props.find(p => p.id === b.property_id)||{}).name))].filter(Boolean).map(n => ({ property_name: n })), maintenanceFlags: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/reports/daily-brief/send', (req, res) => {
  res.json({ success: true, message: 'Daily brief sent successfully', channels: req.body.channels || ['email'], preview: 'Daily brief preview' });
});
app.get('/api/reports/revenue', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    let bks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) bks = bks.filter(b => b.property_id === propFilter);
    const props = useMongo ? await Property.find().lean() : store.properties;
    const byChannel = {}; bks.forEach(b => { if (!byChannel[b.channel]) byChannel[b.channel] = { channel: b.channel, bookings: 0, gross: 0, net: 0 }; byChannel[b.channel].bookings++; byChannel[b.channel].gross += b.gross_amount; byChannel[b.channel].net += b.gross_amount; });
    const byMonth = {}; bks.forEach(b => { const m = b.check_in.substring(0,7); if (!byMonth[m]) byMonth[m] = { month: m, bookings: 0, gross: 0, net: 0 }; byMonth[m].bookings++; byMonth[m].gross += b.gross_amount; byMonth[m].net += b.net_amount; });
    const byProperty = {}; bks.forEach(b => { const pn = (props.find(p => p.id === b.property_id)||{}).name || 'Unknown'; if (!byProperty[pn]) byProperty[pn] = { property_name: pn, bookings: 0, gross: 0, net: 0 }; byProperty[pn].bookings++; byProperty[pn].gross += b.gross_amount; byProperty[pn].net += b.net_amount; });
    res.json({ byChannel: Object.values(byChannel), byMonth: Object.values(byMonth), byProperty: Object.values(byProperty) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REPORT EXTRAS ---
app.get('/api/reports/guest-analytics', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    let monthBks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) monthBks = monthBks.filter(b => b.property_id === propFilter);
    const monthGuestIds = new Set(monthBks.map(b => b.guest_id));
    const allGs = useMongo ? await Guest.find().lean() : store.guests;
    const gs = allGs.filter(g => monthGuestIds.has(g.id));
    const newGuests = gs.filter(g => (g.total_stays||0) <= 1);
    const repeatGuests = gs.filter(g => (g.total_stays||0) > 1);
    const topGuests = [...gs].sort((a,b) => (b.lifetime_value||0) - (a.lifetime_value||0)).slice(0, 10).map(g => ({ id: g.id, name: `${g.first_name} ${g.last_name}`, phone: g.phone, total_stays: g.total_stays, lifetime_value: g.lifetime_value }));
    res.json({ total_guests: gs.length, new_guests: newGuests.length, repeat_guests: repeatGuests.length, repeat_rate: gs.length ? Math.round(repeatGuests.length / gs.length * 100) : 0, topGuests, avg_lifetime_value: gs.length ? Math.round(gs.reduce((s,g) => s + (g.lifetime_value||0), 0) / gs.length) : 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/reports/payment-summary', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    let bks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) bks = bks.filter(b => b.property_id === propFilter);
    const paid = bks.filter(b => b.payment_status === 'paid');
    const pending = bks.filter(b => b.payment_status === 'pending');
    const partial = bks.filter(b => b.payment_status === 'partial');
    res.json({
      paid: { count: paid.length, total: paid.reduce((s,b) => s + b.gross_amount, 0) },
      pending: { count: pending.length, total: pending.reduce((s,b) => s + b.gross_amount, 0) },
      partial: { count: partial.length, total: partial.reduce((s,b) => s + b.gross_amount, 0), collected: partial.reduce((s,b) => s + b.paid_amount, 0), remaining: partial.reduce((s,b) => s + b.pending_amount, 0) },
      total_collected: bks.reduce((s,b) => s + b.paid_amount, 0),
      total_pending: bks.reduce((s,b) => s + b.pending_amount, 0)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/reports/adr', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const propFilter = req.query.property_id ? parseInt(req.query.property_id) : null;
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const allBks = useMongo ? await Booking.find().lean() : store.bookings;
    let bks = allBks.filter(b => b.booking_status !== 'cancelled' && b.check_in >= startDate && b.check_in <= endDate);
    if (propFilter) bks = bks.filter(b => b.property_id === propFilter);
    const activeProps = useMongo ? await Property.find({ is_active: true }).lean() : store.properties.filter(p => p.is_active);
    const filteredProps = propFilter ? activeProps.filter(p => p.id === propFilter) : activeProps;
    const props = filteredProps.map(p => {
      const pb = bks.filter(b => b.property_id === p.id);
      const totalRevenue = pb.reduce((s,b) => s + b.net_amount, 0);
      const totalNights = pb.reduce((s,b) => s + Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / 86400000)), 0);
      return { property_id: p.id, property_name: p.name, total_revenue: totalRevenue, nights_sold: totalNights, adr: totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0, base_price: p.base_price };
    });
    const totalRev = props.reduce((s,p) => s + p.total_revenue, 0);
    const totalNights = props.reduce((s,p) => s + p.nights_sold, 0);
    res.json({ properties: props, overall_adr: totalNights > 0 ? Math.round(totalRev / totalNights) : 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ICAL EXPORT (generate .ics feed for a property) ---
const toPropertySlug = (name) => name.toLowerCase().replace(/\s+by\s+stay\s+nestura/i, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');

app.get('/api/properties/:id/ical.ics', async (req, res) => {
  try {
    const param = req.params.id;
    const isNumeric = /^\d+$/.test(param);
    let prop, bookingsList;
    if (useMongo) {
      if (isNumeric) {
        prop = await Property.findOne({ id: parseInt(param) }).lean();
      } else {
        const allProps = await Property.find().lean();
        prop = allProps.find(p => toPropertySlug(p.name) === param);
      }
      if (prop) bookingsList = await Booking.find({ property_id: prop.id, booking_status: { $nin: ['cancelled'] } }).lean();
    } else {
      prop = isNumeric ? store.properties.find(p => p.id === parseInt(param)) : store.properties.find(p => toPropertySlug(p.name) === param);
      bookingsList = prop ? (store.bookings || []).filter(b => b.property_id === prop.id && b.booking_status !== 'cancelled') : [];
    }
    if (!prop) return res.status(404).send('Property not found');

    const formatDate = (d) => d.replace(/-/g, '');
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const host = req.get('host');

    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Stay Nestura PMS//EN\r\n';
    ics += `X-WR-CALNAME:${prop.name}\r\n`;
    ics += 'METHOD:PUBLISH\r\n';

    for (const b of bookingsList) {
      const dtStart = formatDate(b.check_in);
      const dtEnd = formatDate(b.check_out);
      ics += 'BEGIN:VEVENT\r\n';
      ics += `DTSTART;VALUE=DATE:${dtStart}\r\n`;
      ics += `DTEND;VALUE=DATE:${dtEnd}\r\n`;
      ics += `DTSTAMP:${now}\r\n`;
      ics += `UID:booking-${b.id}@${host}\r\n`;
      ics += `SUMMARY:${b.channel === 'direct' ? 'Direct Booking' : b.channel} - Reserved\r\n`;
      ics += `DESCRIPTION:Booking #${b.id} | ${b.channel} | ${b.payment_status || 'unknown'}\r\n`;
      ics += 'STATUS:CONFIRMED\r\n';
      ics += 'END:VEVENT\r\n';
    }

    ics += 'END:VCALENDAR\r\n';
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', `inline; filename="${prop.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
    res.send(ics);
  } catch (err) { res.status(500).send('Error generating calendar'); }
});

// --- ICAL LINKS ---
app.get('/api/ical-links', (req, res) => {
  let links = store.ical_links || [];
  if (req.query.property_id) links = links.filter(l => l.property_id == req.query.property_id);
  res.json(links);
});
app.post('/api/ical-links', (req, res) => {
  const b = req.body;
  if (!store.ical_links) store.ical_links = [];
  const link = { id: _nextId(), property_id: parseInt(b.property_id), channel: b.channel || 'other', ical_url: b.ical_url || '', label: b.label || b.channel || 'Calendar Link', created_at: new Date().toISOString() };
  store.ical_links.push(link);
  res.status(201).json(link);
});
app.delete('/api/ical-links/:id', (req, res) => {
  if (!store.ical_links) store.ical_links = [];
  const idx = store.ical_links.findIndex(l => l.id == req.params.id);
  if (idx >= 0) store.ical_links.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// --- CHANNEL MANAGER ---
app.get('/api/channel-manager/accounts', async (req, res) => {
  try { res.json(useMongo ? await ChannelAccount.find().lean() : store.channel_accounts); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/channel-manager/accounts/:id', async (req, res) => {
  try {
    if (useMongo) { const ch = await ChannelAccount.findOneAndUpdate({ id: parseInt(req.params.id) }, { $set: req.body }, { new: true }).lean(); return res.json(ch || { error: 'Not found' }); }
    const ch = store.channel_accounts.find(c => c.id == req.params.id);
    if (ch) Object.assign(ch, req.body, { updated_at: new Date().toISOString() });
    res.json(ch || { error: 'Not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/channel-manager/availability', async (req, res) => {
  try {
    const props = useMongo ? await Property.find({ is_active: true }).lean() : store.properties.filter(p => p.is_active);
    const avail = useMongo ? await Availability.find().lean() : store.availability;
    const grouped = {};
    props.forEach(p => { grouped[p.id] = { property_id: p.id, property_name: p.name, total_rooms: p.total_rooms, dates: avail.filter(a => a.property_id === p.id).slice(0, 30) }; });
    res.json(Object.values(grouped));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/channel-manager/push/availability', async (req, res) => {
  const channels = useMongo ? await ChannelAccount.find().lean() : store.channel_accounts;
  res.json({ message: 'Availability pushed to channels', results: channels.map(c => ({ channel: c.channel_name, status: 'success', timestamp: new Date().toISOString() })) });
});
app.post('/api/channel-manager/push/rates', async (req, res) => {
  const channels = useMongo ? await ChannelAccount.find().lean() : store.channel_accounts;
  res.json({ message: 'Rates pushed to channels', results: channels.map(c => ({ channel: c.channel_name, status: 'success' })) });
});
app.post('/api/channel-manager/sync/all', async (req, res) => {
  try {
    const props = useMongo ? await Property.find().lean() : store.properties;
    if (useMongo) { const sid = await nextId('synclogs'); await SyncLog.create({ id: sid, channel: 'all', sync_type: 'full', status: 'success', records_processed: props.length * 30, started_at: new Date(), completed_at: new Date() }); }
    else { store.sync_logs.push({ id: _nextId(), channel: 'all', sync_type: 'full', status: 'success', records_processed: props.length * 30, errors: null, started_at: new Date().toISOString(), completed_at: new Date().toISOString() }); }
    res.json({ message: 'Full sync completed', duration_seconds: 2, properties_synced: props.length, results: props.map(p => ({ property_id: p.id, property_name: p.name, availability_count: 30, status: 'synced' })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/channel-manager/sync/logs', async (req, res) => {
  try { res.json(useMongo ? await SyncLog.find().sort({ _id: -1 }).limit(20).lean() : store.sync_logs.slice(-20)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/channel-manager/sync/status', async (req, res) => {
  try {
    const channels = useMongo ? await ChannelAccount.find().lean() : store.channel_accounts;
    res.json({ lastSync: new Date().toISOString(), nextSyncIn: 30, channels: channels.map(c => ({ channel_name: c.channel_name, is_active: c.is_active, sync_enabled: c.sync_enabled, last_sync: c.last_sync })), status: 'connected' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- WEBHOOKS ---
app.post('/api/webhooks/airbnb', (req, res) => { res.json({ status: 'processed' }); });
app.post('/api/webhooks/booking', (req, res) => { res.json({ status: 'processed' }); });
app.post('/api/webhooks/test', (req, res) => { res.json({ status: 'ok', received: req.body }); });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Stay Nestura PMS'
  });
});

// Serve React frontend build at /app
app.use('/app', express.static(path.join(__dirname, 'frontend', 'build')));
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// API Documentation Pages Generator
const generateApiDocPage = (title, icon, description, endpoints, accentColor) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Stay Nestura API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-dark: #0a0a0f;
      --bg-card: rgba(255, 255, 255, 0.03);
      --bg-card-hover: rgba(255, 255, 255, 0.06);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #ffffff;
      --text-secondary: #8b8b9e;
      --text-muted: #5c5c6f;
      --accent: ${accentColor};
    }
    body { font-family: 'Outfit', sans-serif; background: var(--bg-dark); color: var(--text-primary); min-height: 100vh; }
    .bg-pattern { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
    .bg-pattern::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%); }
    .container { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 50px 24px; }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 50px; }
    .back-link { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); text-decoration: none; font-size: 14px; margin-bottom: 30px; transition: color 0.2s; }
    .back-link:hover { color: var(--accent); }
    .icon-wrapper { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, var(--accent), var(--accent)88); display: flex; align-items: center; justify-content: center; font-size: 32px; }
    .header-content h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
    .header-content p { color: var(--text-secondary); font-size: 1.1rem; }
    .endpoints-section { display: flex; flex-direction: column; gap: 16px; }
    .endpoint-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; transition: all 0.3s ease; }
    .endpoint-card:hover { background: var(--bg-card-hover); border-color: rgba(99, 102, 241, 0.3); }
    .endpoint-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .method-badge { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; text-transform: uppercase; }
    .method-badge.get { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .method-badge.post { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .method-badge.put { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .method-badge.patch { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
    .method-badge.delete { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .endpoint-path { font-family: 'JetBrains Mono', monospace; font-size: 15px; color: var(--text-primary); }
    .endpoint-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
    .params-list { display: flex; flex-direction: column; gap: 8px; }
    .param-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; }
    .param-name { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: var(--accent); }
    .param-type { font-size: 12px; color: var(--text-muted); background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 4px; }
    .param-desc { font-size: 13px; color: var(--text-secondary); }
    .try-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; }
    .try-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3); }
    .response-example { margin-top: 16px; padding: 16px; background: rgba(0, 0, 0, 0.3); border-radius: 10px; overflow-x: auto; }
    .response-example pre { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #a5b4fc; }
    .footer { text-align: center; padding-top: 50px; border-top: 1px solid var(--border-color); margin-top: 50px; }
    .footer p { font-size: 14px; color: var(--text-muted); }
    .footer a { color: var(--accent); text-decoration: none; }
    @media (max-width: 768px) { .container { padding: 30px 16px; } .endpoint-header { flex-direction: column; align-items: flex-start; gap: 10px; } }
  </style>
</head>
<body>
  <div class="bg-pattern"></div>
  <div class="container">
    <a href="/" class="back-link">← Back to API Portal</a>
    <header class="header">
      <div class="icon-wrapper">${icon}</div>
      <div class="header-content">
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
    </header>
    <div class="endpoints-section">
      ${endpoints.map(ep => `
      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method-badge ${ep.method.toLowerCase()}">${ep.method}</span>
          <span class="endpoint-path">${ep.path}</span>
        </div>
        <p class="endpoint-desc">${ep.desc}</p>
        ${ep.params ? `<div class="params-list">${ep.params.map(p => `<div class="param-item"><span class="param-name">${p.name}</span><span class="param-type">${p.type}</span><span class="param-desc">${p.desc}</span></div>`).join('')}</div>` : ''}
        ${ep.example ? `<div class="response-example"><pre>${JSON.stringify(ep.example, null, 2)}</pre></div>` : ''}
        <a href="${ep.path}" class="try-btn" target="_blank">Try Endpoint →</a>
      </div>
      `).join('')}
    </div>
    <footer class="footer">
      <p><a href="/">← Back to API Portal</a></p>
    </footer>
  </div>
</body>
</html>
  `;
};

// Properties API Documentation
app.get('/api-docs/properties', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/properties', desc: 'List all properties with pagination and filters', params: [{ name: 'page', type: 'query', desc: 'Page number' }, { name: 'limit', type: 'query', desc: 'Items per page' }, { name: 'status', type: 'query', desc: 'Filter by status' }], example: [{ id: 1, name: 'Sunset Villa', property_type: 'Villa', status: 'active', total_rooms: 4, base_price: 5000 }] },
    { method: 'GET', path: '/api/properties/:id', desc: 'Get single property details', params: [{ name: 'id', type: 'path', desc: 'Property ID' }] },
    { method: 'POST', path: '/api/properties', desc: 'Create a new property', params: [{ name: 'name', type: 'body', desc: 'Property name' }, { name: 'property_type', type: 'body', desc: 'Type (Villa/Apartment/Hotel)' }, { name: 'address', type: 'body', desc: 'Full address' }] },
    { method: 'PUT', path: '/api/properties/:id', desc: 'Update property details', params: [{ name: 'id', type: 'path', desc: 'Property ID' }] },
    { method: 'DELETE', path: '/api/properties/:id', desc: 'Delete a property', params: [{ name: 'id', type: 'path', desc: 'Property ID' }] },
    { method: 'GET', path: '/api/properties/:id/calendar', desc: 'Get property availability calendar', params: [{ name: 'id', type: 'path', desc: 'Property ID' }, { name: 'month', type: 'query', desc: 'Month (1-12)' }, { name: 'year', type: 'query', desc: 'Year' }] },
    { method: 'GET', path: '/api/properties/:id/bookings', desc: 'Get all bookings for a property', params: [{ name: 'id', type: 'path', desc: 'Property ID' }] }
  ];
  res.send(generateApiDocPage('Properties API', '🏠', 'Manage your properties, rooms, and pricing', endpoints, '#6366f1'));
});

// Bookings API Documentation
app.get('/api-docs/bookings', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/bookings', desc: 'List all bookings with filters', params: [{ name: 'status', type: 'query', desc: 'Filter by status' }, { name: 'property_id', type: 'query', desc: 'Filter by property' }, { name: 'start_date', type: 'query', desc: 'Check-in date filter' }, { name: 'end_date', type: 'query', desc: 'Check-out date filter' }], example: { bookings: [{ id: 1, property_id: 1, guest_name: 'John Doe', check_in: '2024-03-15', check_out: '2024-03-18', status: 'confirmed', total_amount: 15000 }] } },
    { method: 'GET', path: '/api/bookings/:id', desc: 'Get booking details', params: [{ name: 'id', type: 'path', desc: 'Booking ID' }] },
    { method: 'POST', path: '/api/bookings', desc: 'Create a new booking', params: [{ name: 'property_id', type: 'body', desc: 'Property ID' }, { name: 'guest_id', type: 'body', desc: 'Guest ID' }, { name: 'check_in', type: 'body', desc: 'Check-in date' }, { name: 'check_out', type: 'body', desc: 'Check-out date' }, { name: 'total_guests', type: 'body', desc: 'Number of guests' }] },
    { method: 'PATCH', path: '/api/bookings/:id/status', desc: 'Update booking status', params: [{ name: 'id', type: 'path', desc: 'Booking ID' }, { name: 'status', type: 'body', desc: 'New status (confirmed/checked-in/checked-out/cancelled)' }] },
    { method: 'DELETE', path: '/api/bookings/:id', desc: 'Cancel a booking', params: [{ name: 'id', type: 'path', desc: 'Booking ID' }] },
    { method: 'GET', path: '/api/bookings/today', desc: "Get today's check-ins and check-outs" },
    { method: 'GET', path: '/api/bookings/stats/overview', desc: 'Get booking statistics overview' }
  ];
  res.send(generateApiDocPage('Bookings API', '📅', 'Reservation and booking management system', endpoints, '#ec4899'));
});

// Guests API Documentation
app.get('/api-docs/guests', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/guests', desc: 'List all guests', params: [{ name: 'page', type: 'query', desc: 'Page number' }, { name: 'search', type: 'query', desc: 'Search by name/email/phone' }], example: [{ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+91 9876543210', total_stays: 5 }] },
    { method: 'GET', path: '/api/guests/:id', desc: 'Get guest profile with booking history', params: [{ name: 'id', type: 'path', desc: 'Guest ID' }] },
    { method: 'POST', path: '/api/guests', desc: 'Register a new guest', params: [{ name: 'first_name', type: 'body', desc: 'First name' }, { name: 'last_name', type: 'body', desc: 'Last name' }, { name: 'email', type: 'body', desc: 'Email address' }, { name: 'phone', type: 'body', desc: 'Phone number' }] },
    { method: 'PUT', path: '/api/guests/:id', desc: 'Update guest information', params: [{ name: 'id', type: 'path', desc: 'Guest ID' }] },
    { method: 'GET', path: '/api/guests/search/query', desc: 'Search guests by name, email, or phone', params: [{ name: 'q', type: 'query', desc: 'Search query' }] },
    { method: 'GET', path: '/api/guests/:id/history', desc: 'Get guest booking history', params: [{ name: 'id', type: 'path', desc: 'Guest ID' }] }
  ];
  res.send(generateApiDocPage('Guests API', '👥', 'Customer Relationship Management & Guest Profiles', endpoints, '#10b981'));
});

// Expenses API Documentation
app.get('/api-docs/expenses', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/expenses', desc: 'List all expenses', params: [{ name: 'category', type: 'query', desc: 'Filter by category' }, { name: 'property_id', type: 'query', desc: 'Filter by property' }, { name: 'start_date', type: 'query', desc: 'Start date' }, { name: 'end_date', type: 'query', desc: 'End date' }], example: [{ id: 1, property_id: 1, category: 'Maintenance', description: 'Plumbing repair', amount: 2500, date: '2024-03-10' }] },
    { method: 'GET', path: '/api/expenses/:id', desc: 'Get expense details', params: [{ name: 'id', type: 'path', desc: 'Expense ID' }] },
    { method: 'POST', path: '/api/expenses', desc: 'Record a new expense', params: [{ name: 'property_id', type: 'body', desc: 'Property ID' }, { name: 'category', type: 'body', desc: 'Expense category' }, { name: 'description', type: 'body', desc: 'Description' }, { name: 'amount', type: 'body', desc: 'Amount' }] },
    { method: 'GET', path: '/api/expenses/summary', desc: 'Get expense summary by category' },
    { method: 'GET', path: '/api/expenses/property/:id', desc: 'Get expenses for a specific property', params: [{ name: 'id', type: 'path', desc: 'Property ID' }] }
  ];
  res.send(generateApiDocPage('Expenses API', '💰', 'Track and manage property expenses', endpoints, '#f59e0b'));
});

// Reports API Documentation
app.get('/api-docs/reports', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/reports/dashboard', desc: 'Get dashboard data with key metrics', example: { today: { today_checkins: 3, today_checkouts: 2 }, month: { net_revenue: 250000, total_bookings: 45 }, occupancy: [{ name: 'Sunset Villa', occupancy: 78 }] } },
    { method: 'GET', path: '/api/reports/profit-loss', desc: 'Monthly profit & loss report', params: [{ name: 'month', type: 'query', desc: 'Month (1-12)' }, { name: 'year', type: 'query', desc: 'Year' }] },
    { method: 'GET', path: '/api/reports/daily-brief', desc: 'Daily operations brief', params: [{ name: 'date', type: 'query', desc: 'Date (YYYY-MM-DD)' }] },
    { method: 'GET', path: '/api/reports/occupancy', desc: 'Occupancy rate analysis', params: [{ name: 'property_id', type: 'query', desc: 'Filter by property' }, { name: 'period', type: 'query', desc: 'Period (week/month/year)' }] },
    { method: 'GET', path: '/api/reports/revenue', desc: 'Revenue breakdown by property/source', params: [{ name: 'start_date', type: 'query', desc: 'Start date' }, { name: 'end_date', type: 'query', desc: 'End date' }] }
  ];
  res.send(generateApiDocPage('Reports API', '📊', 'Analytics, insights & business intelligence', endpoints, '#8b5cf6'));
});

// Channel Manager API Documentation
app.get('/api-docs/channel-manager', (req, res) => {
  const endpoints = [
    { method: 'GET', path: '/api/channel-manager/accounts', desc: 'List connected channel accounts (Airbnb, Booking.com, etc.)', example: [{ channel: 'airbnb', property_id: 1, status: 'connected', last_sync: '2024-03-15T10:30:00Z' }] },
    { method: 'POST', path: '/api/channel-manager/accounts', desc: 'Connect a new channel account', params: [{ name: 'channel', type: 'body', desc: 'Channel name (airbnb/booking)' }, { name: 'property_id', type: 'body', desc: 'Property ID' }, { name: 'credentials', type: 'body', desc: 'API credentials' }] },
    { method: 'GET', path: '/api/channel-manager/availability', desc: 'Cross-channel availability status', params: [{ name: 'property_id', type: 'query', desc: 'Property ID' }] },
    { method: 'POST', path: '/api/channel-manager/sync', desc: 'Manually trigger sync for a property', params: [{ name: 'property_id', type: 'body', desc: 'Property ID' }] },
    { method: 'GET', path: '/api/channel-manager/sync/status', desc: 'Get sync status for all channels' },
    { method: 'DELETE', path: '/api/channel-manager/accounts/:id', desc: 'Disconnect a channel account', params: [{ name: 'id', type: 'path', desc: 'Account ID' }] }
  ];
  res.send(generateApiDocPage('Channel Manager API', '🔗', 'OTA channel integration & synchronization', endpoints, '#06b6d4'));
});

// Auth API Documentation
app.get('/api-docs/auth', (req, res) => {
  const endpoints = [
    { method: 'POST', path: '/api/auth/register', desc: 'Register a new user', params: [{ name: 'email', type: 'body', desc: 'Email address' }, { name: 'password', type: 'body', desc: 'Password' }, { name: 'name', type: 'body', desc: 'Full name' }], example: { user: { id: 1, email: 'user@example.com', name: 'John' }, token: 'eyJhbGciOiJIUzI1NiIs...' } },
    { method: 'POST', path: '/api/auth/login', desc: 'User login', params: [{ name: 'email', type: 'body', desc: 'Email address' }, { name: 'password', type: 'body', desc: 'Password' }] },
    { method: 'POST', path: '/api/auth/refresh', desc: 'Refresh access token', params: [{ name: 'refresh_token', type: 'body', desc: 'Refresh token' }] },
    { method: 'GET', path: '/api/auth/me', desc: 'Get current user profile' },
    { method: 'POST', path: '/api/auth/logout', desc: 'User logout' },
    { method: 'POST', path: '/api/auth/forgot-password', desc: 'Request password reset', params: [{ name: 'email', type: 'body', desc: 'Email address' }] }
  ];
  res.send(generateApiDocPage('Authentication API', '🔐', 'User authentication & security', endpoints, '#10b981'));
});

// Webhooks API Documentation
app.get('/api-docs/webhooks', (req, res) => {
  const endpoints = [
    { method: 'POST', path: '/api/webhooks/airbnb', desc: 'Handle Airbnb webhook events (booking created/updated/cancelled)', params: [{ name: 'event_type', type: 'body', desc: 'Event type' }, { name: 'booking_data', type: 'body', desc: 'Booking information' }], example: { status: 'processed', booking_id: 123 } },
    { method: 'POST', path: '/api/webhooks/booking', desc: 'Handle Booking.com webhook events', params: [{ name: 'event', type: 'body', desc: 'Event type' }, { name: 'reservation', type: 'body', desc: 'Reservation data' }] },
    { method: 'GET', path: '/api/webhooks/logs', desc: 'View webhook delivery logs', params: [{ name: 'channel', type: 'query', desc: 'Filter by channel' }, { name: 'status', type: 'query', desc: 'Filter by status' }] },
    { method: 'GET', path: '/api/webhooks/:id', desc: 'Get webhook delivery details', params: [{ name: 'id', type: 'path', desc: 'Webhook ID' }] },
    { method: 'POST', path: '/api/webhooks/retry/:id', desc: 'Retry a failed webhook delivery', params: [{ name: 'id', type: 'path', desc: 'Webhook ID' }] }
  ];
  res.send(generateApiDocPage('Webhooks API', '⚡', 'OTA webhook handlers for real-time updates', endpoints, '#f97316'));
});

// Root route - Functional Homepage for Stay Nestura PMS
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stay Nestura | Homestay Management System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg-dark: #08090c;
      --bg-surface: #0f1117;
      --bg-card: rgba(255, 255, 255, 0.04);
      --bg-card-hover: rgba(255, 255, 255, 0.07);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #ffffff;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.3);
      --green: #10b981;
      --orange: #f59e0b;
      --pink: #ec4899;
      --red: #ef4444;
      --blue: #3b82f6;
      --cyan: #06b6d4;
      --purple: #8b5cf6;
    }
    body { font-family: 'Outfit', sans-serif; background: var(--bg-dark); color: var(--text-primary); min-height: 100vh; overflow-x: hidden; }
    .bg-effects { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
    .bg-effects::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
      animation: bgDrift 20s ease-in-out infinite; }
    @keyframes bgDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(3%, 3%); } }

    /* Navbar */
    .navbar { position: sticky; top: 0; z-index: 100; background: rgba(8, 9, 12, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-color); padding: 0 24px; }
    .navbar-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .nav-brand-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), var(--purple)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .nav-brand-text { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
    .nav-links { display: flex; gap: 4px; align-items: center; }
    .nav-link { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; color: var(--text-secondary); text-decoration: none; transition: all 0.2s; }
    .nav-link:hover { color: var(--text-primary); background: var(--bg-card); }
    .nav-link.active { color: var(--accent); background: rgba(99, 102, 241, 0.1); }
    .nav-actions { display: flex; gap: 8px; align-items: center; }
    .nav-status { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; font-size: 12px; color: var(--green); }
    .nav-status .dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .btn-dashboard { padding: 8px 20px; background: linear-gradient(135deg, var(--accent), var(--purple)); color: white; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.3s; }
    .btn-dashboard:hover { transform: translateY(-1px); box-shadow: 0 4px 20px var(--accent-glow); }
    .mobile-toggle { display: none; background: none; border: none; color: var(--text-primary); font-size: 24px; cursor: pointer; }

    /* Main Content */
    .main { position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 32px 24px; }

    /* Welcome Section */
    .welcome { margin-bottom: 32px; }
    .welcome h1 { font-size: 2rem; font-weight: 700; margin-bottom: 6px; }
    .welcome p { color: var(--text-secondary); font-size: 1rem; }

    /* Stats Row */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px; transition: all 0.3s; cursor: default; }
    .stat-card:hover { background: var(--bg-card-hover); transform: translateY(-2px); }
    .stat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .stat-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 500; }
    .stat-badge.up { background: rgba(16,185,129,0.1); color: var(--green); }
    .stat-badge.warn { background: rgba(245,158,11,0.1); color: var(--orange); }
    .stat-value { font-size: 1.8rem; font-weight: 700; margin-bottom: 2px; }
    .stat-label { font-size: 13px; color: var(--text-muted); }
    .stat-loading { color: var(--text-muted); font-size: 13px; }

    /* Section Grid */
    .section-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 16px; color: var(--text-secondary); }
    .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .module-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; transition: all 0.3s; text-decoration: none; color: inherit; display: block; position: relative; overflow: hidden; }
    .module-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; opacity: 0; transition: opacity 0.3s; }
    .module-card:hover { background: var(--bg-card-hover); transform: translateY(-3px); border-color: rgba(99,102,241,0.3); }
    .module-card:hover::before { opacity: 1; }
    .module-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .module-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
    .module-info h3 { font-size: 1.05rem; font-weight: 600; margin-bottom: 2px; }
    .module-info p { font-size: 13px; color: var(--text-secondary); }
    .module-features { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .module-tag { padding: 4px 10px; background: rgba(255,255,255,0.04); border-radius: 6px; font-size: 12px; color: var(--text-secondary); }
    .module-arrow { position: absolute; top: 24px; right: 24px; color: var(--text-muted); font-size: 18px; transition: all 0.3s; }
    .module-card:hover .module-arrow { color: var(--accent); transform: translateX(4px); }

    /* Colors per module */
    .module-card.properties::before { background: linear-gradient(90deg, var(--accent), var(--purple)); }
    .module-card.properties .module-icon { background: linear-gradient(135deg, var(--accent), var(--purple)); }
    .module-card.bookings::before { background: linear-gradient(90deg, var(--pink), var(--orange)); }
    .module-card.bookings .module-icon { background: linear-gradient(135deg, var(--pink), var(--orange)); }
    .module-card.calendar::before { background: linear-gradient(90deg, var(--blue), var(--cyan)); }
    .module-card.calendar .module-icon { background: linear-gradient(135deg, var(--blue), var(--cyan)); }
    .module-card.guests::before { background: linear-gradient(90deg, var(--green), var(--cyan)); }
    .module-card.guests .module-icon { background: linear-gradient(135deg, var(--green), var(--cyan)); }
    .module-card.expenses::before { background: linear-gradient(90deg, var(--orange), var(--red)); }
    .module-card.expenses .module-icon { background: linear-gradient(135deg, var(--orange), var(--red)); }
    .module-card.reports::before { background: linear-gradient(90deg, var(--purple), var(--pink)); }
    .module-card.reports .module-icon { background: linear-gradient(135deg, var(--purple), var(--pink)); }
    .module-card.channels::before { background: linear-gradient(90deg, var(--cyan), var(--blue)); }
    .module-card.channels .module-icon { background: linear-gradient(135deg, var(--cyan), var(--blue)); }
    .module-card.api::before { background: linear-gradient(90deg, var(--green), var(--accent)); }
    .module-card.api .module-icon { background: linear-gradient(135deg, var(--green), var(--accent)); }

    /* Today's Activity */
    .activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
    .activity-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; }
    .activity-card h3 { font-size: 1rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .activity-list { display: flex; flex-direction: column; gap: 10px; }
    .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 10px; }
    .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .activity-dot.checkin { background: var(--green); }
    .activity-dot.checkout { background: var(--orange); }
    .activity-text { font-size: 14px; flex: 1; }
    .activity-time { font-size: 12px; color: var(--text-muted); }
    .activity-empty { text-align: center; padding: 20px; color: var(--text-muted); font-size: 14px; }

    /* Quick Actions */
    .quick-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 32px; }
    .qa-btn { padding: 10px 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--text-primary); text-decoration: none; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .qa-btn:hover { background: var(--bg-card-hover); border-color: rgba(99,102,241,0.3); }

    /* Footer */
    .footer { text-align: center; padding: 24px; border-top: 1px solid var(--border-color); margin-top: 20px; }
    .footer p { font-size: 13px; color: var(--text-muted); }
    .footer a { color: var(--accent); text-decoration: none; }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-toggle { display: block; }
      .nav-links.open { display: flex; flex-direction: column; position: absolute; top: 64px; left: 0; right: 0; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); padding: 12px; }
      .activity-grid { grid-template-columns: 1fr; }
      .modules-grid { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-dark); }
    ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
  </style>
</head>
<body>
  <div class="bg-effects"></div>

  <!-- Navbar -->
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="nav-brand">
        <div class="nav-brand-icon">SN</div>
        <span class="nav-brand-text">Stay Nestura</span>
      </a>
      <button class="mobile-toggle" onclick="document.querySelector('.nav-links').classList.toggle('open')">&#9776;</button>
      <div class="nav-links">
        <a href="/" class="nav-link active">Home</a>
        <a href="/app/dashboard" class="nav-link">Dashboard</a>
        <a href="/app/properties" class="nav-link">Properties</a>
        <a href="/app/bookings" class="nav-link">Bookings</a>
        <a href="/app/calendar" class="nav-link">Calendar</a>
        <a href="/app/guests" class="nav-link">Guests</a>
        <a href="/app/expenses" class="nav-link">Expenses</a>
        <a href="/app/reports" class="nav-link">Reports</a>
      </div>
      <div class="nav-actions">
        <div class="nav-status"><span class="dot"></span> System Online</div>
        <a href="/app" class="btn-dashboard">Open Dashboard</a>
      </div>
    </div>
  </nav>

  <!-- Main -->
  <div class="main">
    <!-- Welcome -->
    <div class="welcome">
      <h1>Welcome to Stay Nestura PMS</h1>
      <p>Your central hub for managing homestays, bookings, guests, and OTA channels.</p>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <a href="/app/bookings?action=new" class="qa-btn">+ New Booking</a>
      <a href="/app/properties?action=new" class="qa-btn">+ Add Property</a>
      <a href="/app/guests?action=new" class="qa-btn">+ Add Guest</a>
      <a href="/app/expenses?action=new" class="qa-btn">+ Record Expense</a>
    </div>

    <!-- Live Stats -->
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-card-top">
          <div class="stat-icon" style="background:linear-gradient(135deg,var(--accent),var(--purple));font-size:10px;font-weight:600;text-align:center;line-height:1.2">Properties</div>
          <span class="stat-badge up" id="propBadge">Loading</span>
        </div>
        <div class="stat-value" id="propCount">--</div>
        <div class="stat-label">Total Properties</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top">
          <div class="stat-icon" style="background:linear-gradient(135deg,var(--pink),var(--orange));font-size:10px;font-weight:600;text-align:center;line-height:1.2">Bookings</div>
          <span class="stat-badge up" id="bookBadge">Loading</span>
        </div>
        <div class="stat-value" id="bookCount">--</div>
        <div class="stat-label">Total Bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top">
          <div class="stat-icon" style="background:linear-gradient(135deg,var(--green),var(--cyan));font-size:10px;font-weight:600;text-align:center;line-height:1.2">Guests</div>
          <span class="stat-badge up" id="guestBadge">Loading</span>
        </div>
        <div class="stat-value" id="guestCount">--</div>
        <div class="stat-label">Total Guests</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top">
          <div class="stat-icon" style="background:linear-gradient(135deg,var(--cyan),var(--blue));font-size:10px;font-weight:600;text-align:center;line-height:1.2">Channels</div>
          <span class="stat-badge up">Active</span>
        </div>
        <div class="stat-value" id="channelCount">--</div>
        <div class="stat-label">Active Channels</div>
      </div>
    </div>

    <!-- Today's Activity -->
    <div class="activity-grid">
      <div class="activity-card">
        <h3><span style="color:var(--green)">&#9679;</span> Today's Check-ins</h3>
        <div class="activity-list" id="checkinList">
          <div class="activity-empty">Loading...</div>
        </div>
      </div>
      <div class="activity-card">
        <h3><span style="color:var(--orange)">&#9679;</span> Today's Check-outs</h3>
        <div class="activity-list" id="checkoutList">
          <div class="activity-empty">Loading...</div>
        </div>
      </div>
    </div>

    <!-- Quick Link to Modules -->
    <div style="margin-bottom:40px">
      <a href="/modules" class="module-card channels" style="max-width:400px">
        <span class="module-arrow">&#8594;</span>
        <div class="module-header">
          <div class="module-icon">&#9776;</div>
          <div class="module-info">
            <h3>Management Modules</h3>
            <p>Properties, Bookings, CRM, Reports, API & more</p>
          </div>
        </div>
      </a>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>Stay Nestura PMS &copy; 2024 | <a href="/app">Open Dashboard</a></p>
    </footer>
  </div>

  <script>
    const API = '/api';

    async function loadStats() {
      try {
        const [propsRes, booksRes, guestsRes, channelsRes] = await Promise.allSettled([
          fetch(API + '/properties'),
          fetch(API + '/bookings'),
          fetch(API + '/guests'),
          fetch(API + '/channel-manager/accounts')
        ]);

        if (propsRes.status === 'fulfilled' && propsRes.value.ok) {
          const data = await propsRes.value.json();
          const count = Array.isArray(data) ? data.length : (data.properties ? data.properties.length : 0);
          document.getElementById('propCount').textContent = count;
          document.getElementById('propBadge').textContent = count + ' active';
        } else {
          document.getElementById('propCount').textContent = '6';
          document.getElementById('propBadge').textContent = 'Default';
        }

        if (booksRes.status === 'fulfilled' && booksRes.value.ok) {
          const data = await booksRes.value.json();
          const allBookings = Array.isArray(data) ? data : (data.bookings || []);
          const activeCount = allBookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'checked-in').length;
          const totalCount = allBookings.length;
          document.getElementById('bookCount').textContent = totalCount;
          document.getElementById('bookBadge').textContent = activeCount > 0 ? activeCount + ' Active' : 'None active';
        } else {
          document.getElementById('bookCount').textContent = '0';
          document.getElementById('bookBadge').textContent = '--';
        }

        if (guestsRes.status === 'fulfilled' && guestsRes.value.ok) {
          const data = await guestsRes.value.json();
          const count = Array.isArray(data) ? data.length : (data.guests ? data.guests.length : 0);
          document.getElementById('guestCount').textContent = count;
          document.getElementById('guestBadge').textContent = count > 0 ? 'Registered' : 'None';
        } else {
          document.getElementById('guestCount').textContent = '0';
          document.getElementById('guestBadge').textContent = '--';
        }

        if (channelsRes.status === 'fulfilled' && channelsRes.value.ok) {
          const data = await channelsRes.value.json();
          const count = Array.isArray(data) ? data.length : (data.accounts ? data.accounts.length : 0);
          document.getElementById('channelCount').textContent = count;
        } else {
          document.getElementById('channelCount').textContent = '2';
        }
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }

    async function loadTodayActivity() {
      try {
        const res = await fetch(API + '/bookings/today');
        if (res.ok) {
          const data = await res.json();
          const checkins = data.checkIns || data.check_ins || [];
          const checkouts = data.checkOuts || data.check_outs || [];

          const checkinList = document.getElementById('checkinList');
          if (checkins.length > 0) {
            checkinList.innerHTML = checkins.map(b => {
              const gName = b.guest_name || ((b.first_name || '') + ' ' + (b.last_name || '')).trim() || 'Guest';
              return '<div class="activity-item">' +
                '<span class="activity-dot checkin"></span>' +
                '<span class="activity-text">' + gName + ' - ' + (b.property_name || b.propertyName || 'Property') + '</span>' +
                '<span class="activity-time">' + (b.check_in_time || '4:00 PM') + '</span>' +
              '</div>';
            }).join('');
          } else {
            checkinList.innerHTML = '<div class="activity-empty">No check-ins scheduled for today</div>';
          }

          const checkoutList = document.getElementById('checkoutList');
          if (checkouts.length > 0) {
            checkoutList.innerHTML = checkouts.map(b => {
              const gName = b.guest_name || ((b.first_name || '') + ' ' + (b.last_name || '')).trim() || 'Guest';
              return '<div class="activity-item">' +
                '<span class="activity-dot checkout"></span>' +
                '<span class="activity-text">' + gName + ' - ' + (b.property_name || b.propertyName || 'Property') + '</span>' +
                '<span class="activity-time">' + (b.check_out_time || '2:00 PM') + '</span>' +
              '</div>';
            }).join('');
          } else {
            checkoutList.innerHTML = '<div class="activity-empty">No check-outs scheduled for today</div>';
          }
        } else {
          document.getElementById('checkinList').innerHTML = '<div class="activity-empty">No check-ins scheduled for today</div>';
          document.getElementById('checkoutList').innerHTML = '<div class="activity-empty">No check-outs scheduled for today</div>';
        }
      } catch (e) {
        document.getElementById('checkinList').innerHTML = '<div class="activity-empty">Could not load activity data</div>';
        document.getElementById('checkoutList').innerHTML = '<div class="activity-empty">Could not load activity data</div>';
      }
    }

    // Load data on page load
    loadStats();
    loadTodayActivity();

    // Auto-refresh every 60 seconds
    setInterval(() => { loadStats(); loadTodayActivity(); }, 60000);
  </script>
</body>
</html>
  `);
});

// Management Modules Page
app.get('/modules', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/><meta name="theme-color" content="#1b2a4a"/><title>Management Modules | Stay Nestura</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root { --primary:#1b2a4a; --accent:#c9a96e; --bg:#faf8f5; --bg-card:#fff; --border:#e5e7eb; --text:#1b2a4a; --text-muted:#64748b; --radius:14px; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Montserrat',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }
  .container { max-width:1000px; margin:0 auto; padding:24px 16px; }
  .page-header { display:flex; align-items:center; gap:16px; margin-bottom:32px; flex-wrap:wrap; }
  .page-header h1 { font-family:'Playfair Display',serif; font-size:1.8rem; color:var(--primary); }
  .back-btn { padding:8px 16px; background:var(--primary); color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:500; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
  .back-btn:hover { background:#243656; }
  .modules-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; }
  .module-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); padding:24px; text-decoration:none; color:inherit; display:block; position:relative; overflow:hidden; transition:all 0.3s; }
  .module-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; opacity:0; transition:opacity 0.3s; }
  .module-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(27,42,74,0.1); border-color:var(--accent); }
  .module-card:hover::before { opacity:1; }
  .module-header { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
  .module-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; color:#fff; font-weight:700; flex-shrink:0; }
  .module-info h3 { font-family:'Playfair Display',serif; font-size:1.05rem; font-weight:600; margin-bottom:2px; }
  .module-info p { font-size:13px; color:var(--text-muted); }
  .module-features { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; }
  .module-tag { padding:4px 10px; background:rgba(27,42,74,0.05); border-radius:6px; font-size:12px; color:var(--text-muted); }
  .module-arrow { position:absolute; top:24px; right:24px; color:var(--text-muted); font-size:18px; transition:all 0.3s; }
  .module-card:hover .module-arrow { color:var(--accent); transform:translateX(4px); }
  .module-card.properties::before { background:linear-gradient(90deg,var(--accent),#7c3aed); }
  .module-card.properties .module-icon { background:linear-gradient(135deg,var(--accent),#7c3aed); }
  .module-card.bookings::before { background:linear-gradient(90deg,#ec4899,#f59e0b); }
  .module-card.bookings .module-icon { background:linear-gradient(135deg,#ec4899,#f59e0b); }
  .module-card.calendar::before { background:linear-gradient(90deg,#3b82f6,#06b6d4); }
  .module-card.calendar .module-icon { background:linear-gradient(135deg,#3b82f6,#06b6d4); }
  .module-card.guests::before { background:linear-gradient(90deg,#10b981,#06b6d4); }
  .module-card.guests .module-icon { background:linear-gradient(135deg,#10b981,#06b6d4); }
  .module-card.expenses::before { background:linear-gradient(90deg,#f59e0b,#ef4444); }
  .module-card.expenses .module-icon { background:linear-gradient(135deg,#f59e0b,#ef4444); }
  .module-card.reports::before { background:linear-gradient(90deg,#7c3aed,#ec4899); }
  .module-card.reports .module-icon { background:linear-gradient(135deg,#7c3aed,#ec4899); }
  .module-card.channels::before { background:linear-gradient(90deg,#06b6d4,#3b82f6); }
  .module-card.channels .module-icon { background:linear-gradient(135deg,#06b6d4,#3b82f6); }
  .module-card.api::before { background:linear-gradient(90deg,#10b981,var(--accent)); }
  .module-card.api .module-icon { background:linear-gradient(135deg,#10b981,var(--accent)); }
  .section-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:600; margin:32px 0 16px; color:var(--primary); }
  .api-links { display:flex; gap:10px; flex-wrap:wrap; }
  .api-btn { padding:8px 16px; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; font-size:13px; font-weight:500; color:var(--text); text-decoration:none; transition:all 0.2s; }
  .api-btn:hover { border-color:var(--accent); background:rgba(201,169,110,0.05); }
  @media(max-width:640px) { .modules-grid { grid-template-columns:1fr; } .page-header h1 { font-size:1.4rem; } }
</style></head><body>
<div class="container">
  <div class="page-header">
    <a href="/" class="back-btn">&#8592; Home</a>
    <h1>Management Modules</h1>
  </div>
  <div class="modules-grid">
    <a href="/app/properties" class="module-card properties"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">P</div><div class="module-info"><h3>Properties</h3><p>Manage your homestays, rooms, and pricing</p></div></div><div class="module-features"><span class="module-tag">Multi-property</span><span class="module-tag">Room types</span><span class="module-tag">Rate plans</span><span class="module-tag">Amenities</span></div></a>
    <a href="/app/bookings" class="module-card bookings"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">B</div><div class="module-info"><h3>Bookings</h3><p>Reservation management with status tracking</p></div></div><div class="module-features"><span class="module-tag">Check-in/out</span><span class="module-tag">Conflict detection</span><span class="module-tag">Payments</span><span class="module-tag">Cancellations</span></div></a>
    <a href="/app/calendar" class="module-card calendar"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">C</div><div class="module-info"><h3>Master Calendar</h3><p>Availability view across all properties</p></div></div><div class="module-features"><span class="module-tag">Availability</span><span class="module-tag">Block dates</span><span class="module-tag">Rate updates</span><span class="module-tag">Visual grid</span></div></a>
    <a href="/app/guests" class="module-card guests"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">G</div><div class="module-info"><h3>Guest CRM</h3><p>Customer profiles, history, and communication</p></div></div><div class="module-features"><span class="module-tag">Profiles</span><span class="module-tag">Stay history</span><span class="module-tag">VIP tracking</span><span class="module-tag">ID encryption</span></div></a>
    <a href="/app/expenses" class="module-card expenses"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">E</div><div class="module-info"><h3>Expenses</h3><p>Track property expenses with categorization</p></div></div><div class="module-features"><span class="module-tag">Categories</span><span class="module-tag">Recurring</span><span class="module-tag">Per-property</span><span class="module-tag">Bulk entry</span></div></a>
    <a href="/app/reports" class="module-card reports"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">R</div><div class="module-info"><h3>Reports & Analytics</h3><p>P&L reports, revenue analytics, daily briefs</p></div></div><div class="module-features"><span class="module-tag">Profit/Loss</span><span class="module-tag">Revenue</span><span class="module-tag">Occupancy</span><span class="module-tag">Daily brief</span></div></a>
    <a href="/app/dashboard" class="module-card channels"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">CH</div><div class="module-info"><h3>Channel Manager</h3><p>Sync with Airbnb, Booking.com, and OTAs</p></div></div><div class="module-features"><span class="module-tag">Airbnb</span><span class="module-tag">Booking.com</span><span class="module-tag">Auto-sync</span><span class="module-tag">Webhooks</span></div></a>
    <a href="/api-docs/properties" class="module-card api"><span class="module-arrow">&#8594;</span><div class="module-header"><div class="module-icon">API</div><div class="module-info"><h3>API Documentation</h3><p>Explore all REST API endpoints</p></div></div><div class="module-features"><span class="module-tag">Properties API</span><span class="module-tag">Bookings API</span><span class="module-tag">Guests API</span><span class="module-tag">50+ endpoints</span></div></a>
  </div>
  <h2 class="section-title">API Documentation</h2>
  <div class="api-links">
    <a href="/api-docs/properties" class="api-btn">Properties API</a>
    <a href="/api-docs/bookings" class="api-btn">Bookings API</a>
    <a href="/api-docs/guests" class="api-btn">Guests API</a>
    <a href="/api-docs/expenses" class="api-btn">Expenses API</a>
    <a href="/api-docs/reports" class="api-btn">Reports API</a>
    <a href="/api-docs/channel-manager" class="api-btn">Channel Manager API</a>
    <a href="/api-docs/auth" class="api-btn">Auth API</a>
    <a href="/api-docs/webhooks" class="api-btn">Webhooks API</a>
    <a href="/api/health" class="api-btn" target="_blank">API Health Check</a>
  </div>
</div>
</body></html>`);
});

// Real-time sync status endpoint
app.get('/api/sync/status', (req, res) => {
  res.json({
    lastSync: new Date().toISOString(),
    nextSyncIn: 30,
    activeChannels: ['airbnb', 'booking.com'],
    status: 'connected'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe:property', (propertyId) => {
    socket.join(`property:${propertyId}`);
    console.log(`Client ${socket.id} subscribed to property:${propertyId}`);
  });

  socket.on('unsubscribe:property', (propertyId) => {
    socket.leave(`property:${propertyId}`);
  });

  socket.on('booking:update', (data) => {
    io.emit('booking:updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- DATA EXPORT/IMPORT ---
app.get('/api/data/export', async (req, res) => {
  try {
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      properties: useMongo ? await Property.find().lean() : store.properties,
      guests: useMongo ? await Guest.find().lean() : store.guests,
      bookings: useMongo ? await Booking.find().lean() : store.bookings,
      expenses: useMongo ? await Expense.find().lean() : store.expenses,
      ical_links: store.ical_links || [],
      channel_accounts: useMongo ? await ChannelAccount.find().lean() : store.channel_accounts || []
    };
    res.setHeader('Content-Disposition', 'attachment; filename=stay-nestura-backup.json');
    res.json(exportData);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/data/import', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.version) return res.status(400).json({ error: 'Invalid backup file' });
    let imported = { properties: 0, guests: 0, bookings: 0, expenses: 0 };
    if (useMongo) {
      if (data.properties && data.properties.length > 0) { await Property.deleteMany({}); await Property.insertMany(data.properties); imported.properties = data.properties.length; }
      if (data.guests) { await Guest.deleteMany({}); await Guest.insertMany(data.guests); imported.guests = data.guests.length; }
      if (data.bookings) { await Booking.deleteMany({}); await Booking.insertMany(data.bookings); imported.bookings = data.bookings.length; }
      if (data.expenses) { await Expense.deleteMany({}); await Expense.insertMany(data.expenses); imported.expenses = data.expenses.length; }
      // Update counters
      const maxId = Math.max(...[...(data.properties||[]), ...(data.guests||[]), ...(data.bookings||[]), ...(data.expenses||[])].map(i => i.id || 0));
      await Counter.findByIdAndUpdate('properties', { seq: maxId + 100 }, { upsert: true });
      await Counter.findByIdAndUpdate('guests', { seq: maxId + 100 }, { upsert: true });
      await Counter.findByIdAndUpdate('bookings', { seq: maxId + 100 }, { upsert: true });
      await Counter.findByIdAndUpdate('expenses', { seq: maxId + 100 }, { upsert: true });
    } else {
      if (data.properties && data.properties.length > 0) { store.properties = data.properties; imported.properties = data.properties.length; }
      if (data.guests) { store.guests = data.guests; imported.guests = data.guests.length; }
      if (data.bookings) { store.bookings = data.bookings; imported.bookings = data.bookings.length; }
      if (data.expenses) { store.expenses = data.expenses; imported.expenses = data.expenses.length; }
      if (data.ical_links) { store.ical_links = data.ical_links; }
      if (data.channel_accounts) { store.channel_accounts = data.channel_accounts; }
      const allIds = [...store.properties, ...store.guests, ...store.bookings, ...store.expenses].map(i => i.id || 0);
      _idCounter = Math.max(_idCounter, ...allIds) + 1;
    }
    res.json({ success: true, message: 'Data imported successfully', imported });
  } catch (err) {
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

// --- CSV EXPORT ---
function toCsv(data, fields) {
  const header = fields.join(',');
  const rows = data.map(item => fields.map(f => {
    let val = item[f] === null || item[f] === undefined ? '' : String(item[f]);
    if (val.includes(',') || val.includes('"') || val.includes('\n')) val = '"' + val.replace(/"/g, '""') + '"';
    return val;
  }).join(','));
  return header + '\n' + rows.join('\n');
}
app.get('/api/data/export/csv/:type', async (req, res) => {
  try {
    const type = req.params.type;
    let csv = '';
    const properties = useMongo ? await Property.find().lean() : store.properties;
    const guests = useMongo ? await Guest.find().lean() : store.guests;
    if (type === 'properties') {
      csv = toCsv(properties, ['id','name','property_type','address','city','state','pincode','total_rooms','max_guests','base_price','description','is_active']);
    } else if (type === 'guests') {
      csv = toCsv(guests, ['id','first_name','last_name','email','phone','address','nationality','id_proof_type','id_proof_number','total_stays','total_spent','lifetime_value','created_at']);
    } else if (type === 'bookings') {
      const bookings = useMongo ? await Booking.find().lean() : store.bookings;
      const enriched = bookings.map(b => { const p = properties.find(pr => pr.id === b.property_id) || {}; const g = guests.find(gs => gs.id === b.guest_id) || {}; return { ...b, property_name: p.name, guest_name: `${g.first_name||''} ${g.last_name||''}`.trim() }; });
      csv = toCsv(enriched, ['id','property_name','guest_name','channel','check_in','check_out','adults','children','nightly_rate','gross_amount','paid_amount','pending_amount','payment_status','payment_method','booking_status','created_at']);
    } else if (type === 'expenses') {
      const expenses = useMongo ? await Expense.find().lean() : store.expenses;
      const enriched = expenses.map(e => ({ ...e, property_name: e.property_id === 0 ? 'Common - Stay Nestura' : (properties.find(p => p.id === e.property_id) || {}).name || '' }));
      csv = toCsv(enriched, ['id','property_name','category','description','amount','payment_method','vendor_name','expense_date','created_at']);
    } else {
      return res.status(400).json({ error: 'Invalid type. Use: properties, guests, bookings, expenses' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=stay-nestura-${type}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SYNC DATA TO DATABASE.JS (for deploy persistence) ---
app.post('/api/data/sync-to-code', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'backend', 'config', 'database.js');
    let content = fs.readFileSync(dbPath, 'utf8');
    // Replace guests array
    content = content.replace(/guests:\s*\[[\s\S]*?\],\n\s*bookings:/, `guests: ${JSON.stringify(store.guests, null, 4).replace(/\n/g, '\n  ')},\n  bookings:`);
    content = content.replace(/bookings:\s*\[[\s\S]*?\],\n\s*expenses:/, `bookings: ${JSON.stringify(store.bookings.map(b => { const {first_name, last_name, phone, email, advance_paid, ...rest} = b; return rest; }), null, 4).replace(/\n/g, '\n  ')},\n  expenses:`);
    content = content.replace(/expenses:\s*\[[\s\S]*?\],\n\n/, `expenses: ${JSON.stringify(store.expenses, null, 4).replace(/\n/g, '\n  ')},\n\n`);
    // Update idCounter
    const maxId = Math.max(...[...store.properties, ...store.guests, ...store.bookings, ...store.expenses].map(i => i.id || 0));
    content = content.replace(/let idCounter = \d+;/, `let idCounter = ${maxId + 100};`);
    fs.writeFileSync(dbPath, content);
    res.json({ success: true, message: 'Data synced to database.js — ready for git commit & deploy' });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server IMMEDIATELY (Render needs port open fast), then connect MongoDB in background
server.listen(PORT, () => {
  console.log(`Stay Nestura PMS running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Connect MongoDB in background — server uses in-memory until connected
connectDB().then(connected => {
  useMongo = connected;
  console.log(`Database: ${useMongo ? 'MongoDB' : 'In-Memory'}`);
}).catch(() => {
  console.log('Database: In-Memory (MongoDB failed)');
});

module.exports = { app, server, io };
