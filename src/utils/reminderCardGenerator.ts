import { Customer, Transaction, UserProfile } from '../types/khata';
import { formatPKR, formatDateFriendly } from './formatters';

export interface ReminderCardOptions {
  customer: Customer;
  currentBalance: number;
  reminderMessage: string;
  profile: UserProfile;
  transaction?: Transaction;
}

/**
 * Generates a luxury VIP reminder card on HTML Canvas
 * Contains: Customer name, amount, AP KO MILE/AP NE DIYE, date, time, current balance, note,
 * and the transaction photo, with subtle Z.Z KHATA watermark at the bottom.
 */
export async function generateReminderCardImage(
  options: ReminderCardOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  const { customer, currentBalance, reminderMessage, profile, transaction } = options;

  const hasPhoto = Boolean(transaction?.photo);
  const width = 640;
  const height = hasPhoto ? 980 : transaction ? 840 : 760;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Background: Deep obsidian
  ctx.fillStyle = '#030712'; // slate-950
  ctx.fillRect(0, 0, width, height);

  // Luxury ambient glow (Top gold, bottom emerald)
  const topGlow = ctx.createRadialGradient(width / 2, 70, 20, width / 2, 70, 280);
  topGlow.addColorStop(0, 'rgba(245, 158, 11, 0.20)'); // Amber
  topGlow.addColorStop(1, 'rgba(3, 7, 18, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, height);

  const bottomGlow = ctx.createRadialGradient(width / 2, height - 120, 30, width / 2, height - 120, 280);
  bottomGlow.addColorStop(0, 'rgba(16, 185, 129, 0.14)'); // Emerald
  bottomGlow.addColorStop(1, 'rgba(3, 7, 18, 0)');
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 0, width, height);

  // Outer border with subtle gold accent
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 2. Header: Z.Z KHATA & VIP Badge
  ctx.textAlign = 'center';
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('★ VIP DIGITAL LEDGER ★', width / 2, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px sans-serif';
  const shopName = (profile.shopName || 'Z.Z KHATA').toUpperCase();
  ctx.fillText(shopName, width / 2, 80);

  // Glowing divider line
  const dividerGrad = ctx.createLinearGradient(60, 96, width - 60, 96);
  dividerGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
  dividerGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
  dividerGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 96);
  ctx.lineTo(width - 60, 96);
  ctx.stroke();

  // 3. Customer Info Section
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 22px sans-serif';
  ctx.fillText(customer.name, width / 2, 130);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`Phone: ${customer.phone}`, width / 2, 152);

  let currentY = 172;
  const boxX = 48;
  const boxW = width - 96;

  // 4. Transaction Entry Details (if provided)
  if (transaction) {
    const isMile = transaction.type === 'AP_KO_MILE';
    const entryBoxH = 118;

    ctx.fillStyle = '#0b1329';
    roundRect(ctx, boxX, currentY, boxW, entryBoxH, 16);
    ctx.fill();

    ctx.strokeStyle = isMile ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Type Badge & Title
    ctx.textAlign = 'center';
    ctx.fillStyle = isMile ? '#34d399' : '#fb7185';
    ctx.font = 'bold 12px sans-serif';
    const typeLabel = isMile ? '🟢 AP KO MILE (PAYMENT RECEIVED)' : '🔴 AP NE DIYE (PAYMENT GIVEN / CREDIT)';
    ctx.fillText(typeLabel, width / 2, currentY + 28);

    // Amount
    ctx.font = '900 32px sans-serif';
    ctx.fillText(`${isMile ? '+' : '−'} ${formatPKR(transaction.amount)}`, width / 2, currentY + 66);

    // Date, Time and Note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    const formattedDate = formatDateFriendly(transaction.date);
    const timeStr = transaction.time || '';
    const noteStr = transaction.note ? ` • Note: ${transaction.note}` : '';
    ctx.fillText(`${formattedDate} • ${timeStr}${noteStr}`, width / 2, currentY + 96);

    currentY += entryBoxH + 14;

    // 5. Transaction Photo (if attached)
    if (transaction.photo) {
      const photoBoxH = 160;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      roundRect(ctx, boxX, currentY, boxW, photoBoxH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = transaction.photo!;
        });

        // Draw framed image inside photo box
        const maxImgW = boxW - 24;
        const maxImgH = photoBoxH - 36;
        let imgW = img.width;
        let imgH = img.height;

        const ratio = Math.min(maxImgW / imgW, maxImgH / imgH);
        imgW = Math.round(imgW * ratio);
        imgH = Math.round(imgH * ratio);

        const imgX = boxX + (boxW - imgW) / 2;
        const imgY = currentY + 26 + (maxImgH - imgH) / 2;

        ctx.save();
        roundRect(ctx, imgX, imgY, imgW, imgH, 8);
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();

        // Photo label badge
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('📷 VERIFIED ENTRY RECEIPT / BILL ATTACHED', width / 2, currentY + 18);
      } catch (err) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('📷 Entry Photo Attached', width / 2, currentY + 80);
      }

      currentY += photoBoxH + 14;
    }
  }

  // 6. Current Balance Box
  const isOwed = currentBalance > 0;
  const isAdvance = currentBalance < 0;
  const balBoxH = 88;

  ctx.fillStyle = '#080d1a';
  roundRect(ctx, boxX, currentY, boxW, balBoxH, 16);
  ctx.fill();

  ctx.strokeStyle = isOwed
    ? 'rgba(244, 63, 94, 0.4)'
    : isAdvance
    ? 'rgba(16, 185, 129, 0.4)'
    : 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('TOTAL CURRENT KHATA BALANCE', width / 2, currentY + 24);

  const amountColor = isOwed ? '#fb7185' : isAdvance ? '#34d399' : '#38bdf8';
  ctx.fillStyle = amountColor;
  ctx.font = '900 26px sans-serif';
  ctx.fillText(formatPKR(currentBalance), width / 2, currentY + 54);

  const statusText = isOwed
    ? '● AP NE LENE HAIN (DEBIT)'
    : isAdvance
    ? '● ADVANCE JAMA (CREDIT)'
    : '● HISAB BARABAR / CLEAR';
  ctx.fillStyle = amountColor;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(statusText, width / 2, currentY + 74);

  currentY += balBoxH + 14;

  // 7. Reminder Message Card
  const msgBoxH = 140;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, boxX, currentY, boxW, msgBoxH, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('OFFICIAL KHATA REMINDER MESSAGE', boxX + 18, currentY + 26);

  // Wrap and print message text
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '13px sans-serif';
  wrapText(ctx, reminderMessage, boxX + 18, currentY + 52, boxW - 36, 22);

  // Date and Time generated
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText(`${dateStr} • ${timeFormatted}`, boxX + boxW - 18, currentY + msgBoxH - 14);

  // 8. Small, Clean & Professional Z.Z KHATA Watermark at the bottom
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('✦ Z.Z KHATA • DIGITAL LEDGER ✦', width / 2, height - 34);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.font = '9px sans-serif';
  ctx.fillText('Secure • Verified • Official', width / 2, height - 20);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))), 'image/jpeg', 0.92);
  });

  return { dataUrl, blob };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
