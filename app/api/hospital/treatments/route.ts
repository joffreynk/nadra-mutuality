import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { cloudinary } from '@/lib/cloudinary';

const itemSchema = z.object({ hospitalServiceId: z.string(), quantity: z.number().int().min(1), unitPrice: z.number().nonnegative() });
const treatmentSchema = z.object({ memberId: z.string(), items: z.array(itemSchema).min(1) });

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
  const rows = await prisma.treatment.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = treatmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, items } = parsed.data;
  const serviceIds = items.map(i => i.hospitalServiceId);
  const serviceMap = new Map<string, any>();
  const dbServices = await prisma.hospitalService.findMany({ where: { id: { in: serviceIds } } });
  for (const s of dbServices) serviceMap.set(s.id, s);

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  const coverage = member.coveragePercent ?? 0;

  let total = 0;
  const createItems = items.map((it) => {
    const base = it.unitPrice ?? Number(serviceMap.get(it.hospitalServiceId)?.price ?? 0);
    const unit = Number(base);
    total += unit * it.quantity;
    return { hospitalServiceId: it.hospitalServiceId, quantity: it.quantity, unitPrice: unit as any };
  });
  const insurerShare = Number((total * (coverage / 100)).toFixed(2));
  const memberShare = Number((total - insurerShare).toFixed(2));

  const created = await prisma.treatment.create({
    data: {
      organizationId,
      memberId,
      providerType: 'hospital',
      totalAmount: total as any,
      insurerShare: insurerShare as any,
      memberShare: memberShare as any,
      items: { create: createItems }
    },
    include: { items: true }
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 520]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Hospital Receipt', { x: 20, y: 490, size: 16, font, color: rgb(0.06, 0.65, 0.91) });
  page.drawText(`Member: ${member.name} (${member.mainId})`, { x: 20, y: 470, size: 12, font });
  page.drawText(`Coverage: ${coverage}%`, { x: 20, y: 455, size: 12, font });
  let y = 430;
  page.drawText('Service', { x: 20, y, size: 12, font });
  page.drawText('Qty', { x: 220, y, size: 12, font });
  page.drawText('Unit', { x: 260, y, size: 12, font });
  page.drawText('Amount', { x: 320, y, size: 12, font });
  y -= 18;
  for (const it of created.items) {
    const svc = serviceMap.get(it.hospitalServiceId);
    const unit = Number(it.unitPrice ?? 0);
    const amount = unit * it.quantity;
    page.drawText(String(svc?.name ?? it.hospitalServiceId), { x: 20, y, size: 10, font });
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

  const uploaded: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'nadra/receipts', resource_type: 'raw', format: 'pdf' }, (err, result) => {
      if (err) reject(err); else resolve(result);
    });
    stream.end(Buffer.from(pdfBytes));
  });

  const updated = await prisma.treatment.update({ where: { id: created.id }, data: { receiptCloudinaryId: uploaded.public_id, receiptCloudinaryUrl: uploaded.secure_url } });

  return NextResponse.json({ ...created, receiptCloudinaryId: updated.receiptCloudinaryId, receiptCloudinaryUrl: updated.receiptCloudinaryUrl });
}


