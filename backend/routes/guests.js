// Stay Nestura Properties Management System
// Guests API Routes (CRM)

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const CryptoJS = require('crypto-js');

// AES-256 encryption helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'stay-nestura-secret-key-2024';

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Get all guests with search
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    let whereClause = '';
    let params = [];
    let paramCount = 1;

    if (search) {
      whereClause = `WHERE (
        LOWER(first_name) LIKE LOWER($${paramCount}) 
        OR LOWER(last_name) LIKE LOWER($${paramCount}) 
        OR LOWER(email) LIKE LOWER($${paramCount}) 
        OR phone LIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT id, first_name, last_name, email, phone, 
        total_stays, lifetime_value, created_at
      FROM guests
      ${whereClause}
      ORDER BY lifetime_value DESC, created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await query(`
      SELECT COUNT(*) FROM guests ${whereClause}
    `, params);

    res.json({
      guests: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// Get guest with full history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT * FROM guests WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const guest = result.rows[0];

    // Decrypt ID proof if exists
    if (guest.id_proof_encrypted) {
      guest.id_proof_decrypted = decrypt(guest.id_proof_encrypted.toString());
    }

    // Get booking history
    const bookingsResult = await query(`
      SELECT b.*, p.name as property_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.guest_id = $1
      ORDER BY b.check_in DESC
      LIMIT 10
    `, [id]);

    // Get messages
    const messagesResult = await query(`
      SELECT * FROM messages
      WHERE guest_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [id]);

    res.json({
      ...guest,
      bookings: bookingsResult.rows,
      messages: messagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({ error: 'Failed to fetch guest' });
  }
});

// Create/update guest
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone,
      id_proof_type, id_proof_number, id_proof_file,
      address, date_of_birth, nationality,
      preferences, notes
    } = req.body;

    // Check if guest exists by phone
    const existingGuest = await query(`
      SELECT id FROM guests WHERE phone = $1
    `, [phone]);

    let result;
    if (existingGuest.rows.length > 0) {
      // Update existing guest
      result = await query(`
        UPDATE guests SET
          first_name = $1, last_name = $2, email = $3,
          address = $4, date_of_birth = $5, nationality = $6,
          preferences = $7, notes = $8, updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `, [first_name, last_name, email, address, date_of_birth, nationality, preferences, notes, existingGuest.rows[0].id]);
      res.json({ ...result.rows[0], isNew: false });
    } else {
      // Create new guest
      // Encrypt ID proof
      let idProofEncrypted = null;
      if (id_proof_number) {
        idProofEncrypted = Buffer.from(encrypt(id_proof_number));
      }

      result = await query(`
        INSERT INTO guests (
          first_name, last_name, email, phone,
          id_proof_type, id_proof_number, id_proof_encrypted,
          address, date_of_birth, nationality,
          preferences, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        first_name, last_name, email, phone,
        id_proof_type, id_proof_number, idProofEncrypted,
        address, date_of_birth, nationality,
        preferences, notes
      ]);
      res.status(201).json({ ...result.rows[0], isNew: true });
    }
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// Update guest
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone,
      id_proof_type, id_proof_number,
      address, date_of_birth, nationality,
      preferences, notes
    } = req.body;

    // Encrypt ID proof if provided
    let idProofEncrypted = null;
    if (id_proof_number) {
      idProofEncrypted = Buffer.from(encrypt(id_proof_number));
    }

    const result = await query(`
      UPDATE guests SET
        first_name = $1, last_name = $2, email = $3, phone = $4,
        id_proof_type = $5, id_proof_number = $6, id_proof_encrypted = $7,
        address = $8, date_of_birth = $9, nationality = $10,
        preferences = $11, notes = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      first_name, last_name, email, phone,
      id_proof_type, id_proof_number, idProofEncrypted,
      address, date_of_birth, nationality,
      preferences, notes, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// Search guests (for quick booking)
router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const result = await query(`
      SELECT id, first_name, last_name, email, phone, total_stays, lifetime_value
      FROM guests
      WHERE LOWER(first_name) LIKE LOWER($1) 
        OR LOWER(last_name) LIKE LOWER($1) 
        OR phone LIKE $1
        OR LOWER(email) LIKE LOWER($1)
      ORDER BY lifetime_value DESC
      LIMIT 10
    `, [`%${q}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching guests:', error);
    res.status(500).json({ error: 'Failed to search guests' });
  }
});

// Get VIP guests
router.get('/vip/list', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, first_name, last_name, email, phone, 
        total_stays, lifetime_value
      FROM guests
      WHERE total_stays >= 3 OR lifetime_value >= 50000
      ORDER BY lifetime_value DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching VIP guests:', error);
    res.status(500).json({ error: 'Failed to fetch VIP guests' });
  }
});

// Get guest stats
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_guests,
        SUM(total_stays) as total_stays,
        SUM(lifetime_value) as total_revenue,
        AVG(lifetime_value) as avg_lifetime_value,
        COUNT(CASE WHEN total_stays >= 3 THEN 1 END) as repeat_guests
      FROM guests
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching guest stats:', error);
    res.status(500).json({ error: 'Failed to fetch guest stats' });
  }
});

module.exports = router;
