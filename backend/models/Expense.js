const mongoose = require('mongoose');
const { EXPENSE_CATEGORIES } = require('../config/constants');

const expenseSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  property_id: { type: Number, required: true, index: true },
  category: { type: String, required: true, enum: EXPENSE_CATEGORIES },
  subcategory: String,
  description: String,
  amount: { type: Number, default: 0, min: 0 },
  payment_method: { type: String, default: 'cash' },
  vendor_name: String,
  receipt_number: String,
  expense_date: { type: String, required: true },
  is_recurring: { type: Boolean, default: false },
  recurring_frequency: String,
  recurring_day: { type: Number, min: 1, max: 31 },
  recurring_last_run: String,
  created_by: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Expense', expenseSchema);
