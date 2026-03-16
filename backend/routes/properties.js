// Stay Nestura Properties Management System
// Properties API Routes

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM bookings b 
         WHERE b.property_id = p.id 
         AND b.check_in <= CURRENT_DATE 
         AND b.check_out > CURRENT_DATE 
         AND b.booking_status IN ('confirmed', 'checked-in')) as current_bookings,
        (SELECT COALESCE(SUM(b.net_amount), 0) FROM bookings b 
         WHERE b.property_id = p.id 
         AND b.booking_status NOT IN ('cancelled')
         AND b.check_in >= date_trunc('month', CURRENT_DATE)) as month_revenue
      FROM properties p
      WHERE p.is_active = true
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// Get single property with availability
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM bookings b 
         WHERE b.property_id = p.id 
         AND b.check_in <= CURRENT_DATE 
         AND b.check_out > CURRENT_DATE 
         AND b.booking_status IN ('confirmed', 'checked-in')) as current_bookings
      FROM properties p
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get availability for next 30 days
    const availabilityResult = await query(`
      SELECT a.* FROM availability a
      WHERE a.property_id = $1
      AND a.date >= CURRENT_DATE
      AND a.date <= CURRENT_DATE + 30
      ORDER BY a.date
    `, [id]);

    res.json({
      ...result.rows[0],
      availability: availabilityResult.rows
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Create new property
router.post('/', async (req, res) => {
  try {
    const {
      name, property_type, address, city, state, pincode,
      total_rooms, max_guests, base_price, description,
      amenities, images, latitude, longitude, google_maps_link
    } = req.body;

    const result = await query(`
      INSERT INTO properties (
        name, property_type, address, city, state, pincode,
        total_rooms, max_guests, base_price, description,
        amenities, images, latitude, longitude, google_maps_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      name, property_type, address || '', city || 'Solapur', 
      state || 'Maharashtra', pincode, total_rooms || 1,
      max_guests || 2, base_price || 0, description || '',
      amenities || [], images || [], latitude, longitude, google_maps_link
    ]);

    // Initialize availability for next 365 days
    const propertyId = result.rows[0].id;
    await query(`
      INSERT INTO availability (property_id, date, rooms_available)
      SELECT $1, generate_series(CURRENT_DATE, CURRENT_DATE + 365), $2
      ON CONFLICT DO NOTHING
    `, [propertyId, total_rooms || 1]);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('property:created', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'property_type', 'address', 'city', 'state', 'pincode', 
           'total_rooms', 'max_guests', 'base_price', 'description', 
           'amenities', 'images', 'latitude', 'longitude', 'google_maps_link', 'is_active'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE properties SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('property:updated', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

// Delete property (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      UPDATE properties SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('property:deleted', { id });

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

// Get property availability calendar
router.get('/:id/calendar', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    const result = await query(`
      SELECT 
        a.date,
        a.rooms_available,
        a.is_blocked,
        a.blocked_reason,
        b.id as booking_id,
        b.guest_id,
        b.check_in,
        b.check_out,
        b.booking_status,
        g.first_name,
        g.last_name,
        g.phone
      FROM availability a
      LEFT JOIN bookings b ON b.property_id = a.property_id 
        AND a.date >= b.check_in 
        AND a.date < b.check_out
        AND b.booking_status NOT IN ('cancelled')
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE a.property_id = $1
        AND a.date >= $2
        AND a.date <= $3
      ORDER BY a.date
    `, [id, start || new Date().toISOString().split('T')[0], end || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0]]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// Block/unblock dates
router.post('/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, reason } = req.body;

    await query(`
      UPDATE availability 
      SET is_blocked = true, blocked_reason = $3, updated_at = CURRENT_TIMESTAMP
      WHERE property_id = $1 
        AND date >= $2 
        AND date <= $4
    `, [id, start_date, reason, end_date]);

    // Emit socket event
    const io = req.app.get('io');
    io.to(`property:${id}`).emit('availability:updated', { propertyId: id, start_date, end_date });

    res.json({ message: 'Dates blocked successfully' });
  } catch (error) {
    console.error('Error blocking dates:', error);
    res.status(500).json({ error: 'Failed to block dates' });
  }
});

// Update rates for property
router.post('/:id/rates', async (req, res) => {
  try {
    const { id } = req.params;
    const { rates } = req.body; // Array of { date, rate, min_stay, max_stay }

    for (const r of rates) {
      await query(`
        INSERT INTO availability (property_id, date, rooms_available, min_stay, max_stay)
        VALUES ($1, $2, (SELECT total_rooms FROM properties WHERE id = $1), $3, $4)
        ON CONFLICT (property_id, date) 
        DO UPDATE SET min_stay = $3, max_stay = $4
      `, [id, r.date, r.min_stay || 1, r.max_stay || 30]);
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`property:${id}`).emit('rates:updated', { propertyId: id });

    res.json({ message: 'Rates updated successfully' });
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ error: 'Failed to update rates' });
  }
});

module.exports = router;
