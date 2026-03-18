const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  name: String,
  property_type: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  total_rooms: { type: Number, default: 1 },
  max_guests: { type: Number, default: 2 },
  base_price: { type: Number, default: 0 },
  description: String,
  amenities: [String],
  images: [String],
  latitude: Number,
  longitude: Number,
  google_maps_link: String,
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Property', propertySchema);
