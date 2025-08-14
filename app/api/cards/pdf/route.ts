import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  let name = searchParams.get('name') || 'Member';
  let number = searchParams.get('number') || '0000000000';
  let idNumber = '';
  let category = '';
  let coverage = '';
  let phone = '';
  let companyName = '';
  let addressText = '';
  let photoUrl: string | null = null;
  if (cardId) {
    const card = await prisma.card.findUnique({ where: { id: cardId }, include: { member: true, dependent: { include: { member: true } } } });
    if (card) {
      number = card.number;
      const subject: any = card.member ?? card.dependent;
      if (subject?.name) {
        name = subject.name;
      }
      const m: any = card.member ?? card.dependent?.member ?? null;
      if (m) {
        idNumber = m.idNumber ?? '';
        category = m.category ?? '';
        coverage = m.coveragePercent != null ? `${m.coveragePercent}%` : '';
        phone = m.contact ?? '';
        companyName = m.companyName ?? '';
        photoUrl = (card.member?.passportPhotoUrl as string | null) ?? (card.dependent?.passportPhotoUrl as string | null) ?? null;
        addressText = m.address ?? '';
      }
    }
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([350, 200]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 10, y: 10, width: 330, height: 180, color: rgb(0.94, 0.97, 1) });
  page.drawText('nadra', { x: 20, y: 170, size: 18, font, color: rgb(0.06, 0.65, 0.91) });
  page.drawText(`Name: ${name}`, { x: 100, y: 150, size: 12, font });
  page.drawText(`Card #: ${number}`, { x: 100, y: 135, size: 12, font });
  if (idNumber) page.drawText(`ID: ${idNumber}`, { x: 20, y: 120, size: 11, font });
  if (category) page.drawText(`Category: ${category}`, { x: 20, y: 105, size: 11, font });
  if (coverage) page.drawText(`Coverage: ${coverage}`, { x: 180, y: 105, size: 11, font });
  if (phone) page.drawText(`Phone: ${phone}`, { x: 20, y: 90, size: 11, font });
  if (companyName) page.drawText(`Company: ${companyName}`, { x: 20, y: 75, size: 11, font });
  if (addressText) page.drawText(`Address: ${addressText}`, { x: 20, y: 60, size: 10, font });
  // Embed passport photo if available
  if (photoUrl) {
    try {
      const res = await fetch(photoUrl);
      const bytes = new Uint8Array(await res.arrayBuffer());
      let image;
      if (photoUrl.toLowerCase().endsWith('.png')) image = await pdfDoc.embedPng(bytes);
      else image = await pdfDoc.embedJpg(bytes);
      const dims = image.scale(48 / image.height);
      page.drawImage(image, { x: 20, y: 130, width: image.width * dims, height: image.height * dims });
    } catch {}
  }
  // Placeholder for barcode area
  page.drawRectangle({ x: 20, y: 30, width: 310, height: 40, color: rgb(1, 1, 1), opacity: 0.05, borderColor: rgb(0.8,0.8,0.8), borderWidth: 1 });
  page.drawText('[BARCODE]', { x: 150, y: 45, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename=card.pdf' }
  });
}


