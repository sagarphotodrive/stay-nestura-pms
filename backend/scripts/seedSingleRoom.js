require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const { Guest, Booking, Counter } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// Single Room Twin Sharing = property_id 5
const newGuests = [
  { id: 501, first_name: 'Archana', last_name: 'Rani', nationality: 'Indian', total_stays: 1, total_spent: 5540, lifetime_value: 5540, notes: 'March 2026 single room register' },
  { id: 502, first_name: 'Sudheer', last_name: 'Pooja', nationality: 'Indian', total_stays: 1, total_spent: 1500, lifetime_value: 1500, notes: 'March 2026 single room register - माशिमा' },
  // Pradip on 13th - likely same Pradip Krishen (guest 301) from Homestay 2
  { id: 503, first_name: 'Dhanlaxmi', last_name: 'Limbad', phone: '9029338742', nationality: 'Indian', total_stays: 1, total_spent: 1500, lifetime_value: 1500, notes: 'March 2026 single room register' },
  { id: 504, first_name: 'Shovon', last_name: 'Mukherjee', phone: '9699774298', nationality: 'Indian', total_stays: 1, total_spent: 5000, lifetime_value: 5000, notes: 'March 2026 single room register - 3 nights' },
];

const newBookings = [
  // Archana Rani: March 7-10 (3 nights), ₹5540
  { id: 501, property_id: 5, guest_id: 501, channel: 'direct', check_in: '2026-03-07', check_out: '2026-03-10', adults: 1, nightly_rate: 1847, subtotal: 5540, gross_amount: 5540, net_amount: 5540, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 5540, pending_amount: 0, booking_status: 'checked-out' },
  // Sudheer Pooja: March 11-12 (1 night), ₹1500
  { id: 502, property_id: 5, guest_id: 502, channel: 'direct', check_in: '2026-03-11', check_out: '2026-03-12', adults: 1, nightly_rate: 1500, subtotal: 1500, gross_amount: 1500, net_amount: 1500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 1500, pending_amount: 0, booking_status: 'checked-out' },
  // Pradip: March 13-14 (1 night) - same Pradip Krishen (guest 301), no amount listed
  { id: 503, property_id: 5, guest_id: 301, channel: 'direct', check_in: '2026-03-13', check_out: '2026-03-14', adults: 1, nightly_rate: 800, subtotal: 800, gross_amount: 800, net_amount: 800, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 800, pending_amount: 0, booking_status: 'checked-out', special_requests: 'Amount not in register' },
  // Dhanlaxmi Limbad: March 15-16 (1 night), ₹1500
  { id: 504, property_id: 5, guest_id: 503, channel: 'direct', check_in: '2026-03-15', check_out: '2026-03-16', adults: 1, nightly_rate: 1500, subtotal: 1500, gross_amount: 1500, net_amount: 1500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 1500, pending_amount: 0, booking_status: 'checked-out' },
  // Shovon Mukherjee: March 16-19 (3 nights), ₹5000
  { id: 505, property_id: 5, guest_id: 504, channel: 'direct', check_in: '2026-03-16', check_out: '2026-03-19', adults: 1, nightly_rate: 1667, subtotal: 5000, gross_amount: 5000, net_amount: 5000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 5000, pending_amount: 0, booking_status: 'checked-out' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Adding single room records...');

  // Insert new guests (skip if already exists)
  for (const g of newGuests) {
    await Guest.findOneAndUpdate({ id: g.id }, g, { upsert: true, returnDocument: 'after' });
  }
  console.log('  Guests added:', newGuests.length);

  // Update Pradip Krishen's total_stays
  await Guest.findOneAndUpdate({ id: 301 }, { $inc: { total_stays: 1, total_spent: 800, lifetime_value: 800 } });
  console.log('  Updated Pradip Krishen (301) with extra stay');

  // Insert new bookings (skip if already exists)
  for (const b of newBookings) {
    await Booking.findOneAndUpdate({ id: b.id }, b, { upsert: true, returnDocument: 'after' });
  }
  console.log('  Bookings added:', newBookings.length);

  // Update counters
  await Counter.findByIdAndUpdate('guests', { seq: 600 }, { upsert: true, returnDocument: 'after' });
  await Counter.findByIdAndUpdate('bookings', { seq: 600 }, { upsert: true, returnDocument: 'after' });
  console.log('  Counters updated');

  console.log('\nSingle room seed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
