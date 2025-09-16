// app/api/hospital/treatments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateTreatmentReceiptPDF } from '@/lib/receipt';
import { saveBufferToStorage } from '@/lib/storage';


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id ?? (session as any).userId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    // verify treatment belongs to org and grab member for coverage
    const existingpharmacyRequest = await prisma.pharmacyRequest.findFirst({
      where: { id: params.id },
      include: { member: true },
    });
    if (!existingpharmacyRequest || existingpharmacyRequest.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }
    const member = existingpharmacyRequest.member!;
    const coverage = member.coveragePercent ?? 0;

    // Recalculate totals from DB
    const finalItems = await prisma.pharmacyRequestItem.findMany({ where: { pharmacyRequestId: params.id, userAproverId: userId } });
    const cents = finalItems.reduce((s, it) => s + Math.round(Number(it.unitPrice) * 100) * Math.max(1, it.quantity), 0);
    const totalAmount = cents / 100;
    const insurerShare = Math.round(cents * (coverage / 100)) / 100;
    const memberShare = Math.round((cents - Math.round(cents * (coverage / 100)))) / 100;

    const updated = await prisma.pharmacyRequest.findFirst({
      where: { id: params.id, pharmacyRequests: { some: { userAproverId: userId } } },
      include: { pharmacyRequests: { where: { userAproverId: userId } }, member: true, user: { select: { id: true, name: true, email: true } }, organization: true },
    });
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      const creatorName = (session as any).user?.name ?? (session as any).user?.email ?? 'System';
      const pdfBytes = await generateTreatmentReceiptPDF({
        organization: { name: org?.name ?? 'Nadra Insurance' },
        member: { id: member.id, memberCode: member.memberCode, name: member.name, coveragePercent: member.coveragePercent },
        items: finalItems.map(fi => ({ treatmentName: fi.mdecineName, quantity: fi.quantity, unitPrice: Number(fi.unitPrice) })),
        totals: { totalAmount, insurerShare, memberShare },
        createdAt: new Date(),
        createdBy: creatorName,
        treatmentId: updated?.code ?? 'N/A',
      });
      const filename = `Medicine-${session?.user?.name}-${params.id}-${Date.now()}.pdf`;
      const { url } = await saveBufferToStorage(filename, pdfBytes);

      await prisma.pharmacyRequestReceipt.create({ data: { url, userId, pharmacyRequestId: params.id, organizationId } });

    return NextResponse.json({ ok: true, medicine: updated }, { status: 200 });
  } catch (e: any) {
    console.error('CREATE MEDICINE RECEIPT ERROR', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}