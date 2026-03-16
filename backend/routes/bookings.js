// Stay Nestura Properties Management System
// Bookings API Routes

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');

// Get all bookings with filters
router.get('/', async (req, res) => {
  try {
    const { 
      property_id, status, start_date, end_date, 
      channel, guest_id, page = 1, limit = 20 
    } = req.query;

    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (property_id) {
      conditions.push(`b.property_id = $${paramCount}`);
      params.push(property_id);
      paramCount++;
    }
    if (status) {
      conditions.push(`b.booking_status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (start_date) {
      conditions.push(`b.check_in >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      conditions.push(`b.check_out <= $${paramCount}`);
      params.push(end_date);
      paramCount++;
    }
    if (channel) {
      conditions.push(`b.channel = $${paramCount}`);
      params.push(channel);
      paramCount++;
    }
    if (guest_id) {
      conditions.push(`b.guest_id = $${paramCount}`);
      params.push(guest_id);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT b.*, 
        p.name as property_name,
        g.first_name, g.last_name, g.email, g.phone
      FROM bookings b
      LEFT JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      ${whereClause}
      ORDER BY b.check_in DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await query(`
      SELECT COUNT(*) FROM bookings b ${whereClause}
    `, params);

    res.json({
      bookings: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get today's bookings (check-ins and check-outs)
router.get('/today', async (req, res) => {
  try {
    // Get check-ins for today
    const checkIns = await query(`
      SELECT b.*, p.name as property_name, p.address, p.google_maps_link,
        g.first_name, g.last_name, g.phone, g.email
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_in = CURRENT_DATE 
        AND b.booking_status IN ('confirmed', 'checked-in')
      ORDER BY b.check_in_time
    `);

    // Get check-outs for today
    const checkOuts = await query(`
      SELECT b.*, p.name as property_name,
        g.first_name, g.last_name, g.phone, g.email
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_out = CURRENT_DATE 
        AND b.booking_status = 'checked-in'
      ORDER BY b.check_out_time
    `);

    // Get currently staying guests
    const currentStay = await query(`
      SELECT b.*, p.name as property_name,
        g.first_name, g.last_name, g.phone, g.email
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_in <= CURRENT_DATE 
        AND b.check_out > CURRENT_DATE
        AND b.booking_status = 'checked-in'
    `);

    res.json({
      checkIns: checkIns.rows,
      checkOuts: checkOuts.rows,
      currentStay: currentStay.rows
    });
  } catch (error) {
    console.error('Error fetching today bookings:', error);
    res.status(500).json({ error: 'Failed to fetch today bookings' });
  }
});

// Get single booking
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT b.*, 
        p.name as property_name, p.address, p.google_maps_link, p.max_guests,
        g.first_name, g.last_name, g.email, g.phone, g.id_proof_type, g.id_proof_number
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get messages for this booking
    const messagesResult = await query(`
      SELECT * FROM messages
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `, [id]);

    res.json({
      ...result.rows[0],
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// Create new booking with conflict detection
router.post('/', async (req, res) => {
  const client = await require('../config/database').pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      property_id, guest_id, channel, channel_booking_id,
      check_in, check_out, adults, children, infants,
      nightly_rate, cleaning_fee, service_fee, taxes,
      gross_amount, payment_status, payment_method,
      guest_message, special_requests, check_in_time, check_out_time
    } = req.body;

    // Check for conflicts using row-level locking
    const conflictCheck = await client.query(`
      SELECT b.*, g.first_name, g.last_name
      FROM bookings b
      JOIN guests g ON g.id = b.guest_id
      WHERE b.property_id = $1
        AND b.booking_status NOT IN ('cancelled')
        AND b.check_out > $2
        AND b.check_in < $3
      FOR UPDATE OF b
    `, [property_id, check_in, check_out]);

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Booking conflict detected',
        conflictingBookings: conflictCheck.rows
      });
    }

    // Calculate financials
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const subtotal = nightly_rate * nights;
    const totalGross = gross_amount || (subtotal + (cleaning_fee || 0) + (service_fee || 0) + (taxes || 0));
    
    // Get commission rate from channel accounts
    const channelResult = await client.query(`
      SELECT commission_percent FROM channel_accounts
      WHERE channel_name = $1 AND is_active = true
    `, [channel || 'direct']);

    const commissionPercent = channelResult.rows[0]?.commission_percent || 0;
    const commissionAmount = totalGross * (commissionPercent / 100);
    const netAmount = totalGross - commissionAmount;

    // Insert booking
    const result = await client.query(`
      INSERT INTO bookings (
        property_id, guest_id, channel, channel_booking_id,
        check_in, check_out, adults, children, infants,
        nightly_rate, subtotal, cleaning_fee, service_fee, taxes,
        gross_amount, commission_percent, commission_amount, net_amount,
        payment_status, payment_method, guest_message, special_requests,
        check_in_time, check_out_time, booking_status, confirmed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'confirmed', CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      property_id, guest_id, channel || 'direct', channel_booking_id,
      check_in, check_out, adults || 1, children || 0, infants || 0,
      nightly_rate, subtotal, cleaning_fee || 0, service_fee || 0, taxes || 0,
      totalGross, commissionPercent, commissionAmount, netAmount,
      payment_status || 'pending', payment_method, guest_message, special_requests,
      check_in_time, check_out_time
    ]);

    // Update guest stats if guest exists
    if (guest_id) {
      await client.query(`
        UPDATE guests 
        SET total_stays = total_stays + 1, 
            total_spent = total_spent + $2,
            lifetime_value = lifetime_value + $2
        WHERE id = $1
      `, [guest_id, netAmount]);
    }

    // Update availability cache in Redis (would be implemented with actual Redis)
    // For now, update the availability table
    await client.query(`
      UPDATE availability
      SET rooms_available = rooms_available - 1
      WHERE property_id = $1
        AND date >= $2
        AND date < $3
        AND rooms_available > 0
    `, [property_id, check_in, check_out]);

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    io.emit('booking:created', result.rows[0]);
    io.to(`property:${property_id}`).emit('booking:created', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    client.release();
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_check_in, actual_check_out, cancellation_reason } = req.body;

    let updateFields = ['booking_status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [id, status];
    let paramCount = 2;

    if (status === 'checked-in') {
      updateFields.push(`actual_check_in = $${++paramCount}`);
      params.push(actual_check_in || new Date());
    }
    if (status === 'checked-out') {
      updateFields.push(`actual_check_out = $${++paramCount}`);
      params.push(actual_check_out || new Date());
    }
    if (status === 'cancelled') {
      updateFields.push(`cancelled_at = CURRENT_TIMESTAMP`);
      updateFields.push(`cancellation_reason = $${++paramCount}`);
      params.push(cancellation_reason);
    }

    const result = await query(`
      UPDATE bookings SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('booking:status_updated', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Update booking
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'check_in', 'check_out', 'adults', 'children', 'infants',
      'nightly_rate', 'cleaning_fee', 'service_fee', 'taxes',
      'gross_amount', 'payment_status', 'payment_method',
      'guest_message', 'special_requests', 'check_in_time', 'check_out_time',
      'paid_amount', 'pending_amount', 'booking_status'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(`
      UPDATE bookings SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.emit('booking:updated', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.post('/:id/cancel', async (req, res) => {
  const client = await require('../config/database').pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await client.query(`
      UPDATE bookings 
      SET booking_status = 'cancelled', 
          cancelled_at = CURRENT_TIMESTAMP,
          cancellation_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, cancellation_reason]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Restore availability
    const booking = result.rows[0];
    await client.query(`
      UPDATE availability
      SET rooms_available = rooms_available + 1
      WHERE property_id = $1
        AND date >= $2
        AND date < $3
    `, [booking.property_id, booking.check_in, booking.check_out]);

    await client.query('COMMIT');

    // Emit socket event
    const io = req.app.get('io');
    io.emit('booking:cancelled', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    client.release();
  }
});

// Get booking statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { property_id, start_date, end_date } = req.query;

    let dateFilter = '';
    let params = [];
    let paramCount = 1;

    if (start_date && end_date) {
      dateFilter = `AND b.check_in >= $${paramCount} AND b.check_in <= $${paramCount + 1}`;
      params = [property_id, start_date, end_date];
      paramCount += 2;
    } else {
      dateFilter = `AND b.check_in >= date_trunc('month', CURRENT_DATE)`;
      params = property_id ? [property_id] : [];
    }

    const propertyFilter = property_id ? `AND b.property_id = $1` : '';

    const result = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN b.booking_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(b.gross_amount) as total_gross,
        SUM(b.commission_amount) as total_commission,
        SUM(b.net_amount) as total_net,
        SUM(CASE WHEN b.booking_status NOT IN ('cancelled') THEN 1 ELSE 0 END) as confirmed_bookings,
        COUNT(DISTINCT b.guest_id) as unique_guests
      FROM bookings b
      WHERE 1=1 ${propertyFilter} ${dateFilter}
    `, params);

    // Get occupancy stats
    const occupancyResult = await query(`
      SELECT 
        p.id as property_id,
        p.name as property_name,
        COUNT(b.id) as total_nights_booked,
        p.total_rooms * 30 as total_nights_available,
        ROUND(COUNT(b.id)::numeric / (p.total_rooms * 30) * 100, 2) as occupancy_percent
      FROM properties p
      LEFT JOIN bookings b ON b.property_id = p.id
        AND b.booking_status NOT IN ('cancelled')
        AND b.check_in >= date_trunc('month', CURRENT_DATE)
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.total_rooms
    `, []);

    res.json({
      summary: result.rows[0],
      occupancy: occupancyResult.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
