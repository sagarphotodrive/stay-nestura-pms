import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { format, safeFormat } from './format';

applyPlugin(jsPDF);

export const generateBookingBillPDF = (booking) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const nights = Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000));
  const gross = parseFloat(booking.gross_amount || booking.net_amount) || 0;
  const paid = parseFloat(booking.paid_amount) || 0;
  const due = parseFloat(booking.pending_amount != null ? booking.pending_amount : gross - paid) || 0;

  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 42, 74);
  doc.text('Stay Nestura', 14, 18);
  doc.setFontSize(13); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text('Booking Bill / Invoice', 14, 26);
  doc.setFontSize(10);
  doc.text(`Bill #${booking.id}`, pageW - 14, 14, { align: 'right' });
  doc.text(format(new Date(), 'dd MMM yyyy'), pageW - 14, 20, { align: 'right' });
  doc.setDrawColor(201, 169, 110); doc.setLineWidth(0.8); doc.line(14, 30, pageW - 14, 30);

  let y = 40;
  doc.setFontSize(10); doc.setTextColor(27, 42, 74); doc.setFont('helvetica', 'bold');
  doc.text('Guest', 14, y);
  doc.text('Property', pageW / 2 + 4, y);
  y += 6;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(60);
  doc.text(`${booking.first_name || ''} ${booking.last_name || ''}`.trim() || '-', 14, y);
  doc.text(booking.property_name || '-', pageW / 2 + 4, y);
  y += 6;
  if (booking.phone) { doc.text(booking.phone, 14, y); }
  if (booking.address) { doc.text(booking.address, pageW / 2 + 4, y, { maxWidth: pageW / 2 - 18 }); }
  y += 6;
  if (booking.email) { doc.text(booking.email, 14, y); }
  y += 10;

  doc.autoTable({
    startY: y,
    head: [['Check-in', 'Check-out', 'Nights', 'Guests', 'Channel', 'Status']],
    body: [[
      safeFormat(booking.check_in, 'MMM dd, yyyy'),
      safeFormat(booking.check_out, 'MMM dd, yyyy'),
      String(nights),
      String((booking.adults || 1) + (booking.children || 0)),
      booking.channel === 'direct' ? 'Offline' : (booking.channel || '-'),
      (booking.booking_status || '').replace(/-/g, ' ')
    ]],
    theme: 'grid', styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [27, 42, 74], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    margin: { left: 14, right: 14 }
  });
  y = doc.lastAutoTable.finalY + 10;

  const charges = [
    ['Accommodation', `INR ${(parseFloat(booking.nightly_rate) || 0).toLocaleString()} x ${nights} night${nights > 1 ? 's' : ''}`, `INR ${(parseFloat(booking.subtotal) || (parseFloat(booking.nightly_rate) || 0) * nights).toLocaleString()}`]
  ];
  if (parseFloat(booking.cleaning_fee) > 0) charges.push(['Cleaning Fee', '', `INR ${parseFloat(booking.cleaning_fee).toLocaleString()}`]);
  if (parseFloat(booking.service_fee) > 0) charges.push(['Service Fee', '', `INR ${parseFloat(booking.service_fee).toLocaleString()}`]);
  if (parseFloat(booking.taxes) > 0) charges.push(['Taxes', '', `INR ${parseFloat(booking.taxes).toLocaleString()}`]);

  doc.autoTable({
    startY: y,
    head: [['Charge', 'Details', 'Amount']],
    body: charges,
    theme: 'grid', styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [27, 42, 74], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: 14, right: 14 }
  });
  y = doc.lastAutoTable.finalY + 4;

  doc.autoTable({
    startY: y,
    body: [
      ['Total Amount', `INR ${gross.toLocaleString()}`],
      ['Paid', `INR ${paid.toLocaleString()}`],
      ['Balance Due', `INR ${due.toLocaleString()}`]
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2, font: 'helvetica', fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'right', cellWidth: pageW - 14 - 60 - 14 }, 1: { halign: 'right', cellWidth: 60 } },
    margin: { left: 14, right: 14 }
  });
  y = doc.lastAutoTable.finalY + 10;

  if (booking.payment_method) {
    doc.setFontSize(9); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${booking.payment_method}`, 14, y);
    y += 8;
  }

  doc.setFontSize(8); doc.setTextColor(120); doc.setFont('helvetica', 'italic');
  const idNotice = doc.splitTextToSize('Guest ID Policy: All guests\' ID proofs (address visible) must be sent to guestdetails@staynestura.com. Entry may be denied without them, irrespective of check-in time. Extra guests/services are chargeable and require valid address proof.', pageW - 28);
  doc.text(idNotice, 14, y);
  y += idNotice.length * 4 + 4;

  doc.setFontSize(7); doc.setTextColor(150); doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')} | Stay Nestura PMS`, 14, doc.internal.pageSize.getHeight() - 8);
  doc.save(`Stay-Nestura-Bill-${booking.id}-${(booking.first_name || 'Guest').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
};

export const generateReportPDF = (title, monthLabel, tables, summaryCards) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 42, 74);
  doc.text('Stay Nestura', 14, 18);
  doc.setFontSize(13); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
  doc.text(title, 14, 26);
  doc.setFontSize(10); doc.text(monthLabel, pageW - 14, 18, { align: 'right' });
  doc.setDrawColor(201, 169, 110); doc.setLineWidth(0.8); doc.line(14, 30, pageW - 14, 30);
  let y = 36;
  if (summaryCards && summaryCards.length > 0) {
    const colW = (pageW - 28) / Math.min(summaryCards.length, 4);
    summaryCards.forEach((card, i) => {
      const x = 14 + (i % 4) * colW;
      const row = Math.floor(i / 4);
      const cy = y + row * 20;
      doc.setFillColor(250, 248, 245); doc.roundedRect(x, cy, colW - 4, 16, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(100); doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + 3, cy + 6);
      doc.setFontSize(11); doc.setTextColor(27, 42, 74); doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 3, cy + 13);
    });
    y += Math.ceil(summaryCards.length / 4) * 20 + 4;
  }
  tables.forEach(tbl => {
    if (y > 260) { doc.addPage(); y = 20; }
    if (tbl.title) { doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 42, 74); doc.text(tbl.title, 14, y); y += 6; }
    doc.autoTable({ startY: y, head: [tbl.head], body: tbl.body, theme: 'grid', styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' }, headStyles: { fillColor: [27, 42, 74], textColor: 255, fontStyle: 'bold', fontSize: 8 }, alternateRowStyles: { fillColor: [250, 248, 245] }, margin: { left: 14, right: 14 } });
    y = doc.lastAutoTable.finalY + 10;
  });
  doc.setFontSize(7); doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')} | Stay Nestura PMS`, 14, doc.internal.pageSize.getHeight() - 8);
  doc.save(`Stay-Nestura-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${monthLabel.replace(/\s/g, '-')}.pdf`);
};
