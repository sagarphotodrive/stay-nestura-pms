const mongoose = require('mongoose');

// An imported OTA calendar (Booking.com/Airbnb/... iCal URL) for one property. The
// latest blocks fetched from it are kept in `events` and replaced on every sync, so a
// cancellation on the OTA side disappears here at the next sync.
const icalLinkSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  property_id: { type: Number, index: true },
  channel: { type: String, default: 'other' },
  ical_url: String,
  label: String,
  events: [{ _id: false, uid: String, start: String, end: String, summary: String }],
  last_synced_at: Date,
  last_sync_status: String, // 'success' | 'failed'
  last_error: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IcalLink', icalLinkSchema);
