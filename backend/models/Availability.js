const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  property_id: { type: Number, index: true },
  date: { type: String, index: true },
  rooms_available: { type: Number, default: 1 },
  is_blocked: { type: Boolean, default: false },
  blocked_reason: String,
  min_stay: { type: Number, default: 1 },
  max_stay: { type: Number, default: 30 },
  closed_to_arrival: { type: Boolean, default: false },
  closed_to_departure: { type: Boolean, default: false },
}, { timestamps: { updatedAt: 'updated_at', createdAt: false } });

availabilitySchema.index({ property_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
