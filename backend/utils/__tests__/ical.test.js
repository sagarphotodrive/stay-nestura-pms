const { parseIcsEvents } = require('../ical');

describe('parseIcsEvents', () => {
  test('parses a Booking.com style closed block', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//admin.booking.com//EN',
      'BEGIN:VEVENT', 'DTSTAMP:20261126T050000Z', 'DTSTART;VALUE=DATE:20261126', 'DTEND;VALUE=DATE:20261128',
      'UID:abc123@booking.com', 'SUMMARY:CLOSED - Not available', 'END:VEVENT',
      'END:VCALENDAR', ''
    ].join('\r\n');
    expect(parseIcsEvents(ics)).toEqual([{ uid: 'abc123@booking.com', start: '2026-11-26', end: '2026-11-28', summary: 'CLOSED - Not available' }]);
  });

  test('handles LF line endings, folded lines, datetimes and missing DTEND', () => {
    const ics = 'BEGIN:VEVENT\nDTSTART:20261201T140000Z\nUID:long-\n uid\nSUMMARY:Reserved\nEND:VEVENT\n';
    expect(parseIcsEvents(ics)).toEqual([{ uid: 'long-uid', start: '2026-12-01', end: '2026-12-02', summary: 'Reserved' }]);
  });

  test('skips cancelled events and junk input', () => {
    expect(parseIcsEvents('BEGIN:VEVENT\nDTSTART;VALUE=DATE:20261201\nSTATUS:CANCELLED\nEND:VEVENT')).toEqual([]);
    expect(parseIcsEvents('<html>not a calendar</html>')).toEqual([]);
    expect(parseIcsEvents(undefined)).toEqual([]);
  });
});
