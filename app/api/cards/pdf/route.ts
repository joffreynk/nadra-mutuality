import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Member';
  const number = searchParams.get('number') || '0000000000';

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([350, 200]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 10, y: 10, width: 330, height: 180, color: rgb(0.94, 0.97, 1) });
  page.drawText('nadra', { x: 20, y: 170, size: 18, font, color: rgb(0.06, 0.65, 0.91) });
  page.drawText(`Name: ${name}`, { x: 20, y: 140, size: 12, font });
  page.drawText(`Card #: ${number}`, { x: 20, y: 120, size: 12, font });
  // Placeholder for barcode area
  page.drawRectangle({ x: 20, y: 40, width: 310, height: 50, color: rgb(1, 1, 1), opacity: 0.05, borderColor: rgb(0.8,0.8,0.8), borderWidth: 1 });
  page.drawText('[BARCODE]', { x: 150, y: 60, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename=card.pdf' }
  });
}


