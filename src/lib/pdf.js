import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { fmtDate } from './format';
import { label, DOG_STATUS, SPAY, OUTCOME, FREQUENCY, DEWORM_KIND } from './constants';

// jsPDF's built-in fonts have no ₹ sign, so PDFs use "Rs."
const rs = (n) => `Rs. ${new Intl.NumberFormat('en-IN').format(Math.round(Number(n || 0)))}`;
const INK = [30, 42, 90];
const MARIGOLD = [242, 169, 59];
const GREY = [110, 118, 150];

async function imageData(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function letterhead(doc, settings, title) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...INK);
  doc.rect(0, 0, w, 26, 'F');
  doc.setFillColor(...MARIGOLD);
  doc.rect(0, 26, w, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.trust_name || 'Kudrat Humane Living Trust', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const line = [settings.address, settings.phone, settings.email].filter(Boolean).join('   |   ');
  if (line) doc.text(line, 14, 19);
  if (settings.registration_number) doc.text(`Reg. no. ${settings.registration_number}`, w - 14, 12, { align: 'right' });
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, 42);
  return 52;
}

function footer(doc, text) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.setFont('helvetica', 'normal');
    doc.text(text, 14, h - 8);
    doc.text(`Page ${i} of ${pages}`, w - 14, h - 8, { align: 'right' });
  }
}

// Simple table renderer: columns [{ label, width, value(row) }]
function table(doc, y, columns, rows) {
  const left = 14;
  const h = doc.internal.pageSize.getHeight();
  const drawHeader = () => {
    doc.setFillColor(242, 244, 238);
    doc.rect(left, y - 5, columns.reduce((s, c) => s + c.width, 0), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    let x = left + 2;
    for (const c of columns) {
      doc.text(c.label, x, y);
      x += c.width;
    }
    y += 7;
  };
  drawHeader();
  doc.setFont('helvetica', 'normal');
  if (!rows.length) {
    doc.setTextColor(...GREY);
    doc.text('No records.', left + 2, y);
    return y + 8;
  }
  for (const r of rows) {
    const cells = columns.map((c) => doc.splitTextToSize(String(c.value(r) ?? '—'), c.width - 3));
    const lines = Math.max(...cells.map((c) => c.length));
    if (y + lines * 4.5 > h - 18) {
      doc.addPage();
      y = 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
    }
    doc.setTextColor(40, 40, 40);
    let x = left + 2;
    cells.forEach((c, i) => {
      doc.text(c, x, y);
      x += columns[i].width;
    });
    y += lines * 4.5 + 2;
  }
  return y + 4;
}

function kv(doc, y, pairs, x = 14, labelW = 45) {
  doc.setFontSize(10);
  for (const [k, v] of pairs) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREY);
    doc.text(k, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(String(v ?? '—'), 120);
    doc.text(lines, x + labelW, y);
    y += Math.max(1, lines.length) * 5 + 2;
  }
  return y;
}

