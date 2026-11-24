// Automatic check-in / check-out when staff don't update a booking's status.
// 24 hours after the scheduled check-in time (check_in date + check_in_time, IST) a
// still-"confirmed" booking becomes checked-in; 24 hours after the scheduled check-out
// time a confirmed or checked-in booking becomes checked-out (a finished stay that was
// never checked in goes straight to checked-out). actual_check_in/out are filled with
// the scheduled times when not already set.

const AUTO_STATUS_GRACE_MS = 24 * 3600 * 1000;

// "4:00 PM" on "2026-11-24" in India time → epoch ms. Falls back to fallbackHour:00.
const scheduledTimeIST = (date, timeStr, fallbackHour) => {
  if (!date) return NaN;
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(timeStr || '');
  let h = m ? parseInt(m[1], 10) : fallbackHour;
  const min = m ? m[2] : '00';
  if (m && /PM/i.test(m[3] || '') && h < 12) h += 12;
  if (m && /AM/i.test(m[3] || '') && h === 12) h = 0;
  return Date.parse(`${date}T${String(h).padStart(2, '0')}:${min}:00+05:30`);
};

// Returns the fields to $set on the booking, or null if nothing should change.
const decideStayStatusUpdate = (b, nowMs) => {
  if (b.booking_status !== 'confirmed' && b.booking_status !== 'checked-in') return null;
  const nowIso = new Date(nowMs).toISOString();
  const ciAt = scheduledTimeIST(b.check_in, b.check_in_time, 16);
  const coAt = scheduledTimeIST(b.check_out, b.check_out_time, 14);
  if (!isNaN(coAt) && nowMs >= coAt + AUTO_STATUS_GRACE_MS) {
    const update = { booking_status: 'checked-out', auto_checked_out_at: nowIso, actual_check_out: b.actual_check_out || new Date(coAt).toISOString() };
    if (b.booking_status === 'confirmed') {
      update.auto_checked_in_at = nowIso;
      update.actual_check_in = b.actual_check_in || (isNaN(ciAt) ? nowIso : new Date(ciAt).toISOString());
    }
    return update;
  }
  if (b.booking_status === 'confirmed' && !isNaN(ciAt) && nowMs >= ciAt + AUTO_STATUS_GRACE_MS) {
    return { booking_status: 'checked-in', auto_checked_in_at: nowIso, actual_check_in: b.actual_check_in || new Date(ciAt).toISOString() };
  }
  return null;
};

module.exports = { AUTO_STATUS_GRACE_MS, scheduledTimeIST, decideStayStatusUpdate };
