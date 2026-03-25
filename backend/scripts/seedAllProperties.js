require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const { Guest, Booking, Counter } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// ============ TORNA (Property 1) ============
const tornaGuests = [
  { id: 601, first_name: 'Prajakta', last_name: 'Rane', nationality: 'Indian', total_stays: 1, total_spent: 11000, lifetime_value: 11000, notes: 'Torna Mar 2026 - 2 nights, 5A+3K' },
  { id: 602, first_name: 'Ritesh', last_name: 'Dhande', nationality: 'Indian', total_stays: 1, total_spent: 6440, lifetime_value: 6440, notes: 'Torna Mar 2026 - Airbnb booking' },
  { id: 603, first_name: 'Manali', last_name: 'Jadhav', nationality: 'Indian', total_stays: 1, total_spent: 6000, lifetime_value: 6000, notes: 'Torna Mar 2026 - 9A+1K' },
  { id: 604, first_name: 'Usha', last_name: 'Sridharan', nationality: 'Indian', total_stays: 1, total_spent: 11500, lifetime_value: 11500, notes: 'Torna Mar 2026 - 3 nights, 5A+1 driver' },
  { id: 605, first_name: 'Deepak', last_name: 'Naga', nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, notes: 'Torna Mar 2026 - 2A+2K + EV charging' },
  { id: 606, first_name: 'Shiv', last_name: 'Rana Pratap', nationality: 'Indian', total_stays: 1, total_spent: 14000, lifetime_value: 14000, notes: 'Torna Mar 2026 - 2 nights, 10 adults' },
  { id: 607, first_name: 'Shubham', last_name: 'Pandit', nationality: 'Indian', total_stays: 1, total_spent: 5500, lifetime_value: 5500, notes: 'Torna Mar 2026 - 6A+1 pet' },
  { id: 608, first_name: 'Prashant', last_name: 'Sawant', nationality: 'Indian', total_stays: 1, total_spent: 12500, lifetime_value: 12500, notes: 'Torna Mar 2026 - 2 nights, 9 adults' },
];

const tornaBookings = [
  { id: 601, property_id: 1, guest_id: 601, channel: 'direct', check_in: '2026-03-01', check_out: '2026-03-03', adults: 5, children: 3, nightly_rate: 5500, subtotal: 11000, gross_amount: 11000, net_amount: 11000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 11000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 602, property_id: 1, guest_id: 602, channel: 'airbnb', check_in: '2026-03-05', check_out: '2026-03-06', adults: 8, nightly_rate: 6440, subtotal: 6440, gross_amount: 6440, commission_percent: 3, commission_amount: 193, net_amount: 6247, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 6440, pending_amount: 0, booking_status: 'checked-out' },
  { id: 603, property_id: 1, guest_id: 603, channel: 'direct', check_in: '2026-03-07', check_out: '2026-03-08', adults: 9, children: 1, nightly_rate: 6000, subtotal: 6000, gross_amount: 6000, net_amount: 6000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 6000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 604, property_id: 1, guest_id: 604, channel: 'direct', check_in: '2026-03-09', check_out: '2026-03-12', adults: 6, nightly_rate: 3833, subtotal: 11500, gross_amount: 11500, net_amount: 11500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 11500, pending_amount: 0, booking_status: 'checked-out', special_requests: '5 adults + 1 driver' },
  { id: 605, property_id: 1, guest_id: 605, channel: 'direct', check_in: '2026-03-12', check_out: '2026-03-13', adults: 2, children: 2, nightly_rate: 3500, subtotal: 3500, gross_amount: 3500, net_amount: 3500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3500, pending_amount: 0, booking_status: 'checked-out', special_requests: 'EV charging used' },
  { id: 606, property_id: 1, guest_id: 606, channel: 'direct', check_in: '2026-03-13', check_out: '2026-03-15', adults: 10, nightly_rate: 7000, subtotal: 14000, gross_amount: 14000, net_amount: 14000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 14000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 607, property_id: 1, guest_id: 607, channel: 'direct', check_in: '2026-03-19', check_out: '2026-03-20', adults: 6, nightly_rate: 5500, subtotal: 5500, gross_amount: 5500, net_amount: 5500, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 2000, pending_amount: 3500, booking_status: 'checked-out', special_requests: '1 pet' },
  { id: 608, property_id: 1, guest_id: 608, channel: 'direct', check_in: '2026-03-27', check_out: '2026-03-29', adults: 9, nightly_rate: 6250, subtotal: 12500, gross_amount: 12500, net_amount: 12500, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 6000, pending_amount: 6500, booking_status: 'confirmed' },
];