// ───────────── Adoption / anniversary certificate (landscape) ─────────────
export async function adoptionCertificate({ adoption, dog, settings, number, anniversary = false }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = 297;
  const h = 210;
  doc.setFillColor(242, 244, 238);
  doc.rect(0, 0, w, h, 'F');
  doc.setDrawColor(...INK);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setDrawColor(...MARIGOLD);
  doc.setLineWidth(0.6);
  doc.rect(14, 14, w - 28, h - 28);

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((settings.trust_name || 'Kudrat Humane Living Trust').toUpperCase(), w / 2, 32, { align: 'center' });
  doc.setFontSize(30);
  doc.text(anniversary ? 'Adoption Anniversary' : 'Certificate of Virtual Adoption', w / 2, 52, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text('This certifies that', w / 2, 70, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...INK);
  doc.text(adoption.supporter_name, w / 2, 84, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text(anniversary ? 'has been a loving virtual parent to' : 'is now the proud virtual parent of', w / 2, 96, { align: 'center' });

  // name tag
  doc.setFillColor(...MARIGOLD);
  const tagW = Math.max(60, doc.getTextWidth(dog.name) * 2.2 + 30);
  doc.roundedRect(w / 2 - tagW / 2, 102, tagW, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...INK);
  doc.text(dog.name, w / 2, 115, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const msg = `Since ${fmtDate(adoption.start_date)}, a monthly gift of ${rs(adoption.monthly_amount)} has paid for ${dog.name}'s food, shelter and medical care.`;
  doc.text(doc.splitTextToSize(msg, 190), w / 2, 134, { align: 'center' });

  const photo = await imageData(dog.photo_url);
  if (photo) {
    try {
      doc.addImage(photo, 'JPEG', 26, 120, 40, 40);
    } catch {
      /* skip unsupported image */
    }
  }
  const qr = await QRCode.toDataURL(`${window.location.origin}/dogs/${dog.id}`, { margin: 0, width: 300 });
  doc.addImage(qr, 'PNG', w - 62, 124, 34, 34);
  doc.setFontSize(8);
  doc.text(`Meet ${dog.name} online`, w - 45, 162, { align: 'center' });

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.line(110, 172, 187, 172);
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(settings.founder_name || 'Pooja Prasad', w / 2, 178, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text('Founder', w / 2, 183, { align: 'center' });
  doc.text(`Certificate no. ${number}  |  Issued ${fmtDate(new Date())}`, 26, 190);
  doc.save(`${anniversary ? 'Anniversary' : 'Adoption'}-certificate-${dog.name}-${adoption.supporter_name}.pdf`.replace(/\s+/g, '-'));
}

// ───────────── Donation receipt (80G if registered) ─────────────
export function donationReceipt({ payment, settings, number }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const has80G = Boolean(settings.eighty_g_number);
  let y = letterhead(doc, settings, has80G ? 'Donation Receipt (Section 80G)' : 'Donation Receipt');
  y = kv(doc, y, [
    ['Receipt no.', number],
    ['Date', fmtDate(payment.paid_on)],
    ['Received from', payment.donor_name],
    ['Donor PAN', payment.donor_pan || '—'],
    ['Email', payment.donor_email || '—'],
    ['Amount', rs(payment.amount)],
    ['Payment mode', `${(payment.method || 'upi').toUpperCase().replace('_', ' ')}${payment.reference ? ` (ref. ${payment.reference})` : ''}`],
    ['Purpose', payment.purpose === 'virtual_adoption' ? 'Virtual adoption — care of a rescued dog' : 'Donation towards animal rescue and shelter'],
  ]);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const notes = [
    has80G ? `${settings.trust_name} is registered under Section 80G of the Income Tax Act. 80G registration no. ${settings.eighty_g_number}.` : 'This receipt acknowledges your donation.',
    settings.pan ? `PAN of the trust: ${settings.pan}.` : '',
    'Thank you for helping us rescue and care for street dogs.',
  ].filter(Boolean);
  doc.text(doc.splitTextToSize(notes.join(' '), 180), 14, y);
  y += 30;
  doc.line(130, y, 196, y);
  doc.setFontSize(10);
  doc.text('Authorised signatory', 163, y + 6, { align: 'center' });
  footer(doc, 'This is a computer-generated receipt.');
  doc.save(`Receipt-${number}.pdf`);
}

// ───────────── Vaccination certificate ─────────────
export function vaccinationCertificate({ dog, vaccinations, settings }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = letterhead(doc, settings, `Vaccination certificate — ${dog.name}`);
  y = kv(doc, y, [
    ['Name', dog.name],
    ['Breed', dog.breed || 'Indie'],
    ['Sex', dog.sex || '—'],
    ['Colour', dog.colour || '—'],
    ['Microchip', dog.microchip_number || '—'],
    ['Spay / neuter', label(SPAY, dog.spay_neuter)],
  ]);
  y += 4;
  table(doc, y, [
    { label: 'Vaccine', width: 55, value: (r) => r.vaccine },
    { label: 'Given on', width: 30, value: (r) => fmtDate(r.date_administered) },
    { label: 'Next due', width: 30, value: (r) => fmtDate(r.next_due_date) },
    { label: 'Vet', width: 40, value: (r) => r.administered_by },
    { label: 'Batch', width: 27, value: (r) => r.batch_number },
  ], vaccinations);
  footer(doc, `${settings.trust_name || 'Kudrat Humane Living Trust'} — generated ${fmtDate(new Date())}`);
  doc.save(`Vaccination-certificate-${dog.name}.pdf`);
}

// ───────────── Full health record ─────────────
export function healthRecord({ dog, vaccinations, treatments, dewormings, rescues, settings }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = letterhead(doc, settings, `Health record — ${dog.name}`);
  const rescue = rescues?.[0];
  y = kv(doc, y, [
    ['Status', label(DOG_STATUS, dog.status)],
    ['Breed / sex', `${dog.breed || 'Indie'} / ${dog.sex || '—'}`],
    ['Age', dog.age_years ? `${dog.age_years} years` : '—'],
    ['Rescued', rescue ? `${fmtDate(rescue.rescue_date)} — ${rescue.location_text || rescue.area || ''}` : dog.rescued_from_area || '—'],
    ['Spay / neuter', `${label(SPAY, dog.spay_neuter)}${dog.spay_neuter_date ? ` on ${fmtDate(dog.spay_neuter_date)}` : ''}${dog.spay_neuter_vet ? ` by ${dog.spay_neuter_vet}` : ''}`],
    ['Microchip', dog.microchip_number || '—'],
  ]);
  const section = (t) => {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(t, 14, y);
    y += 7;
  };
  section('Vaccinations');
  y = table(doc, y, [
    { label: 'Vaccine', width: 60, value: (r) => r.vaccine },
    { label: 'Given', width: 32, value: (r) => fmtDate(r.date_administered) },
    { label: 'Next due', width: 32, value: (r) => fmtDate(r.next_due_date) },
    { label: 'Vet', width: 58, value: (r) => r.administered_by },
  ], vaccinations);
  section('Treatments');
  y = table(doc, y, [
    { label: 'Condition', width: 40, value: (r) => r.condition },
    { label: 'Dates', width: 40, value: (r) => `${fmtDate(r.start_date)} – ${r.end_date ? fmtDate(r.end_date) : 'ongoing'}` },
    { label: 'Medication', width: 52, value: (r) => (r.medications || []).map((m) => `${m.name} ${m.dosage || ''}`).join(', ') + (r.frequency ? ` (${label(FREQUENCY, r.frequency)})` : '') },
    { label: 'Outcome', width: 25, value: (r) => label(OUTCOME, r.outcome) },
    { label: 'Vet', width: 25, value: (r) => r.vet },
  ], treatments);
  section('Deworming & tick / flea');
  table(doc, y, [
    { label: 'Type', width: 30, value: (r) => label(DEWORM_KIND, r.kind) },
    { label: 'Given', width: 30, value: (r) => fmtDate(r.date_given) },
    { label: 'Next due', width: 30, value: (r) => fmtDate(r.next_due_date) },
    { label: 'Medicine & dose', width: 62, value: (r) => `${r.medication || ''} ${r.dosage || ''}` },
    { label: 'By', width: 30, value: (r) => r.administered_by },
  ], dewormings);
  footer(doc, `${settings.trust_name || 'Kudrat Humane Living Trust'} — generated ${fmtDate(new Date())}`);
  doc.save(`Health-record-${dog.name}.pdf`);
}

// ───────────── Monthly impact report ─────────────
export function impactReport({ monthLabel, metrics, highlights = [], settings }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = letterhead(doc, settings, `Monthly impact report — ${monthLabel}`);
  const boxW = 58;
  metrics.forEach(([k, v], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 14 + col * (boxW + 4);
    const yy = y + row * 28;
    doc.setFillColor(242, 244, 238);
    doc.roundedRect(x, yy, boxW, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...INK);
    doc.text(String(v), x + 5, yy + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(k, x + 5, yy + 19);
  });
  y += Math.ceil(metrics.length / 3) * 28 + 8;
  if (highlights.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text('This month', 14, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    for (const h of highlights) {
      const lines = doc.splitTextToSize(`• ${h}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 1;
    }
  }
  y += 6;
  doc.setFontSize(10);
  doc.text(`Thank you to every donor, foster family and volunteer. — ${settings.founder_name || 'Pooja Prasad'}, Founder`, 14, y);
  footer(doc, `${settings.trust_name || 'Kudrat Humane Living Trust'} — ${monthLabel}`);
  doc.save(`Impact-report-${monthLabel.replace(/\s+/g, '-')}.pdf`);
}

export { rs };
