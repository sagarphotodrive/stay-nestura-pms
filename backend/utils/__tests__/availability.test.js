const { hasBookingConflict, getUnavailableRanges } = require('../availability');

describe('hasBookingConflict', () => {
  const existing = [{ check_in: '2026-01-10', check_out: '2026-01-15', booking_status: 'confirmed' }];

  test('detects an overlapping range', () => {
    expect(hasBookingConflict(existing, '2026-01-12', '2026-01-18')).toBe(true);
  });

  test('detects a range that fully contains an existing booking', () => {
    expect(hasBookingConflict(existing, '2026-01-05', '2026-01-20')).toBe(true);
  });

  test('allows a back-to-back range (checkout day == next checkin day)', () => {
    expect(hasBookingConflict(existing, '2026-01-15', '2026-01-20')).toBe(false);
    expect(hasBookingConflict(existing, '2026-01-05', '2026-01-10')).toBe(false);
  });

  test('allows a non-overlapping range entirely before or after', () => {
    expect(hasBookingConflict(existing, '2026-01-01', '2026-01-05')).toBe(false);
    expect(hasBookingConflict(existing, '2026-01-20', '2026-01-25')).toBe(false);
  });

  test('ignores cancelled bookings', () => {
    const cancelled = [{ check_in: '2026-01-10', check_out: '2026-01-15', booking_status: 'cancelled' }];
    expect(hasBookingConflict(cancelled, '2026-01-12', '2026-01-14')).toBe(false);
  });

  test('a pending booking still blocks the range (dates held pending staff review)', () => {
    const pending = [{ check_in: '2026-01-10', check_out: '2026-01-15', booking_status: 'pending' }];
    expect(hasBookingConflict(pending, '2026-01-12', '2026-01-14')).toBe(true);
  });
});

describe('getUnavailableRanges', () => {
  test('excludes cancelled bookings and only returns date fields', () => {
    const bookings = [
      { id: 1, check_in: '2026-02-01', check_out: '2026-02-03', booking_status: 'confirmed', guest_id: 42, guest_message: 'secret' },
      { id: 2, check_in: '2026-02-10', check_out: '2026-02-12', booking_status: 'cancelled' },
      { id: 3, check_in: '2026-02-20', check_out: '2026-02-22', booking_status: 'pending' },
    ];
    const result = getUnavailableRanges(bookings, []);
    expect(result.bookedRanges).toEqual([
      { check_in: '2026-02-01', check_out: '2026-02-03' },
      { check_in: '2026-02-20', check_out: '2026-02-22' },
    ]);
    // no leaked guest/internal fields
    expect(result.bookedRanges.every(r => Object.keys(r).length === 2)).toBe(true);
  });

  test('returns only dates flagged is_blocked', () => {
    const blockedDates = [
      { date: '2026-03-01', is_blocked: true },
      { date: '2026-03-02', is_blocked: false },
      { date: '2026-03-03', is_blocked: true },
    ];
    const result = getUnavailableRanges([], blockedDates);
    expect(result.blockedDates).toEqual(['2026-03-01', '2026-03-03']);
  });
});
