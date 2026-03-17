// Stay Nestura Properties Management System
// In-Memory Database for Demo/Testing

const { v4: uuidv4 } = require('uuid') || { v4: () => 'id-' + Math.random().toString(36).substr(2, 9) };

// Simple ID generator
let idCounter = 100;
const nextId = () => ++idCounter;

// ============ IN-MEMORY DATA STORES ============

const store = {
  properties: [
    { id: 1, name: 'Torna Homestay', property_type: 'Homestay', address: 'Near Torna Fort', city: 'Velhe', state: 'Maharashtra', pincode: '412212', total_rooms: 2, max_guests: 6, base_price: 3500, description: 'Luxury homestay with mountain views near Torna Fort', amenities: ['WiFi', 'Parking', 'Kitchen', 'Mountain View'], images: [], latitude: 18.2769, longitude: 73.6131, google_maps_link: '', is_active: true, created_at: '2024-01-15T00:00:00Z', updated_at: '2024-01-15T00:00:00Z' },
    { id: 2, name: 'Shivneri Homestay', property_type: 'Homestay', address: 'Near Shivneri Fort', city: 'Junnar', state: 'Maharashtra', pincode: '410502', total_rooms: 2, max_guests: 4, base_price: 2500, description: 'Premium homestay near Shivneri fort with valley views', amenities: ['WiFi', 'Parking', 'Breakfast'], images: [], latitude: 19.2094, longitude: 73.8567, google_maps_link: '', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2024-01-20T00:00:00Z' },
    { id: 3, name: 'Rajlakshmi Niwas', property_type: 'Homestay', address: 'City Center', city: 'Pune', state: 'Maharashtra', pincode: '411001', total_rooms: 1, max_guests: 3, base_price: 1800, description: 'Comfortable stay in city center of Pune', amenities: ['WiFi', 'AC', 'TV'], images: [], latitude: 18.5204, longitude: 73.8567, google_maps_link: '', is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2024-02-01T00:00:00Z' },
    { id: 4, name: 'Solapur Homestay 1', property_type: 'Homestay', address: 'Station Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 1200, description: 'Budget-friendly option near railway station', amenities: ['WiFi', 'TV'], images: [], latitude: 17.6599, longitude: 75.9064, google_maps_link: '', is_active: true, created_at: '2024-02-10T00:00:00Z', updated_at: '2024-02-10T00:00:00Z' },
    { id: 5, name: 'Budget Room 1', property_type: 'Room', address: 'MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', total_rooms: 1, max_guests: 2, base_price: 800, description: 'Economy room with basic amenities', amenities: ['WiFi', 'Fan'], images: [], latitude: 18.5204, longitude: 73.8567, google_maps_link: '', is_active: true, created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z' },
    { id: 6, name: 'Budget Room Deluxe', property_type: 'Room', address: 'FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411004', total_rooms: 1, max_guests: 2, base_price: 1100, description: 'Deluxe room with extra comfort', amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'], images: [], latitude: 18.5204, longitude: 73.8567, google_maps_link: '', is_active: true, created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z' },
  ],

  guests: [
    { id: 1, first_name: 'Rahul', last_name: 'Sharma', email: 'rahul.sharma@gmail.com', phone: '9876543210', id_proof_type: 'Aadhaar', id_proof_number: '1234-5678-9012', id_proof_encrypted: null, address: 'Mumbai, Maharashtra', date_of_birth: '1990-05-15', nationality: 'Indian', total_stays: 3, total_spent: 12500, lifetime_value: 12500, preferences: 'Mountain view room', notes: 'Repeat guest', created_at: '2024-01-20T00:00:00Z', updated_at: '2024-06-01T00:00:00Z' },
    { id: 2, first_name: 'Priya', last_name: 'Patel', email: 'priya.patel@gmail.com', phone: '9876543211', id_proof_type: 'PAN', id_proof_number: 'ABCDE1234F', id_proof_encrypted: null, address: 'Ahmedabad, Gujarat', date_of_birth: '1988-11-20', nationality: 'Indian', total_stays: 5, total_spent: 52000, lifetime_value: 52000, preferences: 'Quiet room', notes: 'VIP guest', created_at: '2024-02-10T00:00:00Z', updated_at: '2024-07-01T00:00:00Z' },
    { id: 3, first_name: 'Amit', last_name: 'Kumar', email: 'amit.kumar@yahoo.com', phone: '9876543212', id_proof_type: 'Aadhaar', id_proof_number: '9876-5432-1098', id_proof_encrypted: null, address: 'Delhi', date_of_birth: '1995-03-10', nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, preferences: '', notes: 'First time visitor', created_at: '2024-05-01T00:00:00Z', updated_at: '2024-05-01T00:00:00Z' },
    { id: 4, first_name: 'Sneha', last_name: 'Deshmukh', email: 'sneha.d@gmail.com', phone: '9876543213', id_proof_type: 'Passport', id_proof_number: 'J1234567', id_proof_encrypted: null, address: 'Pune, Maharashtra', date_of_birth: '1992-07-25', nationality: 'Indian', total_stays: 2, total_spent: 7000, lifetime_value: 7000, preferences: 'Early check-in', notes: '', created_at: '2024-03-15T00:00:00Z', updated_at: '2024-06-15T00:00:00Z' },
  ],

  bookings: [
    { id: 1, property_id: 1, guest_id: 1, channel: 'direct', channel_booking_id: null, check_in: new Date().toISOString().split('T')[0], check_out: new Date(Date.now() + 2*86400000).toISOString().split('T')[0], adults: 2, children: 0, infants: 0, nightly_rate: 3500, subtotal: 7000, cleaning_fee: 500, service_fee: 0, taxes: 900, gross_amount: 8400, commission_percent: 0, commission_amount: 0, net_amount: 8400, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 8400, pending_amount: 0, booking_status: 'confirmed', guest_message: '', special_requests: 'Late check-in', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2024-06-01T00:00:00Z', cancelled_at: null, cancellation_reason: null, created_at: '2024-06-01T00:00:00Z', updated_at: '2024-06-01T00:00:00Z' },
    { id: 2, property_id: 2, guest_id: 2, channel: 'airbnb', channel_booking_id: 'AIR-12345', check_in: new Date().toISOString().split('T')[0], check_out: new Date(Date.now() + 3*86400000).toISOString().split('T')[0], adults: 2, children: 1, infants: 0, nightly_rate: 2500, subtotal: 7500, cleaning_fee: 300, service_fee: 200, taxes: 960, gross_amount: 8960, commission_percent: 3, commission_amount: 269, net_amount: 8691, currency: 'INR', payment_status: 'paid', payment_method: 'card', paid_amount: 8960, pending_amount: 0, booking_status: 'confirmed', guest_message: 'Looking forward to the stay', special_requests: '', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2024-06-05T00:00:00Z', cancelled_at: null, cancellation_reason: null, created_at: '2024-06-05T00:00:00Z', updated_at: '2024-06-05T00:00:00Z' },
    { id: 3, property_id: 3, guest_id: 3, channel: 'booking.com', channel_booking_id: 'BDC-67890', check_in: new Date(Date.now() + 1*86400000).toISOString().split('T')[0], check_out: new Date(Date.now() + 4*86400000).toISOString().split('T')[0], adults: 1, children: 0, infants: 0, nightly_rate: 1800, subtotal: 5400, cleaning_fee: 200, service_fee: 0, taxes: 672, gross_amount: 6272, commission_percent: 15, commission_amount: 941, net_amount: 5331, currency: 'INR', payment_status: 'pending', payment_method: null, paid_amount: 0, pending_amount: 6272, booking_status: 'confirmed', guest_message: '', special_requests: 'Ground floor room', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2024-06-10T00:00:00Z', cancelled_at: null, cancellation_reason: null, created_at: '2024-06-10T00:00:00Z', updated_at: '2024-06-10T00:00:00Z' },
    { id: 4, property_id: 1, guest_id: 4, channel: 'direct', channel_booking_id: null, check_in: new Date(Date.now() + 5*86400000).toISOString().split('T')[0], check_out: new Date(Date.now() + 7*86400000).toISOString().split('T')[0], adults: 2, children: 2, infants: 0, nightly_rate: 3500, subtotal: 7000, cleaning_fee: 500, service_fee: 0, taxes: 900, gross_amount: 8400, commission_percent: 0, commission_amount: 0, net_amount: 8400, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 4000, pending_amount: 4400, booking_status: 'confirmed', guest_message: 'Family trip', special_requests: 'Extra mattress', check_in_time: '2:00 PM', check_out_time: '11:00 AM', actual_check_in: null, actual_check_out: null, confirmed_at: '2024-06-12T00:00:00Z', cancelled_at: null, cancellation_reason: null, created_at: '2024-06-12T00:00:00Z', updated_at: '2024-06-12T00:00:00Z' },
  ],

  expenses: [
    { id: 1, property_id: 1, category: 'cleaning', subcategory: 'Deep clean', description: 'Monthly deep cleaning', amount: 2000, payment_method: 'cash', vendor_name: 'CleanPro', receipt_number: 'R001', expense_date: '2024-06-01', is_recurring: true, recurring_frequency: 'monthly', created_at: '2024-06-01T00:00:00Z', created_by: 'demo-001' },
    { id: 2, property_id: 1, category: 'electricity', subcategory: null, description: 'Electricity bill June', amount: 3500, payment_method: 'bank_transfer', vendor_name: 'MSEDCL', receipt_number: 'E001', expense_date: '2024-06-05', is_recurring: true, recurring_frequency: 'monthly', created_at: '2024-06-05T00:00:00Z', created_by: 'demo-001' },
    { id: 3, property_id: 2, category: 'laundry', subcategory: null, description: 'Bed linen laundry', amount: 800, payment_method: 'cash', vendor_name: 'Quick Wash', receipt_number: 'L001', expense_date: '2024-06-10', is_recurring: false, recurring_frequency: null, created_at: '2024-06-10T00:00:00Z', created_by: 'demo-001' },
    { id: 4, property_id: 2, category: 'maintenance', subcategory: 'Plumbing', description: 'Fix bathroom leak', amount: 1500, payment_method: 'cash', vendor_name: 'Local plumber', receipt_number: 'M001', expense_date: '2024-06-15', is_recurring: false, recurring_frequency: null, created_at: '2024-06-15T00:00:00Z', created_by: 'demo-001' },
    { id: 5, property_id: 3, category: 'internet', subcategory: null, description: 'Monthly WiFi bill', amount: 999, payment_method: 'bank_transfer', vendor_name: 'Jio Fiber', receipt_number: 'I001', expense_date: '2024-06-01', is_recurring: true, recurring_frequency: 'monthly', created_at: '2024-06-01T00:00:00Z', created_by: 'demo-001' },
    { id: 6, property_id: 1, category: 'supplies', subcategory: 'Toiletries', description: 'Guest toiletries restock', amount: 1200, payment_method: 'cash', vendor_name: 'DMart', receipt_number: 'S001', expense_date: '2024-06-20', is_recurring: false, recurring_frequency: null, created_at: '2024-06-20T00:00:00Z', created_by: 'demo-001' },
  ],

  channel_accounts: [
    { id: 1, channel_name: 'airbnb', account_id: 'airbnb-stay-nestura', api_key_encrypted: null, api_secret_encrypted: null, webhook_secret: null, is_active: true, commission_percent: 3, sync_enabled: true, last_sync: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: 2, channel_name: 'booking.com', account_id: 'bdc-stay-nestura', api_key_encrypted: null, api_secret_encrypted: null, webhook_secret: null, is_active: true, commission_percent: 15, sync_enabled: true, last_sync: new Date().toISOString(), created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  ],

  availability: [],

  sync_logs: [
    { id: 1, channel: 'airbnb', sync_type: 'full', status: 'success', records_processed: 180, errors: null, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3500000).toISOString() },
    { id: 2, channel: 'booking.com', sync_type: 'full', status: 'success', records_processed: 180, errors: null, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3400000).toISOString() },
  ],

  ical_links: [
    { id: 1, property_id: 1, channel: 'airbnb', ical_url: '', label: 'Airbnb - Torna Homestay', created_at: '2024-01-15T00:00:00Z' },
    { id: 2, property_id: 1, channel: 'booking.com', ical_url: '', label: 'Booking.com - Torna Homestay', created_at: '2024-01-15T00:00:00Z' },
    { id: 3, property_id: 2, channel: 'airbnb', ical_url: '', label: 'Airbnb - Shivneri Homestay', created_at: '2024-01-20T00:00:00Z' },
  ],
  messages: [],
  users: [{ id: 'demo-001', email: 'test@test.com', password_hash: '', name: 'Demo User', role: 'admin', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
};

// Initialize availability for all properties (30 days)
const today = new Date();
store.properties.forEach(prop => {
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    store.availability.push({
      id: nextId(),
      property_id: prop.id,
      date: d.toISOString().split('T')[0],
      rooms_available: prop.total_rooms,
      is_blocked: false,
      blocked_reason: null,
      min_stay: 1,
      max_stay: 30,
      closed_to_arrival: false,
      closed_to_departure: false,
      updated_at: new Date().toISOString(),
    });
  }
});

// ============ SQL PATTERN MATCHING QUERY ENGINE ============

const query = async (text, params = []) => {
  const sql = text.replace(/\s+/g, ' ').trim().toLowerCase();
  let replaced = text;
  params.forEach((p, i) => { replaced = replaced.replace(`$${i+1}`, JSON.stringify(p)); });

  // Helper: substitute params
  const p = (i) => params[i];

  try {
    // ---- USERS ----
    if (sql.includes('from users') && sql.includes('select')) {
      if (params.length > 0) {
        const found = store.users.filter(u => u.email === p(0) || u.id === p(0));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.users, rowCount: store.users.length };
    }
    if (sql.includes('insert into users')) {
      const user = { id: nextId(), email: p(0), password_hash: p(1), name: p(2), role: p(3) || 'manager', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.users.push(user);
      return { rows: [user], rowCount: 1 };
    }

    // ---- PROPERTIES ----
    if (sql.includes('from properties') && sql.includes('select') && !sql.includes('insert') && !sql.includes('update')) {
      if (sql.includes('where') && sql.includes('id') && params.length > 0) {
        const prop = store.properties.find(pr => pr.id == p(0) && pr.is_active !== false);
        if (prop) {
          const avail = store.availability.filter(a => a.property_id === prop.id);
          return { rows: [{ ...prop, availability: avail }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      const active = store.properties.filter(pr => pr.is_active !== false);
      const enriched = active.map(pr => {
        const bookings = store.bookings.filter(b => b.property_id === pr.id && b.booking_status !== 'cancelled');
        const monthRevenue = bookings.reduce((s, b) => s + (b.net_amount || 0), 0);
        return { ...pr, current_bookings: bookings.length, month_revenue: monthRevenue };
      });
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into properties')) {
      const prop = { id: nextId(), name: p(0), property_type: p(1), address: p(2), city: p(3), state: p(4), pincode: p(5), total_rooms: p(6), max_guests: p(7), base_price: p(8), description: p(9), amenities: p(10) || [], images: p(11) || [], latitude: p(12), longitude: p(13), google_maps_link: p(14), is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.properties.push(prop);
      // Init availability
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        store.availability.push({ id: nextId(), property_id: prop.id, date: d.toISOString().split('T')[0], rooms_available: prop.total_rooms || 1, is_blocked: false, blocked_reason: null, min_stay: 1, max_stay: 30, closed_to_arrival: false, closed_to_departure: false, updated_at: new Date().toISOString() });
      }
      return { rows: [prop], rowCount: 1 };
    }
    if (sql.includes('update properties')) {
      const prop = store.properties.find(pr => pr.id == params[params.length - 1]);
      if (prop) { prop.updated_at = new Date().toISOString(); Object.assign(prop, { name: p(0) || prop.name }); }
      return { rows: prop ? [prop] : [], rowCount: prop ? 1 : 0 };
    }

    // ---- AVAILABILITY ----
    if (sql.includes('from availability') && sql.includes('select')) {
      let avail = [...store.availability];
      if (params.length > 0) avail = avail.filter(a => a.property_id == p(0));
      if (params.length > 1) avail = avail.filter(a => a.date >= p(1));
      if (params.length > 2) avail = avail.filter(a => a.date <= p(2));
      return { rows: avail, rowCount: avail.length };
    }
    if (sql.includes('update availability')) {
      // Handle blocking/unblocking
      if (sql.includes('is_blocked')) {
        const propId = p(0);
        const startDate = params.length > 2 ? p(2) : p(1);
        const endDate = params.length > 3 ? p(3) : p(2);
        store.availability.forEach(a => {
          if (a.property_id == propId && a.date >= startDate && a.date <= endDate) {
            a.is_blocked = true;
            a.blocked_reason = params.length > 1 ? p(1) : 'Blocked';
          }
        });
      }
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes('insert into availability') || sql.includes('on conflict')) {
      return { rows: [], rowCount: 1 };
    }

    // ---- BOOKINGS ----
    if (sql.includes('from bookings') && sql.includes('select') && !sql.includes('insert')) {
      if (sql.includes('count(*)') || sql.includes('count(distinct')) {
        const count = store.bookings.filter(b => b.booking_status !== 'cancelled').length;
        return { rows: [{ count, total_bookings: count, cancelled_bookings: 0, total_gross: store.bookings.reduce((s,b) => s + b.gross_amount, 0), total_commission: store.bookings.reduce((s,b) => s + b.commission_amount, 0), total_net: store.bookings.reduce((s,b) => s + b.net_amount, 0), confirmed_bookings: count, unique_guests: new Set(store.bookings.map(b => b.guest_id)).size }], rowCount: 1 };
      }
      // Today's bookings
      if (sql.includes('check_in') && sql.includes('current_date') || (params.length > 0 && params[0] === new Date().toISOString().split('T')[0])) {
        const todayStr = new Date().toISOString().split('T')[0];
        const checkIns = store.bookings.filter(b => b.check_in === todayStr && b.booking_status !== 'cancelled');
        const checkOuts = store.bookings.filter(b => b.check_out === todayStr && b.booking_status !== 'cancelled');
        // Enrich with property and guest names
        const enrich = (b) => {
          const prop = store.properties.find(pr => pr.id === b.property_id) || {};
          const guest = store.guests.find(g => g.id === b.guest_id) || {};
          return { ...b, property_name: prop.name, first_name: guest.first_name, last_name: guest.last_name, phone: guest.phone, address: prop.address, google_maps_link: prop.google_maps_link, guests: (b.adults||0) + (b.children||0) };
        };
        return { rows: checkIns.map(enrich), rowCount: checkIns.length, _checkOuts: checkOuts.map(enrich) };
      }
      // Single booking
      if (sql.includes('where') && sql.includes('.id') && params.length === 1) {
        const booking = store.bookings.find(b => b.id == p(0));
        if (booking) {
          const prop = store.properties.find(pr => pr.id === booking.property_id) || {};
          const guest = store.guests.find(g => g.id === booking.guest_id) || {};
          return { rows: [{ ...booking, property_name: prop.name, first_name: guest.first_name, last_name: guest.last_name, email: guest.email, phone: guest.phone }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }
      // All bookings with enrichment
      let bookings = [...store.bookings];
      const enriched = bookings.map(b => {
        const prop = store.properties.find(pr => pr.id === b.property_id) || {};
        const guest = store.guests.find(g => g.id === b.guest_id) || {};
        return { ...b, property_name: prop.name, first_name: guest.first_name, last_name: guest.last_name, email: guest.email, phone: guest.phone };
      });
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into bookings')) {
      const booking = {
        id: nextId(), property_id: p(0), guest_id: p(1), channel: p(2) || 'direct', channel_booking_id: p(3),
        check_in: p(4), check_out: p(5), adults: p(6) || 1, children: p(7) || 0, infants: p(8) || 0,
        nightly_rate: p(9) || 0, subtotal: p(10) || 0, cleaning_fee: p(11) || 0, service_fee: p(12) || 0, taxes: p(13) || 0,
        gross_amount: p(14) || 0, commission_percent: p(15) || 0, commission_amount: p(16) || 0, net_amount: p(17) || 0,
        currency: 'INR', payment_status: p(18) || 'pending', payment_method: p(19),
        guest_message: p(20) || '', special_requests: p(21) || '',
        check_in_time: p(22) || '2:00 PM', check_out_time: p(23) || '11:00 AM',
        booking_status: 'confirmed', actual_check_in: null, actual_check_out: null,
        confirmed_at: new Date().toISOString(), cancelled_at: null, cancellation_reason: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      store.bookings.push(booking);
      return { rows: [booking], rowCount: 1 };
    }
    if (sql.includes('update bookings')) {
      const id = params[params.length - 1];
      const booking = store.bookings.find(b => b.id == id);
      if (booking) {
        booking.updated_at = new Date().toISOString();
        if (sql.includes('booking_status')) booking.booking_status = p(0);
        if (sql.includes('cancelled_at')) { booking.cancelled_at = new Date().toISOString(); booking.cancellation_reason = p(1) || 'Cancelled'; }
      }
      return { rows: booking ? [booking] : [], rowCount: booking ? 1 : 0 };
    }

    // ---- GUESTS ----
    if (sql.includes('from guests') && sql.includes('select') && !sql.includes('insert')) {
      if (sql.includes('count(*)')) {
        let guests = store.guests;
        if (params.length > 0 && p(0)) {
          const search = p(0).replace(/%/g, '').toLowerCase();
          guests = guests.filter(g => (g.first_name + ' ' + g.last_name + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(search));
        }
        return { rows: [{ count: guests.length, total_guests: guests.length, total_stays: guests.reduce((s,g) => s + g.total_stays, 0), total_revenue: guests.reduce((s,g) => s + g.lifetime_value, 0), avg_lifetime_value: guests.length ? Math.round(guests.reduce((s,g) => s + g.lifetime_value, 0) / guests.length) : 0, repeat_guests: guests.filter(g => g.total_stays > 1).length }], rowCount: 1 };
      }
      // VIP
      if (sql.includes('total_stays >= 3') || sql.includes('lifetime_value >= 50000')) {
        const vips = store.guests.filter(g => g.total_stays >= 3 || g.lifetime_value >= 50000);
        return { rows: vips, rowCount: vips.length };
      }
      // Single guest
      if (sql.includes('where') && sql.includes('.id') && params.length === 1) {
        const guest = store.guests.find(g => g.id == p(0));
        return { rows: guest ? [guest] : [], rowCount: guest ? 1 : 0 };
      }
      // Search
      if (params.length > 0 && p(0) && typeof p(0) === 'string' && p(0).includes('%')) {
        const search = p(0).replace(/%/g, '').toLowerCase();
        const found = store.guests.filter(g => (g.first_name + ' ' + g.last_name + ' ' + g.email + ' ' + g.phone).toLowerCase().includes(search));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.guests, rowCount: store.guests.length };
    }
    if (sql.includes('insert into guests')) {
      const guest = {
        id: nextId(), first_name: p(0), last_name: p(1), email: p(2), phone: p(3),
        id_proof_type: p(4), id_proof_number: p(5), id_proof_encrypted: p(6),
        address: p(7), date_of_birth: p(8), nationality: p(9),
        total_stays: 0, total_spent: 0, lifetime_value: 0,
        preferences: p(10) || '', notes: p(11) || '',
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
      store.guests.push(guest);
      return { rows: [{ ...guest, isNew: true }], rowCount: 1 };
    }
    if (sql.includes('update guests')) {
      const id = params[params.length - 1];
      const guest = store.guests.find(g => g.id == id);
      if (guest) { guest.updated_at = new Date().toISOString(); }
      return { rows: guest ? [guest] : [], rowCount: guest ? 1 : 0 };
    }

    // ---- EXPENSES ----
    if (sql.includes('from expenses') && sql.includes('select')) {
      if (sql.includes('count(*)')) {
        return { rows: [{ count: store.expenses.length }], rowCount: 1 };
      }
      if (sql.includes('group by') && sql.includes('category')) {
        const byCategory = {};
        store.expenses.forEach(e => {
          if (!byCategory[e.category]) byCategory[e.category] = { category: e.category, total: 0, count: 0 };
          byCategory[e.category].total += e.amount;
          byCategory[e.category].count++;
        });
        return { rows: Object.values(byCategory), rowCount: Object.keys(byCategory).length };
      }
      if (sql.includes('group by') && sql.includes('property')) {
        const byProp = {};
        store.expenses.forEach(e => {
          const prop = store.properties.find(pr => pr.id === e.property_id) || { name: 'Unknown' };
          if (!byProp[e.property_id]) byProp[e.property_id] = { property_id: e.property_id, property_name: prop.name, total: 0 };
          byProp[e.property_id].total += e.amount;
        });
        return { rows: Object.values(byProp), rowCount: Object.keys(byProp).length };
      }
      // All expenses
      const enriched = store.expenses.map(e => {
        const prop = store.properties.find(pr => pr.id === e.property_id) || {};
        return { ...e, property_name: prop.name };
      });
      return { rows: enriched, rowCount: enriched.length };
    }
    if (sql.includes('insert into expenses')) {
      const expense = {
        id: nextId(), property_id: p(0), category: p(1), subcategory: p(2),
        description: p(3), amount: p(4), payment_method: p(5) || 'cash',
        vendor_name: p(6), receipt_number: p(7), expense_date: p(8) || new Date().toISOString().split('T')[0],
        is_recurring: p(9) || false, recurring_frequency: p(10),
        created_at: new Date().toISOString(), created_by: 'demo-001'
      };
      store.expenses.push(expense);
      return { rows: [expense], rowCount: 1 };
    }
    if (sql.includes('update expenses')) {
      const id = params[params.length - 1];
      const expense = store.expenses.find(e => e.id == id);
      if (expense) { Object.assign(expense, {}); }
      return { rows: expense ? [expense] : [], rowCount: expense ? 1 : 0 };
    }
    if (sql.includes('delete from expenses')) {
      const idx = store.expenses.findIndex(e => e.id == p(0));
      if (idx >= 0) store.expenses.splice(idx, 1);
      return { rows: [], rowCount: idx >= 0 ? 1 : 0 };
    }

    // ---- CHANNEL ACCOUNTS ----
    if (sql.includes('from channel_accounts') && sql.includes('select')) {
      if (params.length > 0) {
        const found = store.channel_accounts.filter(c => c.id == p(0) || c.channel_name === p(0));
        return { rows: found, rowCount: found.length };
      }
      return { rows: store.channel_accounts, rowCount: store.channel_accounts.length };
    }
    if (sql.includes('update channel_accounts')) {
      const id = params[params.length - 1];
      const ch = store.channel_accounts.find(c => c.id == id);
      if (ch) { ch.updated_at = new Date().toISOString(); }
      return { rows: ch ? [ch] : [], rowCount: ch ? 1 : 0 };
    }

    // ---- SYNC LOGS ----
    if (sql.includes('from sync_logs')) {
      return { rows: store.sync_logs, rowCount: store.sync_logs.length };
    }
    if (sql.includes('insert into sync_logs')) {
      const log = { id: nextId(), channel: p(0), sync_type: p(1), status: p(2) || 'success', records_processed: p(3) || 0, errors: null, started_at: new Date().toISOString(), completed_at: new Date().toISOString() };
      store.sync_logs.push(log);
      return { rows: [log], rowCount: 1 };
    }

    // ---- MESSAGES ----
    if (sql.includes('from messages')) {
      return { rows: store.messages, rowCount: store.messages.length };
    }

    // ---- GENERIC FALLBACK ----
    console.log('[MockDB] Unhandled query:', sql.substring(0, 80));
    return { rows: [], rowCount: 0 };

  } catch (err) {
    console.error('[MockDB] Query error:', err.message, 'SQL:', sql.substring(0, 80));
    return { rows: [], rowCount: 0 };
  }
};

// Transaction helper - just runs the callback with a mock client
const transaction = async (callback) => {
  const mockClient = {
    query: async (text, params) => {
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return { rows: [], rowCount: 0 };
      return query(text, params);
    },
    release: () => {}
  };
  return callback(mockClient);
};

// Mock pool
const pool = {
  query: query,
  connect: async () => ({
    query: async (text, params) => {
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return { rows: [], rowCount: 0 };
      return query(text, params);
    },
    release: () => {}
  }),
  on: () => {},
};

console.log('[MockDB] In-memory database initialized with demo data');

module.exports = {
  pool,
  query,
  transaction,
  text: (...args) => query(...args),
  store, // expose for direct access if needed
};
