const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  id: { type: Number, unique: true, index: true },
  property_id: { type: Number, index: true },
  category: String,
  subcategory: String,
  description: String,
  amount: { type: Number, default: 0 },
  payment_method: { type: String, default: 'cash' },
  vendor_name: String,
  receipt_number: String,
  expense_date: String,
  is_recurring: { type: Boolean, default: false },
  recurring_frequency: String,
  created_by: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Expense', expenseSchema);
