// Currency-safe money helpers (paise-based to avoid float drift) + booking amount validation.
// Rule enforced everywhere (frontend, backend, invoice): perDayAmount x numberOfDays == finalAmount.
const toPaise = (v) => Math.round((parseFloat(v) || 0) * 100);

function validateBookingAmounts({ check_in, check_out, nightly_rate, gross_amount, cleaning_fee, service_fee, taxes }) {
  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000);
  if (!(nights > 0)) return { error: 'INVALID_NIGHTS', message: 'Number of days must be greater than zero.' };
  const perDay = parseFloat(nightly_rate);
  const final = parseFloat(gross_amount);
  if (nightly_rate == null || isNaN(perDay) || perDay <= 0) return { error: 'INVALID_AMOUNT', message: 'Per-day amount must be greater than zero.' };
  if (gross_amount == null || isNaN(final) || final <= 0) return { error: 'INVALID_AMOUNT', message: 'Final amount must be greater than zero.' };
  const extrasPaise = toPaise(cleaning_fee) + toPaise(service_fee) + toPaise(taxes);
  const expectedPaise = toPaise(perDay) * nights + extrasPaise;
  const finalPaise = toPaise(final);
  if (expectedPaise !== finalPaise) {
    return {
      error: 'AMOUNT_MISMATCH',
      message: 'Per-day amount multiplied by number of days does not match the final amount.',
      expected: expectedPaise / 100,
      provided: finalPaise / 100
    };
  }
  return null;
}

module.exports = { toPaise, validateBookingAmounts };
