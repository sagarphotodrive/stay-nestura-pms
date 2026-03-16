// Stay Nestura Properties Management System
// Database Initialization Script

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'stay_nestura',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Initializing database...');

    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Create Properties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        property_type VARCHAR(50) NOT NULL,
        address TEXT,
        city VARCHAR(100) DEFAULT 'Solapur',
        state VARCHAR(100) DEFAULT 'Maharashtra',
        pincode VARCHAR(10),
        total_rooms INTEGER DEFAULT 1,
        max_guests INTEGER DEFAULT 2,
        base_price DECIMAL(10, 2) DEFAULT 0,
        description TEXT,
        amenities TEXT[],
        images TEXT[],
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        google_maps_link TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Properties table created');

    // Create Guests table (CRM)
    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(20) NOT NULL,
        id_proof_type VARCHAR(50),
        id_proof_number VARCHAR(100),
        id_proof_encrypted BYTEA,
        address TEXT,
        date_of_birth DATE,
        nationality VARCHAR(50),
        total_stays INTEGER DEFAULT 0,
        total_spent DECIMAL(12, 2) DEFAULT 0,
        lifetime_value DECIMAL(12, 2) DEFAULT 0,
        preferences TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Guests table created');

    // Create Bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
        channel VARCHAR(50) NOT NULL,
        channel_booking_id VARCHAR(100),
        external_booking_id VARCHAR(100),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        adults INTEGER DEFAULT 1,
        children INTEGER DEFAULT 0,
        infants INTEGER DEFAULT 0,
        total_guests INTEGER DEFAULT 1,
        room_count INTEGER DEFAULT 1,
        nightly_rate DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        cleaning_fee DECIMAL(10, 2) DEFAULT 0,
        service_fee DECIMAL(10, 2) DEFAULT 0,
        taxes DECIMAL(10, 2) DEFAULT 0,
        gross_amount DECIMAL(10, 2) NOT NULL,
        commission_percent DECIMAL(5, 2) DEFAULT 0,
        commission_amount DECIMAL(10, 2) DEFAULT 0,
        net_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        pending_amount DECIMAL(10, 2) DEFAULT 0,
        booking_status VARCHAR(20) DEFAULT 'confirmed',
        guest_message TEXT,
        special_requests TEXT,
        check_in_time TIME,
        check_out_time TIME,
        actual_check_in TIMESTAMP,
        actual_check_out TIMESTAMP,
        source VARCHAR(50) DEFAULT 'direct',
        confirmed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Bookings table created');

    // Create Expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
        category VARCHAR(50) NOT NULL,
        subcategory VARCHAR(50),
        description TEXT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        vendor_name VARCHAR(255),
        receipt_number VARCHAR(100),
        expense_date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT false,
        recurring_frequency VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id)
      )
    `);
    console.log('✓ Expenses table created');

    // Create Channel Accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS channel_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_name VARCHAR(50) NOT NULL,
        account_id VARCHAR(100),
        api_key_encrypted BYTEA,
        api_secret_encrypted BYTEA,
        webhook_secret VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        commission_percent DECIMAL(5, 2) DEFAULT 0,
        sync_enabled BOOLEAN DEFAULT true,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Channel Accounts table created');

    // Create Availability table for caching
    await client.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        rooms_available INTEGER DEFAULT 1,
        is_blocked BOOLEAN DEFAULT false,
        blocked_reason TEXT,
        min_stay INTEGER DEFAULT 1,
        max_stay INTEGER DEFAULT 30,
        closed_to_arrival BOOLEAN DEFAULT false,
        closed_to_departure BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(property_id, date)
      )
    `);
    console.log('✓ Availability table created');

    // Create Rate Plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        base_rate DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        min_guests INTEGER DEFAULT 1,
        max_guests INTEGER DEFAULT 2,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Rate Plans table created');

    // Create Messages table for guest communication
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
        message_type VARCHAR(50) NOT NULL,
        channel VARCHAR(20) DEFAULT 'whatsapp',
        message_content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        read_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Messages table created');

    // Create Sync Log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(50) NOT NULL,
        sync_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        records_processed INTEGER DEFAULT 0,
        errors TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    console.log('✓ Sync Logs table created');

    // Create Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_availability_property_date ON availability(property_id, date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`);
    console.log('✓ Indexes created');

    // Insert default properties
    const properties = [
      { name: 'Torna Homestay', type: 'Homestay', rooms: 2, max_guests: 6, price: 3500, desc: 'Luxury homestay with mountain views' },
      { name: 'Shivneri Homestay', type: 'Homestay', rooms: 2, max_guests: 4, price: 2500, desc: 'Premium homestay near Shivneri fort' },
      { name: 'Rajlakshmi Niwas', type: 'Homestay', rooms: 1, max_guests: 3, price: 1800, desc: 'Comfortable stay in city center' },
      { name: 'Solapur Homestay 1', type: 'Homestay', rooms: 1, max_guests: 2, price: 1200, desc: 'Budget-friendly option' },
      { name: 'Budget Room 1', type: 'Room', rooms: 1, max_guests: 2, price: 800, desc: 'Economy room with basic amenities' },
      { name: 'Budget Room Delux', type: 'Room', rooms: 1, max_guests: 2, price: 1100, desc: 'Deluxe room with extra comfort' }
    ];

    for (const prop of properties) {
      await client.query(`
        INSERT INTO properties (name, property_type, total_rooms, max_guests, base_price, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [prop.name, prop.type, prop.rooms, prop.max_guests, prop.price, prop.desc]);
    }
    console.log('✓ Default properties inserted');

    // Insert default channel accounts
    await client.query(`
      INSERT INTO channel_accounts (channel_name, commission_percent, is_active)
      VALUES ('airbnb', 3, true), ('booking.com', 15, true)
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Default channel accounts inserted');

    console.log('\n✅ Database initialization complete!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDatabase().catch(console.error);
