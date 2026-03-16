// Stay Nestura Properties Management System
// Expenses API Routes

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Expense categories
const EXPENSE_CATEGORIES = [
  'laundry', 'electricity', 'water', 'staff_salary', 
  'cleaning', 'maintenance', 'internet', 'supplies',
  'groceries', 'travel', 'marketing', 'other'
];

// Get all expenses with filters
router.get('/', async (req, res) => {
  try {
    const { property_id, category, start_date, end_date, page = 1, limit = 50 } = req.query;

    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (property_id) {
      conditions.push(`e.property_id = $${paramCount}`);
      params.push(property_id);
      paramCount++;
    }
    if (category) {
      conditions.push(`e.category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }
    if (start_date) {
      conditions.push(`e.expense_date >= $${paramCount}`);
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      conditions.push(`e.expense_date <= $${paramCount}`);
      params.push(end_date);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const result = await query(`
      SELECT e.*, p.name as property_name
      FROM expenses e
      LEFT JOIN properties p ON p.id = e.property_id
      ${whereClause}
      ORDER BY e.expense_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const countResult = await query(`
      SELECT COUNT(*) FROM expenses e ${whereClause}
    `, params);

    res.json({
      expenses: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get expense summary
router.get('/summary', async (req, res) => {
  try {
    const { property_id, start_date, end_date } = req.query;

    let dateFilter = '';
    let propertyFilter = '';
    let params = [];
    let paramCount = 1;

    if (start_date && end_date) {
      dateFilter = `AND e.expense_date >= $${paramCount} AND e.expense_date <= $${paramCount + 1}`;
      params = [start_date, end_date];
      paramCount += 2;
    } else {
      dateFilter = `AND e.expense_date >= date_trunc('month', CURRENT_DATE)`;
    }

    if (property_id) {
      propertyFilter = `AND e.property_id = $${paramCount}`;
      params.push(property_id);
    }

    // Get total by category
    const categoryResult = await query(`
      SELECT 
        e.category,
        SUM(e.amount) as total,
        COUNT(*) as count
      FROM expenses e
      WHERE 1=1 ${dateFilter} ${propertyFilter.replace('$1', `$${paramCount}`)}
      GROUP BY e.category
      ORDER BY total DESC
    `, params);

    // Get total overall
    const totalResult = await query(`
      SELECT SUM(amount) as total FROM expenses e
      WHERE 1=1 ${dateFilter} ${propertyFilter.replace('$1', `$${paramCount}`)}
    `, params);

    // Get by property
    const propertyResult = await query(`
      SELECT 
        p.name as property_name,
        e.property_id,
        SUM(e.amount) as total
      FROM expenses e
      JOIN properties p ON p.id = e.property_id
      WHERE 1=1 ${dateFilter}
      GROUP BY p.name, e.property_id
      ORDER BY total DESC
    `, start_date && end_date ? [start_date, end_date] : []);

    res.json({
      byCategory: categoryResult.rows,
      total: totalResult.rows[0]?.total || 0,
      byProperty: propertyResult.rows
    });
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    res.status(500).json({ error: 'Failed to fetch expense summary' });
  }
});

// Get expense categories
router.get('/categories', (req, res) => {
  res.json(EXPENSE_CATEGORIES);
});

// Create expense
router.post('/', async (req, res) => {
  try {
    const {
      property_id, category, subcategory, description,
      amount, payment_method, vendor_name, receipt_number,
      expense_date, is_recurring, recurring_frequency
    } = req.body;

    // Validate category
    if (!EXPENSE_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        validCategories: EXPENSE_CATEGORIES 
      });
    }

    const result = await query(`
      INSERT INTO expenses (
        property_id, category, subcategory, description,
        amount, payment_method, vendor_name, receipt_number,
        expense_date, is_recurring, recurring_frequency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      property_id, category, subcategory, description,
      amount, payment_method || 'cash', vendor_name, receipt_number,
      expense_date || new Date().toISOString().split('T')[0],
      is_recurring || false, recurring_frequency
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'property_id', 'category', 'subcategory', 'description',
      'amount', 'payment_method', 'vendor_name', 'receipt_number',
      'expense_date', 'is_recurring', 'recurring_frequency'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    values.push(id);

    const result = await query(`
      UPDATE expenses SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      DELETE FROM expenses WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Bulk create expenses
router.post('/bulk', async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ error: 'No expenses provided' });
    }

    const results = [];
    for (const exp of expenses) {
      const result = await query(`
        INSERT INTO expenses (
          property_id, category, subcategory, description,
          amount, payment_method, vendor_name, receipt_number,
          expense_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        exp.property_id, exp.category, exp.subcategory, exp.description,
        exp.amount, exp.payment_method || 'cash', exp.vendor_name, 
        exp.receipt_number, exp.expense_date || new Date().toISOString().split('T')[0]
      ]);
      results.push(result.rows[0]);
    }

    res.status(201).json({ created: results.length, expenses: results });
  } catch (error) {
    console.error('Error bulk creating expenses:', error);
    res.status(500).json({ error: 'Failed to bulk create expenses' });
  }
});

module.exports = router;
