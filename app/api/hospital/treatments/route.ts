// /app/api/hospital/treatments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateTreatmentReceiptPDF } from '@/lib/receipt';
import { saveBufferToStorage } from '@/lib/storage';

function toTwoDpString(n: number) { return (Math.round(n * 100) / 100).toFixed(2); }

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const url = new URL(req.url);
    const memberId = url.searchParams.get('memberId') ?? undefined;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;

    const list = await prisma.treatment.findMany({
      where, 
      include: {
        treatments: true,     // TreatmentItem[]
        member: {select: { id: true, name: true, memberCode: true }},         // Member
        user: {select: { id: true, name: true, email: true }},           // creator (User) - make sure User model relation name is `user`
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    const userId = (session as any).user?.id ?? (session as any).userId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { memberId, treatmentItems } = body;
    if (!memberId || !Array.isArray(treatmentItems) || treatmentItems.length === 0) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    // get member coverage and org
    const [member, org] = await Promise.all([
      prisma.member.findFirst({ where: { id: memberId, organizationId }, select: { id: true, memberCode: true, name: true, coveragePercent: true } }),
      prisma.organization.findFirst({ where: { id: organizationId }, select: { id: true, name: true } })
    ]);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // create treatment
    const treatment = await prisma.treatment.create({ data: { organizationId, memberId, usercreator: userId ?? 'unknown' } });

    // create items in transaction and compute per-item shares
    const createdItems = await prisma.$transaction(
      treatmentItems.map((it: any) => {
        const name = (it.treatmentName ?? '').trim();
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const price = Number(it.unitPrice) || 0;
        const total = qty * price;
        const insurerShare = +(total * ((member.coveragePercent ?? 0) / 100));
        const memberShare = total - insurerShare;
        return prisma.treatmentItem.create({
          data: {
            treatmentId: treatment.id,
            treatmentName: name,
            quantity: qty,
            unitPrice: toTwoDpString(price),
            insurerShare: toTwoDpString(insurerShare),
            memberShare: toTwoDpString(memberShare),
          },
          select: { id: true, treatmentName: true, quantity: true, unitPrice: true }
        });
      })
    );

    // compute totals
    const cents = createdItems.reduce((s, it) => s + Math.round(Number(it.unitPrice) * 100) * Math.max(1, it.quantity), 0);
    const totalAmount = cents / 100;
    const insurerShare = Math.round(cents * ((member.coveragePercent ?? 0) / 100)) / 100;
    const memberShare = Math.round((cents - Math.round(cents * ((member.coveragePercent ?? 0) / 100)))) / 100;

    // generate pdf
    const pdfBytes = await generateTreatmentReceiptPDF({
      organization: { name: org?.name ?? 'Hospital Nadra Insurance' },
      member,
      items: createdItems.map(i => ({ treatmentName: i.treatmentName, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
      totals: { totalAmount, insurerShare, memberShare },
      createdAt: new Date(treatment.createdAt || Date.now()),
      createdBy: (session as any).user?.name ?? (session as any).user?.email ?? 'System',
      treatmentId: treatment.id,
    });

    // save pdf and update treatment
    const filename = `Treatment-${treatment.id}.pdf`;
    const { url } = await saveBufferToStorage(filename, pdfBytes);
    await prisma.treatment.update({ where: { id: treatment.id }, data: { receiptUrl: url } });

    return NextResponse.json({ ok: true, treatmentId: treatment.id, receiptUrl: url }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/hospital/treatments', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
