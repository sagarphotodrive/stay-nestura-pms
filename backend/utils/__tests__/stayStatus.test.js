const { scheduledTimeIST, decideStayStatusUpdate } = require('../stayStatus');

const at = (iso) => Date.parse(iso); // helper: explicit-offset timestamps
const booking = (over = {}) => ({ booking_status: 'confirmed', check_in: '2026-11-20', check_out: '2026-11-22', check_in_time: '4:00 PM', check_out_time: '2:00 PM', ...over });

describe('scheduledTimeIST', () => {
  test('parses 12-hour times in India time', () => {
    expect(scheduledTimeIST('2026-11-20', '4:00 PM', 16)).toBe(at('2026-11-20T16:00:00+05:30'));
    expect(scheduledTimeIST('2026-11-20', '12:30 AM', 16)).toBe(at('2026-11-20T00:30:00+05:30'));
    expect(scheduledTimeIST('2026-11-20', '12:00 PM', 16)).toBe(at('2026-11-20T12:00:00+05:30'));
  });
  test('falls back to the default hour when time is missing', () => {
    expect(scheduledTimeIST('2026-11-20', undefined, 16)).toBe(at('2026-11-20T16:00:00+05:30'));
  });
});

describe('decideStayStatusUpdate', () => {
  test('no change before 24h after check-in time', () => {
    expect(decideStayStatusUpdate(booking(), at('2026-11-21T15:59:00+05:30'))).toBeNull();
  });

  test('checks in 24h after check-in time, using scheduled time as actual_check_in', () => {
    const u = decideStayStatusUpdate(booking(), at('2026-11-21T16:00:00+05:30'));
    expect(u.booking_status).toBe('checked-in');
    expect(u.actual_check_in).toBe(new Date(at('2026-11-20T16:00:00+05:30')).toISOString());
    expect(u.auto_checked_in_at).toBeDefined();
  });

  test('keeps an existing actual_check_in', () => {
    const u = decideStayStatusUpdate(booking({ actual_check_in: 'x' }), at('2026-11-21T17:00:00+05:30'));
    expect(u.actual_check_in).toBe('x');
  });

  test('checked-in booking stays checked-in until 24h after check-out time', () => {
    expect(decideStayStatusUpdate(booking({ booking_status: 'checked-in' }), at('2026-11-23T13:59:00+05:30'))).toBeNull();
  });

  test('checks out 24h after check-out time without touching check-in fields', () => {
    const u = decideStayStatusUpdate(booking({ booking_status: 'checked-in', actual_check_in: 'manual' }), at('2026-11-23T14:00:00+05:30'));
    expect(u.booking_status).toBe('checked-out');
    expect(u.auto_checked_in_at).toBeUndefined();
    expect(u.actual_check_in).toBeUndefined();
  });

  test('finished stay never checked in goes straight to checked-out with both times', () => {
    const u = decideStayStatusUpdate(booking(), at('2026-12-01T10:00:00+05:30'));
    expect(u.booking_status).toBe('checked-out');
    expect(u.auto_checked_in_at).toBeDefined();
    expect(u.actual_check_in).toBe(new Date(at('2026-11-20T16:00:00+05:30')).toISOString());
    expect(u.actual_check_out).toBe(new Date(at('2026-11-22T14:00:00+05:30')).toISOString());
  });

  test('one-night stay: checked in first, then checked out a day after check-out time', () => {
    const b = booking({ check_out: '2026-11-21' });
    expect(decideStayStatusUpdate(b, at('2026-11-21T16:00:00+05:30')).booking_status).toBe('checked-in');
    expect(decideStayStatusUpdate(b, at('2026-11-22T14:00:00+05:30')).booking_status).toBe('checked-out');
  });

  test('ignores cancelled, pending and already checked-out bookings', () => {
    const late = at('2027-01-01T00:00:00+05:30');
    for (const s of ['cancelled', 'pending', 'checked-out', 'checked_out']) {
      expect(decideStayStatusUpdate(booking({ booking_status: s }), late)).toBeNull();
    }
  });
});
