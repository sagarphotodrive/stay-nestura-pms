require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const { Guest, Booking, Counter } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// Convert Excel serial date to YYYY-MM-DD
function excelDate(serial) {
  const d = new Date((serial - 25569) * 86400000);
  return d.toISOString().split('T')[0];
}

// Property name to ID mapping
const PROP_MAP = {
  'Shivneri': 2,
  'Rajlakshmi Niwas': 3,
  'Torna': 1,
  'Solapur Homestay 1 by Stay Nestura': 4,
  'Single Room Twin Sharing by Stay Nestura': 5,
  'Deluxe Room by Stay Nestura': 6,
};

async function seed() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(path.join('C:/Users/ashut/OneDrive/Documents/Homestay Data.xlsx'));

  // Collect all rows from all sheets
  const allRows = [];
  wb.SheetNames.forEach(name => {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
    data.forEach(row => allRows.push(row));
  });
  console.log(`Total rows from Excel: ${allRows.length}`);

  // Build unique guests (by first_name + last_name)
  const guestMap = new Map();
  let guestId = 1;
  allRows.forEach(row => {
    const key = `${row['First Name']}|${row['Last Name']}`.toLowerCase();
    if (!guestMap.has(key)) {
      guestMap.set(key, {
        id: guestId++,
        first_name: row['First Name'],
        last_name: row['Last Name'] || '',
        nationality: 'Indian',
        total_stays: 0,
        total_spent: 0,
        lifetime_value: 0,
      });
    }
    const g = guestMap.get(key);
    g.total_stays += 1;
    g.total_spent += (row['Total Amount (INR)'] || 0);
    g.lifetime_value += (row['Total Amount (INR)'] || 0);
  });

  const guests = Array.from(guestMap.values());

  // Build bookings
  let bookingId = 1;
  const bookings = allRows.map(row => {
    const propId = PROP_MAP[row['Property']];
    const guestKey = `${row['First Name']}|${row['Last Name']}`.toLowerCase();
    const guest = guestMap.get(guestKey);
    const checkIn = excelDate(row['Check In']);
    const checkOut = excelDate(row['Check Out']);
    const nights = Math.round((row['Check Out'] - row['Check In']));
    const total = row['Total Amount (INR)'] || 0;
    const advance = row['Advance'] || 0;
    const pending = total - advance;
    const nightly = nights > 0 ? Math.round(total / nights) : total;

    let paymentStatus = 'paid';
    if (advance > 0 && pending > 0) paymentStatus = 'partial';
    if (total === 0) paymentStatus = 'pending';

    // Determine booking status based on checkout date
    const today = new Date('2026-03-19');
    const coDate = new Date(checkOut);
    let bookingStatus = 'checked_out';
    if (coDate > today) bookingStatus = 'confirmed';

    return {
      id: bookingId++,
      property_id: propId,
      guest_id: guest.id,
      channel: 'direct',
      check_in: checkIn,
      check_out: checkOut,
      adults: row['Adults'] || 0,
      children: row['Kids'] || 0,
      nightly_rate: nightly,
      subtotal: total,
      gross_amount: total,
      net_amount: total,
      currency: 'INR',
      payment_status: paymentStatus,
      payment_method: 'UPI',
      paid_amount: advance > 0 ? advance : total,
      pending_amount: advance > 0 ? pending : 0,
      booking_status: bookingStatus,
      special_requests: row['Pets'] > 0 ? `${row['Pets']} pet(s)` : '',
    };
  });

  console.log(`Unique guests: ${guests.length}`);
  console.log(`Total bookings: ${bookings.length}`);

  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  // Upsert guests
  for (const g of guests) {
    await Guest.findOneAndUpdate({ id: g.id }, g, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Guests upserted: ${guests.length}`);

  // Upsert bookings
  for (const b of bookings) {
    await Booking.findOneAndUpdate({ id: b.id }, b, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Bookings upserted: ${bookings.length}`);

  // Update counters
  const maxGuestId = Math.max(...guests.map(g => g.id));
  const maxBookingId = Math.max(...bookings.map(b => b.id));
  const counterVal = Math.max(maxGuestId, maxBookingId) + 100;
  await Counter.findByIdAndUpdate('guests', { seq: counterVal }, { upsert: true, returnDocument: 'after' });
  await Counter.findByIdAndUpdate('bookings', { seq: counterVal }, { upsert: true, returnDocument: 'after' });
  console.log(`  Counters set to: ${counterVal}`);

  // Summary by property
  console.log('\nBreakdown:');
  const propNames = { 1: 'Torna', 2: 'Shivneri', 3: 'Rajlakshmi Niwas (SH2)', 4: 'SH1', 5: 'Single Room', 6: 'Deluxe Room' };
  for (const [id, name] of Object.entries(propNames)) {
    const count = bookings.filter(b => b.property_id === parseInt(id)).length;
    const revenue = bookings.filter(b => b.property_id === parseInt(id)).reduce((s, b) => s + b.gross_amount, 0);
    if (count > 0) console.log(`  ${name}: ${count} bookings, ₹${revenue.toLocaleString('en-IN')}`);
  }

  const totalGuests = await Guest.countDocuments();
  const totalBookings = await Booking.countDocuments();
  console.log(`\nDB totals - Guests: ${totalGuests}, Bookings: ${totalBookings}`);

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
