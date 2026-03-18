const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[MongoDB] No MONGODB_URI set — using in-memory store');
    return false;
  }

  try {
    await mongoose.connect(uri);
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
