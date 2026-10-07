import { jsPDF } from 'jspdf';
import { PaymentReceipt } from '../types';

/**
 * Generates an official, publication-quality A4 PDF receipt for a verified reconciliation entry.
 */
export function generateReceiptPdf(receipt: PaymentReceipt): { doc: jsPDF; blob: Blob; dataUrl: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Brand Banner
  doc.setFillColor(120, 53, 15); // amber-900
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 6, pageWidth, 1.5, 'F');

  // 2. Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(28, 25, 23); // stone-900
  doc.text('ESTATEFLOW', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108); // stone-500
  doc.text('ENTERPRISE PROPERTY & RECONCILIATION PLATFORM', margin, 25);
  doc.text('Oak Residence Property Management LLC · Austin, TX', margin, 29);

  // Status Badge (Top Right)
  const badgeX = pageWidth - margin - 52;
  const badgeY = 14;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.roundedRect(badgeX, badgeY, 52, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('VERIFIED & RECONCILED', badgeX + 4, badgeY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(87, 83, 78);
  doc.text(`Receipt #: ${receipt.receiptNumber}`, badgeX + 4, badgeY + 12);

  // Divider Line
  doc.setDrawColor(231, 229, 228); // stone-200
  doc.setLineWidth(0.4);
  doc.line(margin, 35, pageWidth - margin, 35);

  // 3. Receipt Title & Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(28, 25, 23);
  doc.text('RENT PAYMENT RECEIPT', margin, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108);
  doc.text('Official tax and accounting confirmation of tenant rent settlement.', margin, 48);

  // 4. Two-Column Metadata Card (Tenant Info vs Transaction Details)
  const metaBoxY = 53;
  const boxHeight = 44;
  const colWidth = (contentWidth - 6) / 2;

  // Left Box: Tenant & Premises
  doc.setFillColor(250, 250, 249); // stone-50
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(margin, metaBoxY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15); // amber-900
  doc.text('TENANT & LEASED PREMISES', margin + 4, metaBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);

  let currentY = metaBoxY + 14;
  doc.text('Tenant Name:', margin + 4, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.tenantName, margin + 28, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(87, 83, 78);
  doc.text('Unit / Space:', margin + 4, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.unit, margin + 28, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(87, 83, 78);
  doc.text('Property:', margin + 4, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.propertyName, margin + 28, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(87, 83, 78);
  doc.text('Address:', margin + 4, currentY);
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.propertyAddress, margin + 28, currentY);

  // Right Box: Reconciliation & Gateway Info
  const rightBoxX = margin + colWidth + 6;
  doc.setFillColor(250, 250, 249);
  doc.setDrawColor(231, 229, 228);
  doc.roundedRect(rightBoxX, metaBoxY, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text('RECONCILIATION & AUDIT TRAIL', rightBoxX + 4, metaBoxY + 7);

  currentY = metaBoxY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text('Payment Date:', rightBoxX + 4, currentY);
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.issuedAt, rightBoxX + 32, currentY);

  currentY += 6;
  doc.setTextColor(87, 83, 78);
  doc.text('Verified Date:', rightBoxX + 4, currentY);
  doc.setTextColor(28, 25, 23);
  doc.text(receipt.verifiedAt, rightBoxX + 32, currentY);

  currentY += 6;
  doc.setTextColor(87, 83, 78);
  doc.text('Verified By:', rightBoxX + 4, currentY);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.verifiedBy, rightBoxX + 32, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(87, 83, 78);
  doc.text('Payment Gateway:', rightBoxX + 4, currentY);
  doc.setTextColor(28, 25, 23);
  doc.text(`${receipt.paymentMethod} (${receipt.maskedMethod})`, rightBoxX + 32, currentY);

  // 5. Itemized Table of Charges
  const tableY = 104;
  doc.setFillColor(245, 245, 244); // stone-100
  doc.rect(margin, tableY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text('DESCRIPTION', margin + 4, tableY + 5);
  doc.text('CATEGORY', margin + 80, tableY + 5);
  doc.text('CURRENCY', margin + 115, tableY + 5);
  doc.text('AMOUNT', pageWidth - margin - 4, tableY + 5, { align: 'right' });

  // Rows
  let rowY = tableY + 13;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(28, 25, 23);

  // Item 1: Base Rent
  doc.text(`Monthly Rent — ${receipt.unit} (${receipt.propertyName})`, margin + 4, rowY);
  doc.setTextColor(120, 113, 108);
  doc.text('Base Rent', margin + 80, rowY);
  doc.text(receipt.currency, margin + 115, rowY);
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMoney(receipt.breakdown.rent, receipt.currency), pageWidth - margin - 4, rowY, { align: 'right' });

  // Divider
  doc.setDrawColor(245, 245, 244);
  doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);

  // Item 2: Parking (if any)
  if (receipt.breakdown.parking && receipt.breakdown.parking > 0) {
    rowY += 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    doc.text('Assigned Parking Stall P2 Fee', margin + 4, rowY);
    doc.setTextColor(120, 113, 108);
    doc.text('Ancillary', margin + 80, rowY);
    doc.text(receipt.currency, margin + 115, rowY);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(receipt.breakdown.parking, receipt.currency), pageWidth - margin - 4, rowY, { align: 'right' });

    doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);
  }

  // Item 3: Utilities / Other (if any)
  if (receipt.breakdown.utility && receipt.breakdown.utility > 0) {
    rowY += 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    doc.text('Water & Refuse Municipal Surcharge', margin + 4, rowY);
    doc.setTextColor(120, 113, 108);
    doc.text('Utilities', margin + 80, rowY);
    doc.text(receipt.currency, margin + 115, rowY);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(receipt.breakdown.utility, receipt.currency), pageWidth - margin - 4, rowY, { align: 'right' });

    doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);
  }

  // Item 4: Processing Fee (if any)
  if (receipt.breakdown.processingFee && receipt.breakdown.processingFee > 0) {
    rowY += 9;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(28, 25, 23);
    doc.text('Gateway Merchant Network Fee', margin + 4, rowY);
    doc.setTextColor(120, 113, 108);
    doc.text('Processing', margin + 80, rowY);
    doc.text(receipt.currency, margin + 115, rowY);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(receipt.breakdown.processingFee, receipt.currency), pageWidth - margin - 4, rowY, { align: 'right' });

    doc.line(margin, rowY + 3, pageWidth - margin, rowY + 3);
  }

  // Total Summary Box
  const summaryBoxY = rowY + 8;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(pageWidth - margin - 85, summaryBoxY, 85, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  doc.text('TOTAL RECONCILED & PAID', pageWidth - margin - 80, summaryBoxY + 6.5);

  doc.setFontSize(13);
  doc.setTextColor(120, 53, 15);
  doc.text(
    `${formatMoney(receipt.amountPaid, receipt.currency)}`,
    pageWidth - margin - 5,
    summaryBoxY + 11.5,
    { align: 'right' }
  );

  // 6. Multi-Currency Settlement Details (if not USD)
  let nextSectionY = summaryBoxY + 23;
  if (receipt.currency !== 'USD') {
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(20, 184, 166);
    doc.roundedRect(margin, nextSectionY, contentWidth, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(13, 148, 136);
    doc.text('MULTI-CURRENCY GATEWAY SETTLEMENT RECONCILIATION', margin + 4, nextSectionY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    const rateText = receipt.exchangeRateUsed
      ? `Locked Exchange Rate: 1 USD = ${receipt.exchangeRateUsed.toLocaleString()} ${receipt.currency}`
      : 'Auto-locked exchange rate at invoice settlement';
    doc.text(
      `${rateText} · Base Tenant Rent: $${receipt.baseAmountUSD.toFixed(2)} USD · Gateway Ref: ${receipt.gatewayRef}`,
      margin + 4,
      nextSectionY + 10
    );

    nextSectionY += 19;
  }

  // 7. Cryptographic Reconciliation Proof & Digital Signature Box
  doc.setFillColor(245, 245, 244);
  doc.setDrawColor(214, 211, 209);
  doc.roundedRect(margin, nextSectionY, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text('CRYPTOGRAPHIC RECONCILIATION PROOF (HMAC-SHA256)', margin + 4, nextSectionY + 6);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 113, 108);
  doc.text(`Verification Hash: ${receipt.verificationHash}`, margin + 4, nextSectionY + 12);
  doc.text(`Idempotency Key:   ${receipt.idempotencyKey}`, margin + 4, nextSectionY + 17);
  doc.text(`Gateway Reference: ${receipt.gatewayRef}`, margin + 4, nextSectionY + 22);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 113, 108);
  doc.text(
    'This PDF was automatically compiled and digitally sealed by EstateFlow upon bank/carrier reconciliation matching.',
    margin + 4,
    nextSectionY + 28
  );

  // 8. Sign-off Footer
  const footerY = pageHeight - 32;
  doc.setDrawColor(231, 229, 228);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Left: Issuer info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text('Issued by: EstateFlow Financial Operations', margin, footerY + 6);
  doc.text('Compliance: SOC 2 Type II · GAAP & IFRS Tenant Accounting Standards', margin, footerY + 10);
  doc.text(`Generated: ${receipt.pdfGeneratedAt || new Date().toISOString()}`, margin, footerY + 14);

  // Right: Electronic Authorization Stamp
  const authX = pageWidth - margin - 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(28, 25, 23);
  doc.text('AUTOMATED AUDIT SEAL', authX, footerY + 6);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('✓ DIGITALLY VERIFIED', authX, footerY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 113, 108);
  doc.text('Valid without manual ink signature', authX, footerY + 15);

  // Output
  const blob = doc.output('blob');
  const dataUrl = doc.output('datauristring');

  return { doc, blob, dataUrl };
}

/**
 * Helper to format money with currency symbol
 */
function formatMoney(amount: number, currency: string): string {
  if (currency === 'CFA') {
    return `${Math.round(amount).toLocaleString()} FCFA`;
  }
  if (currency === 'EUR') {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'GBP') {
    return `£${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Triggers a download of the PDF receipt in the user's browser.
 */
export function downloadReceiptPdf(receipt: PaymentReceipt): void {
  const { doc } = generateReceiptPdf(receipt);
  doc.save(`EstateFlow-Receipt-${receipt.receiptNumber}.pdf`);
}

/**
 * Prints the receipt PDF directly using a hidden iframe.
 */
export function printReceiptPdf(receipt: PaymentReceipt): void {
  const { blob } = generateReceiptPdf(receipt);
  const blobUrl = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Failed to trigger print:', err);
      }
    }, 300);
  };
}
