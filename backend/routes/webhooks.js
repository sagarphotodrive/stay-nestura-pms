// Stay Nestura Properties Management System
// Webhooks API Routes for OTA Integrations

const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');
const CryptoJS = require('crypto-js');

// Verify webhook signature
const verifyWebhook = (channel, signature, payload) => {
  const secret = process.env[`${channel.toUpperCase()}_WEBHOOK_SECRET`] || '';
  if (!secret) return true; // Skip if no secret configured
  
  const expectedSignature = CryptoJS.HmacSHA256(JSON.stringify(payload), secret).toString();
  return signature === expectedSignature;
};

// Airbnb Webhook Handler
router.post('/airbnb', async (req, res) => {
  try {
    const signature = req.headers['x-airbnb-signature'];
    const payload = req.body;

    // Verify webhook (skip for now in development)
    // if (!verifyWebhook('airbnb', signature, payload)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    console.log('Airbnb Webhook Received:', payload);

    const eventType = payload.event_type;
    const reservation = payload.reservation;

    switch (eventType) {
      case 'reservation_created':
      case 'reservation_confirmed':
        await handleReservationCreated(reservation, 'airbnb');
        break;
      case 'reservation_updated':
        await handleReservationUpdated(reservation, 'airbnb');
        break;
      case 'reservation_cancelled':
        await handleReservationCancelled(reservation, 'airbnb');
        break;
      default:
        console.log('Unhandled Airbnb event:', eventType);
    }

    res.json({ status: 'received' });
  } catch (error) {
    console.error('Airbnb webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Booking.com Webhook Handler
router.post('/booking', async (req, res) => {
  try {
    const signature = req.headers['x-booking-signature'];
    const payload = req.body;

    console.log('Booking.com Webhook Received:', payload);

    const eventType = payload.event;
    const reservation = payload.data;

    switch (eventType) {
      case 'booking_created':
      case 'booking_modified':
        await handleReservationCreated(reservation, 'booking.com');
        break;
      case 'booking_cancel':
        await handleReservationCancelled(reservation, 'booking.com');
        break;
      default:
        console.log('Unhandled Booking.com event:', eventType);
    }

    res.json({ status: 'received' });
  } catch (error) {
    console.error('Booking.com webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle new reservation from OTA
const handleReservationCreated = async (reservation, channel) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Find or create guest
    let guestId;
    const guestResult = await client.query(`
      SELECT id FROM guests WHERE phone = $1
    `, [reservation.guest?.phone || reservation.primary_phone]);

    if (guestResult.rows.length > 0) {
      guestId = guestResult.rows[0].id;
      await client.query(`
        UPDATE guests SET 
          email = COALESCE($1, email),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name)
        WHERE id = $4
      `, [reservation.guest?.email, reservation.guest?.first_name, reservation.guest?.last_name, guestId]);
    } else {
      const newGuest = await client.query(`
        INSERT INTO guests (first_name, last_name, email, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        reservation.guest?.first_name || reservation.guest?.name?.split(' ')[0],
        reservation.guest?.last_name || reservation.guest?.name?.split(' ').slice(1).join(' '),
        reservation.guest?.email,
        reservation.guest?.phone || reservation.primary_phone
      ]);
      guestId = newGuest.rows[0].id;
    }

    // Find property by external ID or name
    let propertyId;
    const propResult = await client.query(`
      SELECT id FROM properties WHERE name ILIKE $1 LIMIT 1
    `, [`%${reservation.listing_id || reservation.room_id || reservation.property_name}%`]);

    if (propResult.rows.length > 0) {
      propertyId = propResult.rows[0].id;
    } else {
      // Default to first property if not found
      const defaultProp = await client.query(`SELECT id FROM properties LIMIT 1`);
      propertyId = defaultProp.rows[0].id;
    }

    // Calculate financials
    const checkIn = new Date(reservation.start_date || reservation.checkin);
    const checkOut = new Date(reservation.end_date || reservation.checkout);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const nightlyRate = (reservation.total_payout || reservation.price) / nights;
    const grossAmount = reservation.total_payout || reservation.price;
    
    // Get commission rate
    const channelResult = await client.query(`
      SELECT commission_percent FROM channel_accounts WHERE channel_name = $1
    `, [channel]);
    const commissionPercent = channelResult.rows[0]?.commission_percent || (channel === 'booking.com' ? 15 : 3);
    const commissionAmount = grossAmount * (commissionPercent / 100);
    const netAmount = grossAmount - commissionAmount;

    // Check for conflicts
    const conflictCheck = await client.query(`
      SELECT id FROM bookings
      WHERE property_id = $1
        AND booking_status NOT IN ('cancelled')
        AND check_out > $2
        AND check_in < $3
      FOR UPDATE
    `, [propertyId, checkIn.toISOString().split('T')[0], checkOut.toISOString().split('T')[0]]);

    if (conflictCheck.rows.length > 0) {
      console.log('Conflict detected - booking rejected');
      await client.query('ROLLBACK');
      // In production, send rejection back to OTA
      return;
    }

    // Create booking
    const bookingResult = await client.query(`
      INSERT INTO bookings (
        property_id, guest_id, channel, channel_booking_id,
        check_in, check_out, adults, children,
        nightly_rate, gross_amount, commission_percent, commission_amount, net_amount,
        booking_status, guest_message, confirmed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'confirmed', $14, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      propertyId, guestId, channel, reservation.confirmation_code || reservation.id,
      checkIn.toISOString().split('T')[0], checkOut.toISOString().split('T')[0],
      reservation.guests?.adults || 1, reservation.guests?.children || 0,
      nightlyRate, grossAmount, commissionPercent, commissionAmount, netAmount,
      reservation.guest_message
    ]);

    // Update availability
    await client.query(`
      UPDATE availability
      SET rooms_available = rooms_available - 1
      WHERE property_id = $1
        AND date >= $2
        AND date < $3
        AND rooms_available > 0
    `, [propertyId, checkIn.toISOString().split('T')[0], checkOut.toISOString().split('T')[0]]);

    // Update guest stats
    await client.query(`
      UPDATE guests SET 
        total_stays = total_stays + 1,
        total_spent = total_spent + $2,
        lifetime_value = lifetime_value + $2
      WHERE id = $1
    `, [guestId, netAmount]);

    // Block other properties (within 30 seconds as per spec)
    await blockOtherProperties(propertyId, checkIn, checkOut);

    await client.query('COMMIT');

    console.log(`Booking created from ${channel}:`, bookingResult.rows[0].id);
    return bookingResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error handling reservation created:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Handle reservation update
const handleReservationUpdated = async (reservation, channel) => {
  try {
    const result = await query(`
      UPDATE bookings SET
        check_in = COALESCE($1, check_in),
        check_out = COALESCE($2, check_out),
        nightly_rate = COALESCE($3, nightly_rate),
        gross_amount = COALESCE($4, gross_amount),
        guest_message = COALESCE($5, guest_message),
        updated_at = CURRENT_TIMESTAMP
      WHERE channel_booking_id = $6 AND channel = $7
      RETURNING *
    `, [
      reservation.start_date, reservation.end_date,
      reservation.price, reservation.total_payout,
      reservation.guest_message, reservation.confirmation_code, channel
    ]);

    console.log(`Booking updated from ${channel}:`, result.rows[0]?.id);
  } catch (error) {
    console.error('Error handling reservation updated:', error);
  }
};

// Handle reservation cancellation
const handleReservationCancelled = async (reservation, channel) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE bookings SET
        booking_status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE channel_booking_id = $2 AND channel = $3
      RETURNING *
    `, [reservation.cancellation_reason, reservation.confirmation_code, channel]);

    if (result.rows.length > 0) {
      const booking = result.rows[0];
      
      // Restore availability
      await client.query(`
        UPDATE availability
        SET rooms_available = rooms_available + 1
        WHERE property_id = $1
          AND date >= $2
          AND date < $3
      `, [booking.property_id, booking.check_in, booking.check_out]);
    }

    await client.query('COMMIT');
    console.log(`Booking cancelled from ${channel}:`, reservation.confirmation_code);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error handling reservation cancelled:', error);
  } finally {
    client.release();
  }
};

// Block other properties for same dates (as per spec - within 30 seconds)
const blockOtherProperties = async (bookedPropertyId, checkIn, checkOut) => {
  try {
    // In production, this would push blocks to all other OTAs
    // For now, just log the action
    console.log(`Blocking other properties from ${checkIn} to ${checkOut} except property ${bookedPropertyId}`);
    
    // This would trigger:
    // 1. Push availability update to Airbnb
    // 2. Push availability update to Booking.com
    // 3. Update Redis cache
    
    const io = require('../../server').io;
    if (io) {
      io.emit('property:blocked', {
        excludePropertyId: bookedPropertyId,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0]
      });
    }
  } catch (error) {
    console.error('Error blocking other properties:', error);
  }
};

// Test webhook endpoint
router.post('/test', async (req, res) => {
  const { channel, event_type, data } = req.body;
  
  // Simulate webhook processing
  if (channel === 'airbnb') {
    await handleReservationCreated(data, 'airbnb');
  } else if (channel === 'booking.com') {
    await handleReservationCreated(data, 'booking.com');
  }
  
  res.json({ success: true, message: `Test ${channel} webhook processed` });
});

module.exports = router;
