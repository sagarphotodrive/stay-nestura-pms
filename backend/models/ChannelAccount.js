const mongoose = require('mongoose');

const channelAccountSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  channel_name: String,
  account_id: String,
  api_key_encrypted: String,
  api_secret_encrypted: String,
  webhook_secret: String,
  is_active: { type: Boolean, default: true },
  commission_percent: { type: Number, default: 0 },
  sync_enabled: { type: Boolean, default: true },
  last_sync: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ChannelAccount', channelAccountSchema);
