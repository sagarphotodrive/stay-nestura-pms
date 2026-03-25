require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const { Property, Guest, Booking, Expense, ChannelAccount, User, Availability, Counter } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const properties = [
  { id: 1, name: 'Torna by Stay Nestura', property_type: 'Bungalow - 4 BHK', address: 'Near Torna Fort', city: 'Velhe', state: 'Maharashtra', pincode: '412212', total_rooms: 2, max_guests: 6, base_price: 3500, description: 'Stay Nestura property near Torna Fort with stunning mountain views, home-cooked meals and trekking access', amenities: ['WiFi', 'Parking', 'Kitchen', 'Mountain View'], images: [], is_active: true },
  { id: 2, name: 'Shivneri by Stay Nestura', property_type: 'Bungalow - 2 BHK', address: 'Near Shivneri Fort', city: 'Junnar', state: 'Maharashtra', pincode: '410502', total_rooms: 2, max_guests: 4, base_price: 2500, description: 'Stay Nestura property near Shivneri Fort with valley views, breakfast included and fort trekking nearby', amenities: ['WiFi', 'Parking', 'Breakfast'], images: [], is_active: true },
  { id: 3, name: 'Solapur Homestay 2 by Stay Nestura', property_type: 'Bungalow - 2 BHK', address: 'City Center', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 3, base_price: 1800, description: 'Stay Nestura property in Solapur city center, comfortable homestay with AC, WiFi and TV', amenities: ['WiFi', 'AC', 'TV'], images: [], is_active: true },
  { id: 4, name: 'Solapur Homestay 1 by Stay Nestura', property_type: 'Bungalow - 1 BHK', address: 'Station Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 1200, description: 'Stay Nestura property near Solapur railway station, budget-friendly with WiFi and TV', amenities: ['WiFi', 'TV'], images: [], is_active: true },
  { id: 5, name: 'Single Room Twin Sharing by Stay Nestura', property_type: 'Single Room', address: 'MG Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 800, description: 'Stay Nestura single room with twin sharing, budget-friendly with basic amenities', amenities: ['WiFi', 'Fan'], images: [], is_active: true },
  { id: 6, name: 'Deluxe Room by Stay Nestura', property_type: 'Single Room', address: 'FC Road', city: 'Solapur', state: 'Maharashtra', pincode: '413001', total_rooms: 1, max_guests: 2, base_price: 1100, description: 'Stay Nestura deluxe room with AC, TV, mini fridge and extra comfort', amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'], images: [], is_active: true },
];

const guests = [
  { id: 201, first_name: 'Amar', last_name: 'Dhole', phone: '1234567890', nationality: 'Indian', total_stays: 1, total_spent: 3750, lifetime_value: 3750 },
  { id: 301, first_name: 'Pradip', last_name: 'Krishen', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'March 2026 register' },
  { id: 302, first_name: 'Pratibha', last_name: 'Sant', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'March 2026 register' },
  { id: 303, first_name: 'Aruna', last_name: 'Chavan', nationality: 'Indian', total_stays: 1, total_spent: 4046, lifetime_value: 4046, notes: 'March 2026 register - online booking' },
  { id: 304, first_name: 'Walk-in', last_name: 'Guest', nationality: 'Indian', total_stays: 1, total_spent: 4000, lifetime_value: 4000, notes: 'March 2026 register - offline' },
  { id: 305, first_name: 'Viplav', last_name: 'Mhetras', nationality: 'Indian', total_stays: 1, total_spent: 2881, lifetime_value: 2881, notes: 'March 2026 register' },
  { id: 306, first_name: 'Abhijeet', last_name: 'Shankar Lad', nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, notes: 'March 2026 register' },
  { id: 307, first_name: 'Hrushikesh', last_name: 'More', nationality: 'Indian', total_stays: 1, total_spent: 4500, lifetime_value: 4500, notes: 'March 2026 register' },
  { id: 308, first_name: 'Vishu', last_name: 'Mukund Dhople', phone: '944', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'March 2026 register' },
  { id: 309, first_name: 'Prasad', last_name: 'Purandare', phone: '9881157726', nationality: 'Indian', total_stays: 1, total_spent: 5788, lifetime_value: 5788, notes: 'March 2026 register - Airbnb' },
  { id: 310, first_name: 'Patil', last_name: 'Aditya', nationality: 'Indian', total_stays: 1, total_spent: 3575, lifetime_value: 3575, notes: 'March 2026 register' },
  { id: 311, first_name: 'Satish', last_name: 'Bhanawat', phone: '9967457', nationality: 'Indian', total_stays: 1, total_spent: 4040, lifetime_value: 4040, notes: 'March 2026 register - Booking.com' },
  { id: 312, first_name: 'Satish', last_name: 'Chandwat D', nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, notes: 'March 2026 register' },
  { id: 313, first_name: 'Dhanajay', last_name: 'Suresh', phone: '9011529331', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'March 2026 register - both single rooms blocked by Amit' },
];

const bookings = [
  { id: 202, property_id: 3, guest_id: 201, channel: 'direct', check_in: '2026-03-24', check_out: '2026-03-25', adults: 4, nightly_rate: 3750, subtotal: 3750, gross_amount: 3750, net_amount: 3750, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 1500, pending_amount: 2250, booking_status: 'confirmed' },
  { id: 401, property_id: 3, guest_id: 301, channel: 'direct', check_in: '2026-03-01', check_out: '2026-03-02', adults: 2, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 402, property_id: 3, guest_id: 302, channel: 'direct', check_in: '2026-03-03', check_out: '2026-03-04', adults: 2, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 1500, pending_amount: 1500, booking_status: 'checked-out' },
  { id: 403, property_id: 3, guest_id: 303, channel: 'booking.com', check_in: '2026-03-04', check_out: '2026-03-05', adults: 2, nightly_rate: 4046, subtotal: 4046, gross_amount: 4046, commission_percent: 15, commission_amount: 607, net_amount: 3439, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 4000, pending_amount: 46, booking_status: 'checked-out' },
  { id: 404, property_id: 3, guest_id: 304, channel: 'direct', check_in: '2026-03-05', check_out: '2026-03-06', adults: 2, nightly_rate: 4000, subtotal: 4000, gross_amount: 4000, net_amount: 4000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 405, property_id: 3, guest_id: 305, channel: 'direct', check_in: '2026-03-07', check_out: '2026-03-08', adults: 5, nightly_rate: 2881, subtotal: 2881, gross_amount: 2881, net_amount: 2881, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2881, pending_amount: 0, booking_status: 'checked-out' },
  { id: 406, property_id: 3, guest_id: 306, channel: 'direct', check_in: '2026-03-08', check_out: '2026-03-09', adults: 2, nightly_rate: 3500, subtotal: 3500, gross_amount: 3500, net_amount: 3500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3500, pending_amount: 0, booking_status: 'checked-out' },
  { id: 407, property_id: 3, guest_id: 307, channel: 'direct', check_in: '2026-03-10', check_out: '2026-03-11', adults: 7, nightly_rate: 4500, subtotal: 4500, gross_amount: 4500, net_amount: 4500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4500, pending_amount: 0, booking_status: 'checked-out' },
  { id: 408, property_id: 3, guest_id: 308, channel: 'direct', check_in: '2026-03-11', check_out: '2026-03-12', adults: 6, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 409, property_id: 3, guest_id: 309, channel: 'airbnb', check_in: '2026-03-12', check_out: '2026-03-13', adults: 4, nightly_rate: 5788, subtotal: 5788, gross_amount: 5788, commission_percent: 3, commission_amount: 174, net_amount: 5614, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 5788, pending_amount: 0, booking_status: 'checked-out' },
  { id: 410, property_id: 3, guest_id: 310, channel: 'direct', check_in: '2026-03-14', check_out: '2026-03-15', adults: 6, children: 1, nightly_rate: 3575, subtotal: 3575, gross_amount: 3575, net_amount: 3575, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3575, pending_amount: 0, booking_status: 'checked-out' },
  { id: 411, property_id: 3, guest_id: 311, channel: 'booking.com', check_in: '2026-03-15', check_out: '2026-03-16', adults: 4, nightly_rate: 4040, subtotal: 4040, gross_amount: 4040, commission_percent: 15, commission_amount: 606, net_amount: 3434, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4040, pending_amount: 0, booking_status: 'checked-out' },
  { id: 412, property_id: 3, guest_id: 312, channel: 'direct', check_in: '2026-03-16', check_out: '2026-03-17', adults: 5, nightly_rate: 3500, subtotal: 3500, gross_amount: 3500, net_amount: 3500, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 3500, pending_amount: 2040, booking_status: 'checked-out' },
  { id: 413, property_id: 3, guest_id: 313, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-21', adults: 4, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 2000, pending_amount: 1000, booking_status: 'confirmed', special_requests: 'Both single rooms blocked by Amit' },
];

const expenses = [
  { id: 203, property_id: 0, category: 'staff_salary', description: 'Shaheen Salary', amount: 14000, payment_method: 'cash', expense_date: '2026-03-05', created_by: 'demo-001' },
  { id: 204, property_id: 0, category: 'staff_salary', description: 'Shaheen yearly Bonus', amount: 10000, payment_method: 'cash', expense_date: '2026-03-05', created_by: 'demo-001' },
  { id: 205, property_id: 0, category: 'cleaning', description: 'Shaheen Cleaning for Shivneri and Torna', amount: 1750, payment_method: 'cash', expense_date: '2026-03-05', created_by: 'demo-001' },
  { id: 206, property_id: 0, category: 'staff_salary', description: 'Jyotiba Advance Salary', amount: 20000, payment_method: 'cash', expense_date: '2026-03-05', created_by: 'demo-001' },
];

const channelAccounts = [
  { id: 1, channel_name: 'airbnb', is_active: true, commission_percent: 3, sync_enabled: true },
  { id: 2, channel_name: 'booking.com', is_active: true, commission_percent: 15, sync_enabled: true },
];

const users = [
  { id: 'demo-001', email: 'test@test.com', password_hash: '', name: 'Demo User', role: 'admin' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Seeding data...');

  // Clear all collections
  await Promise.all([
    Property.deleteMany({}),
    Guest.deleteMany({}),
    Booking.deleteMany({}),
    Expense.deleteMany({}),
    ChannelAccount.deleteMany({}),
    User.deleteMany({}),
    Availability.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  // Insert seed data
  await Property.insertMany(properties);
  console.log('  Properties:', properties.length);

  await Guest.insertMany(guests);
  console.log('  Guests:', guests.length);

  await Booking.insertMany(bookings);
  console.log('  Bookings:', bookings.length);

  await Expense.insertMany(expenses);
  console.log('  Expenses:', expenses.length);

  await ChannelAccount.insertMany(channelAccounts);
  console.log('  Channels:', channelAccounts.length);

  await User.insertMany(users);
  console.log('  Users:', users.length);

  // Generate availability for 60 days
  const today = new Date();
  const availDocs = [];
  let availId = 1000;
  for (const prop of properties) {
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      availDocs.push({
        id: availId++,
        property_id: prop.id,
        date: d.toISOString().split('T')[0],
        rooms_available: prop.total_rooms,
        is_blocked: false,
        min_stay: 1,
        max_stay: 30,
        closed_to_arrival: false,
        closed_to_departure: false,
      });
    }
  }
  await Availability.insertMany(availDocs);
  console.log('  Availability:', availDocs.length, 'records');

  // Set counters
  await Counter.findByIdAndUpdate('properties', { seq: 10 }, { upsert: true });
  await Counter.findByIdAndUpdate('guests', { seq: 500 }, { upsert: true });
  await Counter.findByIdAndUpdate('bookings', { seq: 500 }, { upsert: true });
  await Counter.findByIdAndUpdate('expenses', { seq: 500 }, { upsert: true });
  await Counter.findByIdAndUpdate('channels', { seq: 10 }, { upsert: true });
  await Counter.findByIdAndUpdate('availability', { seq: availId }, { upsert: true });
  console.log('  Counters set');

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
