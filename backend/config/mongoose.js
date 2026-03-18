const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to resolve MongoDB Atlas SRV records (some ISPs block SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4']);

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[MongoDB] No MONGODB_URI set — using in-memory store');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    isConnected = true;
    console.log('[MongoDB] Connected successfully');
    return true;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    console.log('[MongoDB] Falling back to in-memory store');
    return false;
  }
}

function isMongoConnected() {
  return isConnected;
}

module.exports = { connectDB, isMongoConnected };
