import { format } from 'date-fns';
import { isPhoneValid, toWhatsAppNumber } from './phone';

const generateBookingWhatsAppMsg = (b, prop) => {
  const ciDate = format(new Date(b.check_in), 'd MMMM');
  const coDate = format(new Date(b.check_out), 'd MMMM');
  const total = parseFloat(b.gross_amount || b.net_amount || 0);
  const advance = parseFloat(b.paid_amount || 0);
  const balance = total - advance;
  const guestCount = [];
  if (b.adults) guestCount.push(`${b.adults} Adult${b.adults > 1 ? 's' : ''}`);
  if (b.children) guestCount.push(`${b.children} Child${b.children > 1 ? 'ren' : ''}`);
  const checkInTime = b.check_in_time || '4:00 PM';
  const checkOutTime = b.check_out_time || '2:00 PM';
  let paymentLine = `Total ₹${total.toLocaleString('en-IN')}`;
  if (advance > 0 && balance > 0) {
    paymentLine += ` | Advance ₹${advance.toLocaleString('en-IN')}\nBalance ₹${balance.toLocaleString('en-IN')} (payable at check-in)`;
  } else if (advance >= total) {
    paymentLine += ` | Fully Paid ✓`;
  } else {
    paymentLine += ` (payable at check-in)`;
  }
  const locationLine = b.google_maps_link || (prop && prop.google_maps_link) || '';
  const rawPropName = b.property_name || (prop && prop.name) || 'Stay Nestura';
  const propName = rawPropName.replace(/\s*by\s+Stay\s+Nestura\s*$/i, '').trim() || 'Stay Nestura';
  let msg = `*Booking Confirmed – ${propName} by Stay Nestura*\n\n`;
  msg += `Guest: ${b.first_name} ${b.last_name || ''}\n`;
  msg += `Guests: ${guestCount.join(', ') || '1 Adult'}\n`;
  msg += `Booking ID: ${b.id}\n\n`;
  msg += `Check-in: ${ciDate} | ${checkInTime} onwards\n`;
  msg += `Check-out: ${coDate} | ${checkOutTime}\n\n`;
  msg += `Payment:\n${paymentLine}\n`;
  if (locationLine) msg += `\nLocation:\n${locationLine}\n`;
  msg += `\n*IMPORTANT – GUEST ID REQUIREMENT*\n`;
  msg += `Please send all guests' valid ID proofs, with the address clearly visible, to:\n*guestdetails@staynestura.com*\n`;
  msg += `Irrespective of your check-in time, we may deny entry if the required guest IDs are not received beforehand.\n`;
  msg += `\n*IMPORTANT – EXTRA GUESTS / SERVICES*\n`;
  msg += `Any extra guest, additional service, or other extra charge is chargeable and requires valid address proof.\n`;
  const isSolapurGroup = [3, 5, 6].includes(b.property_id);
  const contactNo = isSolapurGroup ? '9766504266' : '7499075244';
  const emergencyNo = isSolapurGroup ? '8308122281' : '9766504266';
  msg += `\nContact: ${contactNo}\nEmergency: ${emergencyNo}\n`;
  msg += `\n*House Rules:*\n`;
  msg += `• Kitchen utensils must be cleaned before check-out.\n  (₹250 charge if maid service required for utensils only. ₹500 for house cleaning if staying less than 3 days. For more than 3 days, every third day room service will be provided.)\n`;
  msg += `• Please use water & electricity wisely — Turn off taps and shower in time and don't let water just flow away as we receive corporation water supply once in 5 days!! Switch off all appliances and lights when they are not in use.\n`;
  msg += `• This is a homestay, not a hotel, so kindly take care of it and treat it as your own home.\n`;
  msg += `\nPlease ensure the required documents are submitted before arrival to avoid any inconvenience.\n`;
  msg += `\nThank you,\nTeam ${propName} by Stay Nestura`;
  return msg;
};

export const openWhatsApp = (b, prop) => {
  if (!isPhoneValid(b.phone)) {
    alert('Please enter a valid international phone number before sending the WhatsApp message.');
    return;
  }
  const msg = generateBookingWhatsAppMsg(b, prop);
  const fullPhone = toWhatsAppNumber(b.phone);
  window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
};

export const copyBookingMessage = (b, prop) => {
  const msg = generateBookingWhatsAppMsg(b, prop);
  navigator.clipboard.writeText(msg).then(() => alert('Booking message copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = msg; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); alert('Booking message copied!');
  });
};
