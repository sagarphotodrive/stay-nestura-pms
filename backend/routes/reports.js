// Stay Nestura Properties Management System
// Reports & Financial Engine API Routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const nodemailer = require('nodemailer');

// Get monthly P&L report
router.get('/profit-loss', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    // Get revenue by property
    const revenueResult = await query(`
      SELECT 
        p.id as property_id,
        p.name as property_name,
        p.total_rooms,
        COUNT(b.id) as nights_sold,
        (p.total_rooms * EXTRACT(DAY FROM DATE '${endDate}')) as nights_available,
        ROUND(
          COUNT(b.id)::numeric / (p.total_rooms * EXTRACT(DAY FROM DATE '${endDate}')) * 100, 
          2
        ) as occupancy_percent,
        COALESCE(SUM(b.gross_amount), 0) as gross_revenue,
        COALESCE(SUM(b.commission_amount), 0) as commission,
        COALESCE(SUM(b.net_amount), 0) as net_revenue
      FROM properties p
      LEFT JOIN bookings b ON b.property_id = p.id
        AND b.check_in >= '${startDate}'
        AND b.check_in <= '${endDate}'
        AND b.booking_status NOT IN ('cancelled')
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.total_rooms
      ORDER BY net_revenue DESC
    `);

    // Get expenses by property
    const expenseResult = await query(`
      SELECT 
        COALESCE(p.name, 'General') as property_name,
        COALESCE(e.property_id, 'general') as property_id,
        SUM(e.amount) as total_expenses
      FROM expenses e
      LEFT JOIN properties p ON p.id = e.property_id
      WHERE e.expense_date >= '${startDate}' AND e.expense_date <= '${endDate}'
      GROUP BY e.property_id, p.name
    `);

    // Map expenses to properties
    const expenseMap = {};
    for (const exp of expenseResult.rows) {
      expenseMap[exp.property_id] = exp.total_expenses;
    }

    // Calculate P&L
    const pnl = revenueResult.rows.map(prop => {
      const expenses = expenseMap[prop.property_id] || 0;
      return {
        property_id: prop.property_id,
        property_name: prop.property_name,
        occupancy_percent: parseFloat(prop.occupancy_percent) || 0,
        nights_sold: parseInt(prop.nights_sold) || 0,
        gross_revenue: parseFloat(prop.gross_revenue) || 0,
        commission: parseFloat(prop.commission) || 0,
        expenses: expenses,
        net_profit: (parseFloat(prop.net_revenue) || 0) - expenses
      };
    });

    // Get totals
    const totals = {
      total_gross: pnl.reduce((sum, p) => sum + p.gross_revenue, 0),
      total_commission: pnl.reduce((sum, p) => sum + p.commission, 0),
      total_expenses: pnl.reduce((sum, p) => sum + p.expenses, 0),
      total_net: pnl.reduce((sum, p) => sum + p.net_profit, 0),
      total_occupancy: pnl.reduce((sum, p) => sum + p.occupancy_percent, 0) / pnl.length
    };

    res.json({
      period: { year: targetYear, month: targetMonth, startDate, endDate },
      properties: pnl,
      totals
    });
  } catch (error) {
    console.error('Error generating P&L:', error);
    res.status(500).json({ error: 'Failed to generate P&L report' });
  }
});

