const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  channel: String,
  sync_type: String,
  status: { type: String, default: 'success', enum: ['success', 'failed', 'partial'] },
  records_processed: { type: Number, default: 0, min: 0 },
  error_details: String,
  started_at: Date,
  completed_at: Date,
}, { suppressReservedKeysWarning: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
