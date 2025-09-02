// app/api/hospital/pharmacyRequests/[id]/receipt/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { saveBufferToStorage } from '@/lib/storage';

function makeFilename(requestId: string) {
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  return `receipt-${requestId}-${now}.pdf`;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id;
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const requestId = params.id;

  // load request with member + items + approver user info
  const full = await prisma.pharmacyRequest.findUnique({
    where: { id: requestId },
    include: {
      member: true,
      user: { select: { id: true, name: true } }, // request creator
      pharmacyRequests: { include: { user: { select: { id: true, name: true } } } }, // item approver
    },
  });

  if (!full || full.organizationId !== orgId) {
    return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  }

  // only include approved items in the receipt
  const approvedItems = (full.pharmacyRequests || []).filter((i: any) => i.status === 'Approved');
  if (approvedItems.length === 0) {
    return NextResponse.json({ error: 'No approved items to include in receipt' }, { status: 400 });
  }

  // Build PDF using pdf-lib
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4-ish
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleSize = 16;
  const textSize = 10;

  let y = 800;
  page.drawText('Pharmacy Receipt', { x: 40, y, size: titleSize, font: helvetica });
  y -= 28;
  page.drawText(`Request: ${full.id}`, { x: 40, y, size: textSize, font: helvetica });
  page.drawText(`Member: ${full.member?.name ?? full.memberId}`, { x: 320, y, size: textSize, font: helvetica });
  y -= 16;
  page.drawText(`Created by: ${full.user?.name ?? full.usercreator}`, { x: 40, y, size: textSize, font: helvetica });
  page.drawText(`Date: ${new Date(full.createdAt).toLocaleString()}`, { x: 320, y, size: textSize, font: helvetica });

  y -= 26;
  // Table header
  page.drawText('Medicine', { x: 40, y, size: textSize, font: helvetica });
  page.drawText('Qty', { x: 320, y, size: textSize, font: helvetica });
  page.drawText('Unit', { x: 370, y, size: textSize, font: helvetica });
  page.drawText('Amount', { x: 450, y, size: textSize, font: helvetica });
  y -= 14;

  let total = 0;
  for (const it of approvedItems) {
    // compute amount
    const qty = Number(it.quantity ?? 0);
    const unit = Number(it.unitPrice ?? 0);
    const amount = qty * unit;

    // draw row
    page.drawText(String(it.mdecineName ?? ''), { x: 40, y, size: textSize, font: helvetica });
    page.drawText(String(qty), { x: 320, y, size: textSize, font: helvetica });
    page.drawText(unit.toFixed(2), { x: 370, y, size: textSize, font: helvetica });
    page.drawText(amount.toFixed(2), { x: 450, y, size: textSize, font: helvetica });

    // small approver line
    if (it.user?.name) {
      page.drawText(`approved by: ${it.user.name}`, { x: 40, y: y - 12, size: 8, font: helvetica });
    }

    total += amount;
    y -= 30;

    // pagination: start a new page when near bottom
    if (y < 120) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
    }
  }

  page.drawText(`Total: ${total.toFixed(2)}`, { x: 40, y: y - 8, size: textSize, font: helvetica });

  // save PDF bytes
  const pdfBytes = await pdfDoc.save(); // Uint8Array

  // persist to storage using your helper
  const filename = makeFilename(requestId);
  const { filepath, url } = await saveBufferToStorage(filename, pdfBytes);

  // create DB row pointing to printable url (url is e.g. /api/files/<filename>)
  const created = await prisma.pharmacyRequestReceipt.create({
    data: {
      organizationId: orgId,
      userId,
      pharmacyRequestId: requestId,
      url,
    },
  });

  return NextResponse.json({ ok: true, receipt: created, receiptUrl: url }, { status: 201 });
}
