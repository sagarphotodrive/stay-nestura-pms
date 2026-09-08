const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
  name: String,
  role: { type: String, default: 'manager', enum: ['admin', 'manager', 'staff'] },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);
