// Shared enums used by both the Mongoose schemas (backend/models) and the route
// handlers in server.js, so the two can't silently drift out of sync.
const EXPENSE_CATEGORIES = ['rent', 'laundry', 'electricity', 'water', 'staff_salary', 'cleaning', 'maintenance', 'internet', 'supplies', 'groceries', 'travel', 'marketing', 'other'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'partial', 'paid'];

module.exports = { EXPENSE_CATEGORIES, BOOKING_STATUSES, PAYMENT_STATUSES };