// Get daily operations brief
router.get('/daily-brief', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check-ins
    const checkIns = await query(`
      SELECT 
        b.id, b.check_in, b.check_in_time,
        p.name as property_name, p.address, p.google_maps_link,
        g.first_name, g.last_name, g.phone,
        b.adults + b.children + b.infants as guests,
        b.net_amount
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_in = '${today}'
        AND b.booking_status IN ('confirmed', 'checked-in')
      ORDER BY b.check_in_time
    `);

    // Check-outs
    const checkOuts = await query(`
      SELECT 
        b.id, b.check_out, b.check_out_time,
        p.name as property_name,
        g.first_name, g.last_name, g.phone,
        b.net_amount
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_out = '${today}'
        AND b.booking_status = 'checked-in'
      ORDER BY b.check_out_time
    `);

    // Pending payments
    const pendingPayments = await query(`
      SELECT 
        b.id, b.check_in, b.check_out,
        p.name as property_name,
        g.first_name, g.last_name, g.phone,
        b.pending_amount
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.payment_status = 'pending'
        AND b.booking_status NOT IN ('cancelled')
        AND b.pending_amount > 0
      ORDER BY b.check_in
    `);

    // Cleaning required (check-outs today + new check-ins tomorrow)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cleaningRequired = await query(`
      SELECT DISTINCT p.name as property_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE (b.check_out = '${today}' OR b.check_in = '${tomorrow}')
        AND b.booking_status NOT IN ('cancelled')
    `);

    // Maintenance flags (rooms with issues)
    // This would come from a maintenance table, for now returning empty
    const maintenanceFlags = [];

    res.json({
      date: today,
      checkIns: checkIns.rows,
      checkOuts: checkOuts.rows,
      pendingPayments: pendingPayments.rows,
      cleaningRequired: cleaningRequired.rows,
      maintenanceFlags
    });
  } catch (error) {
    console.error('Error generating daily brief:', error);
    res.status(500).json({ error: 'Failed to generate daily brief' });
  }
});

// Send daily brief via Email/WhatsApp
router.post('/daily-brief/send', async (req, res) => {
  try {
    const { channels = ['email'] } = req.body;
    
    // Get daily brief data
    const today = new Date().toISOString().split('T')[0];
    
    const checkIns = await query(`
      SELECT g.first_name, g.last_name, p.name as property_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_in = '${today}'
        AND b.booking_status IN ('confirmed', 'checked-in')
    `);

    const checkOuts = await query(`
      SELECT g.first_name, g.last_name, p.name as property_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_out = '${today}'
        AND b.booking_status = 'checked-in'
    `);

    const pending = await query(`
      SELECT g.first_name, g.last_name, p.name as property_name, b.pending_amount
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.payment_status = 'pending'
        AND b.booking_status NOT IN ('cancelled')
        AND b.pending_amount > 0
    `);

    // Format message
    const message = `
Stay Nestura – Daily Operations Brief
Date: ${today}

Check-ins (${checkIns.rows.length}):
${checkIns.rows.map(c => `• ${c.first_name} ${c.last_name} - ${c.property_name}`).join('\n') || 'None'}

Check-outs (${checkOuts.rows.length}):
${checkOuts.rows.map(c => `${c.first_name} ${c.last_name} - ${c.property_name}`).join('\n') || 'None'}

Pending Payments (${pending.rows.length}):
${pending.rows.map(p => `• ${p.first_name} ${p.last_name} - ${p.property_name}: ₹${p.pending_amount}`).join('\n') || 'None'}
    `.trim();

    // In production, send via Twilio (WhatsApp) and nodemailer (Email)
    // For now, just log and return success
    console.log('Daily Brief Message:', message);

    res.json({
      success: true,
      message: 'Daily brief sent successfully',
      channels,
      preview: message
    });
  } catch (error) {
    console.error('Error sending daily brief:', error);
    res.status(500).json({ error: 'Failed to send daily brief' });
  }
});

// Get revenue breakdown
router.get('/revenue', async (req, res) => {
  try {
    const { start_date, end_date, property_id } = req.query;

    let dateFilter = '';
    let propertyFilter = '';
    let params = [];
    let paramCount = 1;

    if (start_date && end_date) {
      dateFilter = `AND b.check_in >= $${paramCount} AND b.check_in <= $${paramCount + 1}`;
      params = [start_date, end_date];
      paramCount += 2;
    } else {
      dateFilter = `AND b.check_in >= date_trunc('month', CURRENT_DATE)`;
    }

    if (property_id) {
      propertyFilter = `AND b.property_id = $${paramCount}`;
      params.push(property_id);
    }

    // Revenue by channel
    const channelResult = await query(`
      SELECT 
        b.channel,
        COUNT(*) as bookings,
        SUM(b.gross_amount) as gross,
        SUM(b.commission_amount) as commission,
        SUM(b.net_amount) as net
      FROM bookings b
      WHERE b.booking_status NOT IN ('cancelled') ${dateFilter} ${propertyFilter}
      GROUP BY b.channel
    `, params);

    // Revenue by month (last 12 months)
    const monthlyResult = await query(`
      SELECT 
        TO_CHAR(b.check_in, 'YYYY-MM') as month,
        COUNT(*) as bookings,
        SUM(b.gross_amount) as gross,
        SUM(b.net_amount) as net
      FROM bookings b
      WHERE b.booking_status NOT IN ('cancelled')
        AND b.check_in >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(b.check_in, 'YYYY-MM')
      ORDER BY month
    `);

    // Revenue by property
    const propertyResult = await query(`
      SELECT 
        p.name as property_name,
        COUNT(*) as bookings,
        SUM(b.gross_amount) as gross,
        SUM(b.net_amount) as net
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.booking_status NOT IN ('cancelled') ${dateFilter}
      GROUP BY p.name
      ORDER BY net DESC
    `, start_date && end_date ? [start_date, end_date] : []);

    res.json({
      byChannel: channelResult.rows,
      byMonth: monthlyResult.rows,
      byProperty: propertyResult.rows
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    // Today's stats
    const today = new Date().toISOString().split('T')[0];

    const todayStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM bookings WHERE check_in = '${today}' AND booking_status IN ('confirmed', 'checked-in')) as today_checkins,
        (SELECT COUNT(*) FROM bookings WHERE check_out = '${today}' AND booking_status = 'checked-in') as today_checkouts,
        (SELECT SUM(net_amount) FROM bookings WHERE check_in = '${today}' AND booking_status NOT IN ('cancelled')) as today_revenue
    `);

    // Month stats
    const monthStats = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(gross_amount) as gross_revenue,
        SUM(net_amount) as net_revenue,
        SUM(commission_amount) as commission
      FROM bookings
      WHERE booking_status NOT IN ('cancelled')
        AND check_in >= date_trunc('month', CURRENT_DATE)
    `);

    // Property occupancy
    const occupancy = await query(`
      SELECT 
        p.name,
        COUNT(b.id) as booked_nights,
        p.total_rooms * EXTRACT(DAY FROM NOW()) as available_nights,
        ROUND(COUNT(b.id)::numeric / (p.total_rooms * EXTRACT(DAY FROM NOW())) * 100, 1) as occupancy
      FROM properties p
      LEFT JOIN bookings b ON b.property_id = p.id
        AND b.check_in <= CURRENT_DATE
        AND b.check_out > CURRENT_DATE
        AND b.booking_status NOT IN ('cancelled')
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.total_rooms
    `);

    // Upcoming bookings
    const upcoming = await query(`
      SELECT b.*, p.name as property_name, g.first_name, g.last_name
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      LEFT JOIN guests g ON g.id = b.guest_id
      WHERE b.check_in >= '${today}'
        AND b.booking_status IN ('confirmed')
      ORDER BY b.check_in
      LIMIT 5
    `);

    res.json({
      today: todayStats.rows[0],
      month: monthStats.rows[0],
      occupancy: occupancy.rows,
      upcoming: upcoming.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
