const { addMonthsToPeriod, computeDueDates } = require('../recurringExpenses');

describe('addMonthsToPeriod', () => {
  test('advances within the same year', () => {
    expect(addMonthsToPeriod('2026-01', 1)).toBe('2026-02');
  });

  test('rolls over into the next year', () => {
    expect(addMonthsToPeriod('2026-12', 1)).toBe('2027-01');
  });
});

describe('computeDueDates', () => {
  test('generates nothing when this month is not yet due', () => {
    const { dates, newLastRunPeriod } = computeDueDates({ day: 20, lastRunPeriod: '2026-08', todayStr: '2026-09-08' });
    expect(dates).toEqual([]);
    expect(newLastRunPeriod).toBe('2026-08');
  });

  test('generates this month once the day has arrived', () => {
    const { dates, newLastRunPeriod } = computeDueDates({ day: 5, lastRunPeriod: '2026-08', todayStr: '2026-09-08' });
    expect(dates).toEqual(['2026-09-05']);
    expect(newLastRunPeriod).toBe('2026-09');
  });

  // This is the exact bug reported in production: a rent expense added in January with
  // no auto-generation running since then should backfill every skipped month, not just
  // pick up the current one.
  test('backfills every month missed since the last run, in order', () => {
    const { dates, newLastRunPeriod } = computeDueDates({ day: 5, lastRunPeriod: '2026-01', todayStr: '2026-08-30' });
    expect(dates).toEqual(['2026-02-05', '2026-03-05', '2026-04-05', '2026-05-05', '2026-06-05', '2026-07-05', '2026-08-05']);
    expect(newLastRunPeriod).toBe('2026-08');
  });

  test('is idempotent — running again with the updated lastRunPeriod produces nothing new', () => {
    const first = computeDueDates({ day: 5, lastRunPeriod: '2026-01', todayStr: '2026-08-30' });
    const second = computeDueDates({ day: 5, lastRunPeriod: first.newLastRunPeriod, todayStr: '2026-08-30' });
    expect(second.dates).toEqual([]);
  });

  test('clamps a day-of-month past the end of a shorter month (e.g. 31 in a 30-day month)', () => {
    const { dates } = computeDueDates({ day: 31, lastRunPeriod: '2026-03', todayStr: '2026-04-30' });
    expect(dates).toEqual(['2026-04-30']);
  });

  test('clamps for February in a non-leap year', () => {
    const { dates } = computeDueDates({ day: 31, lastRunPeriod: '2025-01', todayStr: '2025-02-28' });
    expect(dates).toEqual(['2025-02-28']);
  });
});
