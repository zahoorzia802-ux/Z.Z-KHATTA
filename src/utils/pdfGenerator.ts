import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Transaction, CustomerBalanceSummary, UserProfile } from '../types/khata';
import { formatPKR, formatDateFriendly } from './formatters';

export function generateCustomerPdf(
  customer: Customer,
  transactions: Transaction[],
  summary: CustomerBalanceSummary,
  profile: UserProfile
) {
  const doc = new jsPDF();
  const shopName = profile.shopName || 'Z.Z KHATA';
  const ownerName = profile.ownerName ? `Proprietor: ${profile.ownerName}` : '';
  const shopPhone = profile.phone ? `Phone: ${profile.phone}` : '';
  const shopAddress = profile.address ? profile.address : '';

  // Brand Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(shopName.toUpperCase(), 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  const subtextParts = [ownerName, shopPhone, shopAddress].filter(Boolean).join(' | ');
  if (subtextParts) {
    doc.text(subtextParts, 14, 23);
  }
  doc.text('CUSTOMER KHATA & LEDGER STATEMENT', 14, 29);

  // Customer Summary Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 42, 182, 32, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name, 19, 51);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Mobile: ${customer.phone || 'N/A'}`, 19, 58);
  if (customer.address) {
    doc.text(`Address: ${customer.address}`, 19, 65);
  }

  // Balance Badge
  const balance = summary.currentBalance;
  const isOwed = balance > 0;
  const isAdvance = balance < 0;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CURRENT BALANCE:', 140, 51);

  doc.setFontSize(14);
  if (isOwed) {
    doc.setTextColor(225, 29, 72); // rose-600
  } else if (isAdvance) {
    doc.setTextColor(5, 150, 105); // emerald-600
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text(formatPKR(balance), 140, 59);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const statusStr = isOwed ? 'Ap Ne Lene Hain' : isAdvance ? 'Ap Ne Dene Hain' : 'Khata Barabar';
  doc.text(`(${statusStr})`, 140, 65);

  // Build Transaction History Table with Running Balance
  const sortedAsc = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.createdAt.localeCompare(b.createdAt);
  });

  let running = customer.openingBalance || 0;
  const tableRows: string[][] = [];

  // Opening balance row if non-zero
  if (customer.openingBalance !== 0) {
    tableRows.push([
      customer.createdAt ? customer.createdAt.slice(0, 10) : 'Opening',
      '--',
      'OPENING BALANCE',
      formatPKR(Math.abs(customer.openingBalance)),
      'Starting balance',
      formatPKR(customer.openingBalance),
    ]);
  }

  sortedAsc.forEach((t) => {
    if (t.type === 'AP_NE_DIYE') {
      running += t.amount;
    } else {
      running -= t.amount;
    }

    tableRows.push([
      formatDateFriendly(t.date),
      t.time || '--',
      t.type === 'AP_KO_MILE' ? 'AP KO MILE' : 'AP NE DIYE',
      formatPKR(t.amount),
      t.note || '-',
      formatPKR(running),
    ]);
  });

  if (tableRows.length === 0) {
    tableRows.push(['--', '--', 'No transactions recorded', '0', '-', formatPKR(running)]);
  }

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Time', 'Type', 'Amount', 'Note', 'Running Balance']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawRow = data.row.raw as unknown as string[];
        const typeText = Array.isArray(rawRow) ? String(rawRow[2]) : '';
        if (data.column.index === 2) {
          if (typeText.includes('AP_KO_MILE') || typeText === 'AP KO MILE') {
            data.cell.styles.textColor = [5, 150, 105]; // emerald
            data.cell.styles.fontStyle = 'bold';
          } else if (typeText.includes('AP_NE_DIYE') || typeText === 'AP NE DIYE') {
            data.cell.styles.textColor = [225, 29, 72]; // rose
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer notes & Subtle professional Z.Z KHATA Watermark
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = (doc.lastAutoTable?.finalY || 180) + 12;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `✦ Z.Z KHATA • OFFICIAL DIGITAL LEDGER ✦ | Generated on ${new Date().toLocaleDateString('en-GB')}`,
    14,
    Math.min(finalY, 280)
  );
  doc.setFontSize(7);
  doc.setTextColor(180, 190, 205);
  doc.text(
    `Verified & Secure Ledger Statement • Total Entries: ${tableRows.length}`,
    14,
    Math.min(finalY + 4, 285)
  );

  const cleanName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`ZZ_KHATA_${cleanName}_Statement.pdf`);
}