// ============ SHIVNERI (Property 2) ============
const shivneriGuests = [
  { id: 609, first_name: 'Sreedevi', last_name: '', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'Shivneri Mar 2026 - 5 guests' },
  { id: 610, first_name: 'Swapnil', last_name: 'Puratkar', nationality: 'Indian', total_stays: 1, total_spent: 2896, lifetime_value: 2896, notes: 'Shivneri Mar 2026 - 3A+1K' },
  { id: 611, first_name: 'Akshay', last_name: 'Shah', nationality: 'Indian', total_stays: 1, total_spent: 3500, lifetime_value: 3500, notes: 'Shivneri Mar 2026' },
  { id: 612, first_name: 'Saviraj', last_name: 'Rai', nationality: 'Indian', total_stays: 1, total_spent: 3200, lifetime_value: 3200, notes: 'Shivneri Mar 2026 - 4A+1 pet' },
  { id: 613, first_name: 'Kanchan', last_name: 'Deshmukh', nationality: 'Indian', total_stays: 1, total_spent: 4000, lifetime_value: 4000, notes: 'Shivneri Mar 2026 - 6 adults' },
  { id: 614, first_name: 'Pravin', last_name: 'Kate', nationality: 'Indian', total_stays: 1, total_spent: 10500, lifetime_value: 10500, notes: 'Shivneri Mar 2026 - 3 nights, 5A+1K' },
  { id: 615, first_name: 'Satya', last_name: 'Singh', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'Shivneri Mar 2026 - 2A+pet' },
  { id: 616, first_name: 'Walk-in', last_name: 'Guest (Shivneri 14th)', nationality: 'Indian', total_stays: 1, total_spent: 5000, lifetime_value: 5000, notes: 'Shivneri Mar 2026 - 2 nights, 5 adults, name not recorded' },
  { id: 617, first_name: 'Shubham', last_name: 'Dasgupta', nationality: 'Indian', total_stays: 1, total_spent: 2000, lifetime_value: 2000, notes: 'Shivneri Mar 2026 - 2 adults' },
  { id: 618, first_name: 'Venkat', last_name: '(Shivneri)', nationality: 'Indian', total_stays: 1, total_spent: 4000, lifetime_value: 4000, notes: 'Shivneri Mar 2026 - 4A+2K' },
  { id: 619, first_name: 'Prashant', last_name: 'Katikas', nationality: 'Indian', total_stays: 1, total_spent: 4000, lifetime_value: 4000, notes: 'Shivneri Mar 2026 - 6 adults' },
  { id: 620, first_name: 'Pravin', last_name: 'Patil', nationality: 'Indian', total_stays: 1, total_spent: 6000, lifetime_value: 6000, notes: 'Shivneri Mar 2026 - 2 nights, 4 adults' },
  { id: 621, first_name: 'Rajendra', last_name: 'Bagde', nationality: 'Indian', total_stays: 1, total_spent: 4200, lifetime_value: 4200, notes: 'Shivneri Mar 2026 - 4A+1K, also booked SR ₹1000' },
  { id: 622, first_name: 'Kailash', last_name: 'Nimbalkar', nationality: 'Indian', total_stays: 1, total_spent: 6500, lifetime_value: 6500, notes: 'Shivneri Mar 2026 - 7A+3K' },
  { id: 623, first_name: 'Yashwardhan', last_name: 'Rajawat', nationality: 'Indian', total_stays: 1, total_spent: 3150, lifetime_value: 3150, notes: 'Shivneri Mar 2026 - 2A+1K+1 pet' },
  { id: 624, first_name: 'Vatsal', last_name: 'Mulay', nationality: 'Indian', total_stays: 1, total_spent: 8250, lifetime_value: 8250, notes: 'Shivneri Mar 2026 - 3 nights, 4 adults' },
];

