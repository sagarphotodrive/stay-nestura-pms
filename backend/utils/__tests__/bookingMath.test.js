const { toPaise, validateBookingAmounts } = require('../bookingMath');

describe('toPaise', () => {
  test('converts rupees to integer paise', () => {
    expect(toPaise(100)).toBe(10000);
    expect(toPaise('99.99')).toBe(9999);
  });

  test('treats missing/invalid input as zero', () => {
    expect(toPaise(undefined)).toBe(0);
    expect(toPaise(null)).toBe(0);
    expect(toPaise('abc')).toBe(0);
  });

  test('avoids float drift on typical 2-decimal rupee amounts', () => {
    // 19.9 * 100 comes out as 1989.9999999999998 with naive multiplication/no rounding
    expect(toPaise(19.9)).toBe(1990);
    expect(toPaise(0.1)).toBe(10);
  });
});

describe('validateBookingAmounts', () => {
  const base = {
    check_in: '2026-01-01',
    check_out: '2026-01-04', // 3 nights
    nightly_rate: 1000,
    gross_amount: 3000,
    cleaning_fee: 0,
    service_fee: 0,
    taxes: 0,
  };

  test('accepts a booking where per-day x nights equals the final amount', () => {
    expect(validateBookingAmounts(base)).toBeNull();
  });

  test('accounts for cleaning/service/tax add-ons', () => {
    expect(validateBookingAmounts({ ...base, gross_amount: 3300, cleaning_fee: 200, service_fee: 50, taxes: 50 })).toBeNull();
  });

  test('rejects a mismatched total', () => {
    const err = validateBookingAmounts({ ...base, gross_amount: 3500 });
    expect(err).toMatchObject({ error: 'AMOUNT_MISMATCH', expected: 3000, provided: 3500 });
  });

  test('rejects when check-out is not after check-in', () => {
    const err = validateBookingAmounts({ ...base, check_out: base.check_in });
    expect(err).toMatchObject({ error: 'INVALID_NIGHTS' });
  });

  test('rejects a zero or missing per-day rate', () => {
    expect(validateBookingAmounts({ ...base, nightly_rate: 0 })).toMatchObject({ error: 'INVALID_AMOUNT' });
    expect(validateBookingAmounts({ ...base, nightly_rate: null })).toMatchObject({ error: 'INVALID_AMOUNT' });
  });

  test('rejects a zero or missing final amount', () => {
    expect(validateBookingAmounts({ ...base, gross_amount: 0 })).toMatchObject({ error: 'INVALID_AMOUNT' });
    expect(validateBookingAmounts({ ...base, gross_amount: null })).toMatchObject({ error: 'INVALID_AMOUNT' });
  });

  test('is immune to the floating-point cases that first motivated the paise conversion', () => {
    // 3 nights at 33.33 should total 99.99, not 99.99000000000001
    expect(validateBookingAmounts({ ...base, nightly_rate: 33.33, gross_amount: 99.99 })).toBeNull();
  });
});
