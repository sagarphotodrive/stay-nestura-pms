// Minimal iCal (.ics) parser for OTA calendar imports (Booking.com, Airbnb, Agoda, ...).
// Those feeds only carry all-day blocks: DTSTART/DTEND dates, a UID and a SUMMARY such
// as "CLOSED - Not available" or "Reserved". Pure function, no network/DB — unit tested.

// "20261126" or "20261126T140000Z" (or with TZID param) -> "2026-11-26"
function icsDateToYmd(value) {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec((value || '').trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function addOneDay(ymd) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

// Returns [{ uid, start, end, summary }] where start is the first blocked night and end
// is exclusive (the checkout day) — the same convention as booking check_in/check_out.
function parseIcsEvents(text) {
  // Unfold continuation lines (RFC 5545: a line starting with space/tab continues the previous)
  const lines = String(text || '').replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur && cur.start && cur.status !== 'CANCELLED') {
        let end = cur.end && cur.end > cur.start ? cur.end : addOneDay(cur.start);
        events.push({ uid: cur.uid || `${cur.start}-${end}`, start: cur.start, end, summary: cur.summary || '' });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const name = line.slice(0, idx).split(';')[0].toUpperCase();
    const value = line.slice(idx + 1);
    if (name === 'DTSTART') cur.start = icsDateToYmd(value);
    else if (name === 'DTEND') cur.end = icsDateToYmd(value);
    else if (name === 'UID') cur.uid = value.trim();
    else if (name === 'SUMMARY') cur.summary = value.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/gi, ' ').trim();
    else if (name === 'STATUS') cur.status = value.trim().toUpperCase();
  }
  return events;
}

module.exports = { parseIcsEvents, icsDateToYmd };
