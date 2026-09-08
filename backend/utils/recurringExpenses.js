// Pure date-math for the recurring-expense generator (backend/utils, no DB access) so it
// can be unit tested without a database. server.js does the actual reads/writes around it.

function addMonthsToPeriod(period, n) { // period: 'YYYY-MM'
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Given a recurring expense's day-of-month and the period it was last generated through,
// returns every expense_date that should now be created to catch up to (and including, if
// due) today's month, plus the period generation should be marked as caught up to.
// Walks forward one month at a time rather than jumping straight to the current month, so
// months missed while the job wasn't running (server down, feature just turned on, etc.)
// get backfilled instead of silently skipped.
function computeDueDates({ day, lastRunPeriod, todayStr }) {
  const currentPeriod = todayStr.substring(0, 7);
  const todayDay = Number(todayStr.substring(8, 10));
  let period = lastRunPeriod;
  const dates = [];

  while (true) {
    const nextPeriod = addMonthsToPeriod(period, 1);
    if (nextPeriod > currentPeriod) break;
    const isCurrentPeriod = nextPeriod === currentPeriod;
    const [py, pm] = nextPeriod.split('-').map(Number);
    const lastDayOfPeriod = new Date(py, pm, 0).getDate();
    const effectiveDay = Math.min(day, lastDayOfPeriod); // clamp e.g. day 31 into a 30-day month
    if (isCurrentPeriod && todayDay < effectiveDay) break; // this month not due yet

    dates.push(`${nextPeriod}-${String(effectiveDay).padStart(2, '0')}`);
    period = nextPeriod;
    if (isCurrentPeriod) break;
  }

  return { dates, newLastRunPeriod: dates.length ? period : lastRunPeriod };
}

module.exports = { addMonthsToPeriod, computeDueDates };
