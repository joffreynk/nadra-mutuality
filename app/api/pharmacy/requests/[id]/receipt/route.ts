// app/api/pharmacy/requests/[id]/receipt/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
// assume you have generateTreatmentReceiptPDF & saveBufferToStorage helpers
import { generateTreatmentReceiptPDF } from '@/lib/receipt';
import { saveBufferToStorage } from '@/lib/storage';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const pr = await prisma.pharmacyRequest.findFirst({ where: { id: params.id, organizationId }, include: { pharmacyRequests: true, member: true, organization: true } });
    if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const items = pr.pharmacyRequests.map(it => ({ name: it.mdecineName, quantity: it.quantity, unitPrice: Number(it.unitPrice) }));
    const cents = items.reduce((s, it) => s + Math.round((it.unitPrice || 0) * 100) * Math.max(1, it.quantity), 0);
    const totalAmount = cents / 100;
    const coverage = pr.member?.coveragePercent ?? 0;
    const insurerShare = Math.round(cents * (coverage / 100)) / 100;
    const memberShare = Math.round((cents - Math.round(cents * (coverage / 100)))) / 100;

    const pdfBytes = await generateTreatmentReceiptPDF({
      organization: { name: pr.organization?.name ?? 'Org' },
      member: { id: pr.member?.id, name: pr.member?.name, memberCode: pr.member?.memberCode, coveragePercent: pr.member?.coveragePercent },
      items,
      totals: { totalAmount, insurerShare, memberShare },
      createdAt: new Date(),
      createdBy: (session as any).user?.name ?? 'User',
      treatmentId: pr.id,
    });

    const filename = `pharmacyRequest-${pr.id}-${Date.now()}.pdf`;
    const { url } = await saveBufferToStorage(filename, pdfBytes);

    const receipt = await prisma.pharmacyRequestReceipt.create({
      data: { organizationId, userId: userId ?? '', pharmacyRequestId: pr.id, url },
    });

    return NextResponse.json({ ok: true, receipt });
  } catch (err: any) {
    console.error('POST /receipt error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
