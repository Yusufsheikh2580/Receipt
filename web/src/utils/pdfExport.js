import { jsPDF } from 'jspdf';

export function exportReceiptsToCSV(receipts, filename = 'SimplyWise_Expense_Ledger_2026.csv') {
  const headers = [
    'Receipt ID',
    'Date',
    'Time',
    'Merchant',
    'Category',
    'Payment Method',
    'Subtotal',
    'Tax',
    'Tip',
    'Total Amount',
    'Tax Deductible',
    'Deduction %',
    'Write-off Amount',
    'Return Policy (Days)',
    'Return Deadline',
    'Notes'
  ];

  const rows = receipts.map((r) => [
    `"${r.id}"`,
    `"${r.date}"`,
    `"${r.time || ''}"`,
    `"${r.merchant.replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.paymentMethod || ''}"`,
    r.subtotal.toFixed(2),
    r.tax.toFixed(2),
    r.tip.toFixed(2),
    r.total.toFixed(2),
    r.isTaxDeductible ? 'YES' : 'NO',
    `${r.deductionPercentage}%`,
    r.writeOffAmount.toFixed(2),
    r.returnPolicyDays || 0,
    `"${r.returnDeadline || 'N/A'}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportReceiptsToPDF(receipts, metadata = {}) {
  const doc = new jsPDF();
  const title = metadata.title || 'SIMPLYWISE EXPENSE & TAX AUDIT REPORT';
  const taxYear = metadata.taxYear || '2026';
  const totalSpend = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalWriteOff = receipts.reduce((sum, r) => sum + (r.isTaxDeductible ? r.writeOffAmount : 0), 0);

  // Styling Header
  doc.setFillColor(9, 13, 22); // #090D16 Dark
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(16, 185, 129); // #10B981 Emerald
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SimplyWise', 14, 18);

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 28);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tax Year: ${taxYear}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 35);

  // Executive Metric Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 46, 182, 24, 3, 3, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AUDITED EXPENSES', 20, 53);
  doc.text('QUALIFIED TAX WRITE-OFFS', 80, 53);
  doc.text('RECORDED RECEIPTS', 145, 53);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalSpend.toFixed(2)}`, 20, 63);
  doc.setTextColor(16, 185, 129);
  doc.text(`$${totalWriteOff.toFixed(2)}`, 80, 63);
  doc.setTextColor(15, 23, 42);
  doc.text(`${receipts.length} Documents`, 145, 63);

  // Table Headers
  let y = 80;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  doc.text('DATE', 17, y + 5.5);
  doc.text('MERCHANT', 38, y + 5.5);
  doc.text('CATEGORY', 82, y + 5.5);
  doc.text('PAYMENT', 120, y + 5.5);
  doc.text('TOTAL', 152, y + 5.5);
  doc.text('WRITE-OFF', 174, y + 5.5);

  // Table Body Rows
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  receipts.forEach((r, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 7, 'F');
    }

    doc.setTextColor(51, 65, 85);
    doc.text(r.date, 17, y + 1);
    doc.text(r.merchant.substring(0, 22), 38, y + 1);
    doc.text(r.category.substring(0, 18), 82, y + 1);
    doc.text((r.paymentMethod || 'N/A').substring(0, 15), 120, y + 1);
    doc.text(`$${r.total.toFixed(2)}`, 152, y + 1);

    if (r.isTaxDeductible) {
      doc.setTextColor(16, 185, 129);
      doc.text(`$${r.writeOffAmount.toFixed(2)}`, 174, y + 1);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('$0.00', 174, y + 1);
    }

    y += 7.5;
  });

  // Footer notes
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  y += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'IRS Audit Protection Notice: This document was compiled via SimplyWise automated OCR extraction and categorized in compliance with IRS Schedule C standards.',
    14,
    y
  );

  doc.save(`SimplyWise_Tax_Report_${taxYear}.pdf`);
}
