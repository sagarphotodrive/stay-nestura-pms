// Pure date/availability logic (backend/utils, no DB access) shared between the admin
// booking flow and the public booking widget, so the overlap rule only lives in one place.

// bookings: already filtered to one property. Mirrors the overlap check used in
// POST /api/bookings: two ranges conflict when one starts before the other ends.
function hasBookingConflict(bookings, checkIn, checkOut) {
  return bookings.some(b => b.booking_status !== 'cancelled' && b.check_in < checkOut && b.check_out > checkIn);
}

// Turns a property's non-cancelled bookings + blocked Availability rows into public-safe
// unavailability info — booking date ranges only (no guest identity), plus individually
// blocked dates. Used by the public widget; never expose raw booking/guest records to it.
function getUnavailableRanges(bookings, blockedDates) {
  const bookedRanges = bookings
    .filter(b => b.booking_status !== 'cancelled')
    .map(b => ({ check_in: b.check_in, check_out: b.check_out }));

  const blocked = blockedDates
    .filter(a => a.is_blocked)
    .map(a => a.date);

  return { bookedRanges, blockedDates: blocked };
}

module.exports = { hasBookingConflict, getUnavailableRanges };
