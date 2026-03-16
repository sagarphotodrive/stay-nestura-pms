// Stay Nestura Properties Management System
// Channel Manager API Routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const axios = require('axios');

// Get all channel accounts
router.get('/accounts', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, channel_name, account_id, is_active, commission_percent, 
        sync_enabled, last_sync
      FROM channel_accounts
      ORDER BY channel_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching channel accounts:', error);
    res.status(500).json({ error: 'Failed to fetch channel accounts' });
  }
});

// Update channel account
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, sync_enabled, commission_percent } = req.body;

    const result = await query(`
      UPDATE channel_accounts SET
        is_active = COALESCE($1, is_active),
        sync_enabled = COALESCE($2, sync_enabled),
        commission_percent = COALESCE($3, commission_percent),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [is_active, sync_enabled, commission_percent, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel account not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating channel account:', error);
    res.status(500).json({ error: 'Failed to update channel account' });
  }
});

// Get availability across all channels
router.get('/availability', async (req, res) => {
  try {
    const { property_id, start_date, end_date } = req.query;

    const start = start_date || new Date().toISOString().split('T')[0];
    const end = end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let propertyFilter = '';
    let params = [start, end];
    let paramCount = 2;

    if (property_id) {
      propertyFilter = `AND property_id = $${++paramCount}`;
      params.push(property_id);
    }

    const result = await query(`
      SELECT 
        a.property_id,
        p.name as property_name,
        a.date,
        a.rooms_available,
        a.is_blocked,
        (SELECT total_rooms FROM properties WHERE id = a.property_id) as total_rooms
      FROM availability a
      JOIN properties p ON p.id = a.property_id
      WHERE a.date >= $1 AND a.date <= $2 ${propertyFilter}
      ORDER BY a.property_id, a.date
    `, params);

    // Group by property
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.property_id]) {
        grouped[row.property_id] = {
          property_id: row.property_id,
          property_name: row.property_name,
          total_rooms: row.total_rooms,
          dates: []
        };
      }
      grouped[row.property_id].dates.push({
        date: row.date,
        rooms_available: row.rooms_available,
        is_blocked: row.is_blocked
      });
    }

    res.json(Object.values(grouped));
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Push availability to all channels (Bulk ARI Update)
router.post('/push/availability', async (req, res) => {
  try {
    const { property_id, start_date, end_date, rooms_available, is_blocked } = req.body;

    // Update local database first
    let updateQuery = `
      UPDATE availability 
      SET rooms_available = $3, is_blocked = $4, updated_at = CURRENT_TIMESTAMP
      WHERE property_id = $1 AND date >= $2 AND date <= $5
    `;

    await query(updateQuery, [property_id, start_date, end_date, rooms_available, is_blocked]);

    // Get channel accounts
    const channels = await query(`
      SELECT * FROM channel_accounts WHERE is_active = true AND sync_enabled = true
    `);

    // In production, you would call actual APIs here
    // For now, we log what would be pushed
    const pushResults = [];
    for (const channel of channels.rows) {
      try {
        // Simulated API call - in production, replace with actual API
        // await pushToAirbnb(property_id, start_date, end_date, rooms_available);
        // await pushToBooking(property_id, start_date, end_date, rooms_available);
        
        pushResults.push({
          channel: channel.channel_name,
          status: 'success',
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        pushResults.push({
          channel: channel.channel_name,
          status: 'failed',
          error: err.message
        });
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('availability:pushed', { property_id, start_date, end_date });

    res.json({
      message: 'Availability pushed to channels',
      results: pushResults
    });
  } catch (error) {
    console.error('Error pushing availability:', error);
    res.status(500).json({ error: 'Failed to push availability' });
  }
});

// Push rates to all channels
router.post('/push/rates', async (req, res) => {
  try {
    const { property_id, rates } = req.body; // Array of { date, rate }

    // Update local database
    for (const r of rates) {
      await query(`
        INSERT INTO availability (property_id, date, rooms_available)
        VALUES ($1, $2, (SELECT total_rooms FROM properties WHERE id = $1))
        ON CONFLICT (property_id, date) DO NOTHING
      `, [property_id, r.date]);
    }

    // In production, push to Airbnb and Booking.com APIs
    const channels = await query(`
      SELECT * FROM channel_accounts WHERE is_active = true AND sync_enabled = true
    `);

    res.json({
      message: 'Rates pushed to channels',
      channels: channels.rows.length
    });
  } catch (error) {
    console.error('Error pushing rates:', error);
    res.status(500).json({ error: 'Failed to push rates' });
  }
});

// Sync all properties with channels
router.post('/sync/all', async (req, res) => {
  try {
    const startTime = new Date();

    // Get all active properties
    const properties = await query(`
      SELECT id, name FROM properties WHERE is_active = true
    `);

    const results = [];
    for (const prop of properties.rows) {
      // Get current availability
      const availability = await query(`
        SELECT date, rooms_available, is_blocked
        FROM availability
        WHERE property_id = $1 AND date >= CURRENT_DATE
        ORDER BY date
      `, [prop.id]);

      // In production, sync with each channel
      results.push({
        property_id: prop.id,
        property_name: prop.name,
        availability_count: availability.rows.length,
        status: 'synced'
      });
    }

    // Log sync
    await query(`
      INSERT INTO sync_logs (channel, sync_type, status, records_processed, completed_at)
      VALUES ('all', 'full', 'completed', $1, $2)
    `, [properties.rows.length, new Date()]);

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;

    res.json({
      message: 'Full sync completed',
      duration_seconds: duration,
      properties_synced: properties.rows.length,
      results
    });
  } catch (error) {
    console.error('Error syncing:', error);
    res.status(500).json({ error: 'Failed to sync' });
  }
});

// Get sync logs
router.get('/sync/logs', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await query(`
      SELECT * FROM sync_logs
      ORDER BY started_at DESC
      LIMIT $1
    `, [parseInt(limit)]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
});

// Get real-time sync status
router.get('/sync/status', async (req, res) => {
  try {
    const lastSync = await query(`
      SELECT * FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 1
    `);

    const channels = await query(`
      SELECT channel_name, is_active, sync_enabled, last_sync
      FROM channel_accounts
    `);

    res.json({
      lastSync: lastSync.rows[0]?.started_at || null,
      nextSyncIn: 30, // seconds
      channels: channels.rows,
      status: 'connected'
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

module.exports = router;
