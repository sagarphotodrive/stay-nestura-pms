const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  id_proof_type: String,
  id_proof_number: String,
  id_proof_encrypted: String,
  address: String,
  date_of_birth: Date,
  nationality: { type: String, default: 'Indian' },
  total_stays: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 },
  lifetime_value: { type: Number, default: 0 },
  preferences: String,
  notes: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Guest', guestSchema);