const shivneriBookings = [
  { id: 609, property_id: 2, guest_id: 609, channel: 'direct', check_in: '2026-03-01', check_out: '2026-03-02', adults: 5, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 610, property_id: 2, guest_id: 610, channel: 'direct', check_in: '2026-03-02', check_out: '2026-03-03', adults: 3, children: 1, nightly_rate: 2896, subtotal: 2896, gross_amount: 2896, net_amount: 2896, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2896, pending_amount: 0, booking_status: 'checked-out' },
  { id: 611, property_id: 2, guest_id: 611, channel: 'direct', check_in: '2026-03-06', check_out: '2026-03-07', adults: 2, nightly_rate: 3500, subtotal: 3500, gross_amount: 3500, net_amount: 3500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3500, pending_amount: 0, booking_status: 'checked-out' },
  { id: 612, property_id: 2, guest_id: 612, channel: 'direct', check_in: '2026-03-08', check_out: '2026-03-09', adults: 4, nightly_rate: 3200, subtotal: 3200, gross_amount: 3200, net_amount: 3200, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3200, pending_amount: 0, booking_status: 'checked-out', special_requests: '1 pet' },
  { id: 613, property_id: 2, guest_id: 613, channel: 'direct', check_in: '2026-03-09', check_out: '2026-03-10', adults: 6, nightly_rate: 4000, subtotal: 4000, gross_amount: 4000, net_amount: 4000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 614, property_id: 2, guest_id: 614, channel: 'direct', check_in: '2026-03-10', check_out: '2026-03-13', adults: 5, children: 1, nightly_rate: 3500, subtotal: 10500, gross_amount: 10500, net_amount: 10500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 10500, pending_amount: 0, booking_status: 'checked-out' },
  { id: 615, property_id: 2, guest_id: 615, channel: 'direct', check_in: '2026-03-13', check_out: '2026-03-14', adults: 2, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked-out', special_requests: '1 pet' },
  { id: 616, property_id: 2, guest_id: 616, channel: 'direct', check_in: '2026-03-14', check_out: '2026-03-16', adults: 5, nightly_rate: 2500, subtotal: 5000, gross_amount: 5000, net_amount: 5000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 5000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 617, property_id: 2, guest_id: 617, channel: 'direct', check_in: '2026-03-16', check_out: '2026-03-17', adults: 2, nightly_rate: 2000, subtotal: 2000, gross_amount: 2000, net_amount: 2000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 618, property_id: 2, guest_id: 618, channel: 'direct', check_in: '2026-03-18', check_out: '2026-03-19', adults: 4, children: 2, nightly_rate: 4000, subtotal: 4000, gross_amount: 4000, net_amount: 4000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 4000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 619, property_id: 2, guest_id: 619, channel: 'direct', check_in: '2026-03-19', check_out: '2026-03-20', adults: 6, nightly_rate: 4000, subtotal: 4000, gross_amount: 4000, net_amount: 4000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 2000, pending_amount: 2000, booking_status: 'checked-out' },
  { id: 620, property_id: 2, guest_id: 620, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-22', adults: 4, nightly_rate: 3000, subtotal: 6000, gross_amount: 6000, net_amount: 6000, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 3000, pending_amount: 3000, booking_status: 'checked-out' },
  { id: 621, property_id: 2, guest_id: 621, channel: 'direct', check_in: '2026-03-22', check_out: '2026-03-23', adults: 4, children: 1, nightly_rate: 4200, subtotal: 4200, gross_amount: 4200, net_amount: 4200, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 2000, pending_amount: 2200, booking_status: 'checked-out', special_requests: 'Also booked Single Room for ₹1000' },
  { id: 622, property_id: 2, guest_id: 622, channel: 'direct', check_in: '2026-03-23', check_out: '2026-03-24', adults: 7, children: 3, nightly_rate: 6500, subtotal: 6500, gross_amount: 6500, net_amount: 6500, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 3000, pending_amount: 3500, booking_status: 'checked-out' },
  { id: 623, property_id: 2, guest_id: 623, channel: 'direct', check_in: '2026-03-28', check_out: '2026-03-29', adults: 2, children: 1, nightly_rate: 3150, subtotal: 3150, gross_amount: 3150, net_amount: 3150, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 1575, pending_amount: 1575, booking_status: 'confirmed', special_requests: '1 pet' },
  { id: 624, property_id: 2, guest_id: 624, channel: 'direct', check_in: '2026-03-31', check_out: '2026-04-03', adults: 4, nightly_rate: 2750, subtotal: 8250, gross_amount: 8250, net_amount: 8250, currency: 'INR', payment_status: 'partial', payment_method: 'UPI', paid_amount: 4000, pending_amount: 4250, booking_status: 'confirmed' },
];

// ============ SH2 non-conflicting (Property 3) ============
const sh2Guests = [
  { id: 625, first_name: 'Vinoj', last_name: '', nationality: 'Indian', total_stays: 1, total_spent: 2446, lifetime_value: 2446, notes: 'SH2 Mar 2026 - 2A+2K' },
  { id: 626, first_name: 'Venkat', last_name: '(SH2)', nationality: 'Indian', total_stays: 1, total_spent: 2800, lifetime_value: 2800, notes: 'SH2 Mar 2026' },
];

const sh2Bookings = [
  { id: 625, property_id: 3, guest_id: 625, channel: 'direct', check_in: '2026-03-18', check_out: '2026-03-19', adults: 2, children: 2, nightly_rate: 2446, subtotal: 2446, gross_amount: 2446, net_amount: 2446, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2446, pending_amount: 0, booking_status: 'checked-out' },
  { id: 626, property_id: 3, guest_id: 626, channel: 'direct', check_in: '2026-03-19', check_out: '2026-03-20', adults: 2, nightly_rate: 2800, subtotal: 2800, gross_amount: 2800, net_amount: 2800, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2800, pending_amount: 0, booking_status: 'checked-out' },
];

// ============ SH1 - Solapur Homestay 1 (Property 4) ============
const sh1Guests = [
  { id: 627, first_name: 'Rema', last_name: '', nationality: 'Indian', total_stays: 1, total_spent: 2400, lifetime_value: 2400, notes: 'SH1 Mar 2026 - 2A+1 pet, also SR ₹1000' },
  { id: 628, first_name: 'Kanishka', last_name: 'Mohite', nationality: 'Indian', total_stays: 1, total_spent: 3000, lifetime_value: 3000, notes: 'SH1 Mar 2026 - 6A+1K' },
];

const sh1Bookings = [
  { id: 627, property_id: 4, guest_id: 627, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-21', adults: 2, nightly_rate: 2400, subtotal: 2400, gross_amount: 2400, net_amount: 2400, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 2400, pending_amount: 0, booking_status: 'checked-out', special_requests: '1 pet' },
  { id: 628, property_id: 4, guest_id: 628, channel: 'direct', check_in: '2026-03-21', check_out: '2026-03-22', adults: 6, children: 1, nightly_rate: 3000, subtotal: 3000, gross_amount: 3000, net_amount: 3000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 3000, pending_amount: 0, booking_status: 'checked-out' },
];

// ============ Single Room add-ons (Property 5) ============
// Rema also booked SR on Mar 20, Kanishka Mohite booked SR on Mar 20, Rajendra Bagde SR on Mar 22
const srBookings = [
  { id: 629, property_id: 5, guest_id: 627, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-21', adults: 1, nightly_rate: 1000, subtotal: 1000, gross_amount: 1000, net_amount: 1000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 1000, pending_amount: 0, booking_status: 'checked-out', special_requests: 'SR add-on for Rema (SH1)' },
  { id: 630, property_id: 5, guest_id: 628, channel: 'direct', check_in: '2026-03-20', check_out: '2026-03-21', adults: 1, nightly_rate: 1500, subtotal: 1500, gross_amount: 1500, net_amount: 1500, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 1500, pending_amount: 0, booking_status: 'checked-out', special_requests: 'SR add-on for Kanishka Mohite' },
  { id: 631, property_id: 5, guest_id: 621, channel: 'direct', check_in: '2026-03-22', check_out: '2026-03-23', adults: 1, nightly_rate: 1000, subtotal: 1000, gross_amount: 1000, net_amount: 1000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 1000, pending_amount: 0, booking_status: 'checked-out', special_requests: 'SR add-on for Rajendra Bagde (Shivneri)' },
];

// ============ Jan/Feb 2026 - Rajlakshmi Niwas / SH2 (Property 3) ============
const febGuests = [
  { id: 631, first_name: 'Pawar', last_name: 'Kajod', nationality: 'Indian', total_stays: 1, total_spent: 10000, lifetime_value: 10000, notes: 'SH2 Rajlakshmi Niwas Feb 2026 - 7 nights' },
  { id: 632, first_name: 'Nilima', last_name: 'Milind Khandekar', nationality: 'Indian', total_stays: 1, total_spent: 12000, lifetime_value: 12000, notes: 'SH2 Rajlakshmi Niwas Feb 2026 - 5 nights, 5 guests' },
];

const febBookings = [
  { id: 632, property_id: 3, guest_id: 631, channel: 'direct', check_in: '2026-02-05', check_out: '2026-02-12', adults: 2, nightly_rate: 1429, subtotal: 10000, gross_amount: 10000, net_amount: 10000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 10000, pending_amount: 0, booking_status: 'checked-out' },
  { id: 633, property_id: 3, guest_id: 632, channel: 'direct', check_in: '2026-02-22', check_out: '2026-02-27', adults: 5, nightly_rate: 2400, subtotal: 12000, gross_amount: 12000, net_amount: 12000, currency: 'INR', payment_status: 'paid', payment_method: 'UPI', paid_amount: 12000, pending_amount: 0, booking_status: 'checked-out' },
];

// ============ SEED FUNCTION ============
async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Adding all property records...\n');

  const allGuests = [...tornaGuests, ...shivneriGuests, ...sh2Guests, ...sh1Guests, ...febGuests];
  const allBookings = [...tornaBookings, ...shivneriBookings, ...sh2Bookings, ...sh1Bookings, ...srBookings, ...febBookings];

  // Upsert guests
  for (const g of allGuests) {
    await Guest.findOneAndUpdate({ id: g.id }, g, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Guests added/updated: ${allGuests.length}`);

  // Upsert bookings
  for (const b of allBookings) {
    await Booking.findOneAndUpdate({ id: b.id }, b, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Bookings added/updated: ${allBookings.length}`);

  // Update counters
  await Counter.findByIdAndUpdate('guests', { seq: 700 }, { upsert: true, returnDocument: 'after' });
  await Counter.findByIdAndUpdate('bookings', { seq: 700 }, { upsert: true, returnDocument: 'after' });
  console.log('  Counters updated to 700');

  // Summary
  const totalGuests = await Guest.countDocuments();
  const totalBookings = await Booking.countDocuments();
  console.log(`\n  Total guests in DB: ${totalGuests}`);
  console.log(`  Total bookings in DB: ${totalBookings}`);

  console.log('\nBreakdown:');
  console.log(`  Torna (Property 1): ${tornaBookings.length} bookings`);
  console.log(`  Shivneri (Property 2): ${shivneriBookings.length} bookings`);
  console.log(`  SH2 new (Property 3): ${sh2Bookings.length} bookings`);
  console.log(`  SH1 (Property 4): ${sh1Bookings.length} bookings`);
  console.log(`  Single Room add-ons (Property 5): ${srBookings.length} bookings`);
  console.log(`  Feb SH2/Rajlakshmi Niwas (Property 3): ${febBookings.length} bookings`);

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
