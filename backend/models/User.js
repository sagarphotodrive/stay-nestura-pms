const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  email: { type: String, unique: true, index: true },
  password_hash: String,
  name: String,
  role: { type: String, default: 'manager' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);
