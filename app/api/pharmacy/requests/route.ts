import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

const itemSchema = z.object({ medicineId: z.string(), quantity: z.number().int().min(1) });
const requestSchema = z.object({ memberId: z.string(), items: z.array(itemSchema).min(1) });

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('memberId') || undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const where: any = { organizationId: session.user.organizationId };
  if (memberId) where.memberId = memberId;
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  const rows = await prisma.pharmacyRequest.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, items } = parsed.data;
  // compute totals
  const meds = await prisma.medicine.findMany({ where: { id: { in: items.map(i => i.medicineId) } } });
  const priceMap = new Map(meds.map(m => [m.id, Number(m.price)]));
  let total = 0;
  for (const it of items) total += (priceMap.get(it.medicineId) || 0) * it.quantity;
  const member = await prisma.member.findUnique({ where: { id: memberId } });
  const coverage = member?.coveragePercent ?? 0;
  const insurerShare = Number((total * (coverage / 100)).toFixed(2));
  const memberShare = Number((total - insurerShare).toFixed(2));

  const created = await prisma.pharmacyRequest.create({
    data: { organizationId: session.user.organizationId, memberId, totalAmount: total as any, insurerShare: insurerShare as any, memberShare: memberShare as any, items: { create: items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity, unitPrice: (priceMap.get(i.medicineId) || 0) as any })) } },
    include: { items: true }
  });

  // Generate a receipt PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 520]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Pharmacy Receipt', { x: 20, y: 490, size: 16, font, color: rgb(0.06, 0.65, 0.91) });
  page.drawText(`Member: ${member?.name ?? ''} (${member?.mainId ?? ''})`, { x: 20, y: 470, size: 12, font });
  page.drawText(`Coverage: ${coverage}%`, { x: 20, y: 455, size: 12, font });
  let y = 430;
  page.drawText('Medicine', { x: 20, y, size: 12, font });
  page.drawText('Qty', { x: 220, y, size: 12, font });
  page.drawText('Unit', { x: 260, y, size: 12, font });
  page.drawText('Amount', { x: 320, y, size: 12, font });
  y -= 18;
  for (const it of created.items) {
    const unit = Number(it.unitPrice ?? 0);
    const amount = unit * it.quantity;
    const name = meds.find(m => m.id === it.medicineId)?.name ?? it.medicineId;
    page.drawText(String(name), { x: 20, y, size: 10, font });
    page.drawText(String(it.quantity), { x: 220, y, size: 10, font });
    page.drawText(unit.toFixed(2), { x: 260, y, size: 10, font });
    page.drawText(amount.toFixed(2), { x: 320, y, size: 10, font });
    y -= 16;
  }
  y -= 10;
  page.drawText(`Total: ${total.toFixed(2)}`, { x: 20, y, size: 12, font }); y -= 16;
  page.drawText(`Insurer Pays: ${insurerShare.toFixed(2)}`, { x: 20, y, size: 12, font }); y -= 16;
  page.drawText(`Member Pays: ${memberShare.toFixed(2)}`, { x: 20, y, size: 12, font });
  const pdfBytes = await pdfDoc.save();

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const filename = `pharmacy-receipt-${created.id}.pdf`;
  const filePath = path.join(uploadDir, filename);
  const fileUrl = `/uploads/${filename}`;

  await fs.writeFile(filePath, pdfBytes);

  const updated = await prisma.pharmacyRequest.update({ where: { id: created.id }, data: { receiptUrl: fileUrl } });

  return NextResponse.json({ ...created, receiptUrl: updated.receiptUrl });
}


