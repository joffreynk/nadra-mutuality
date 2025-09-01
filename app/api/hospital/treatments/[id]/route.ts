// app/api/hospital/treatments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { generateTreatmentReceiptPDF } from '@/lib/receipt';
import { saveBufferToStorage } from '@/lib/storage';

const ItemSchema = z.object({
  id: z.string().optional(),
  treatmentName: z.string().min(1, 'treatmentName required'),
  quantity: z.number().int().min(1, 'quantity must be >= 1'),
  unitPrice: z.number().nonnegative('unitPrice must be >= 0'),
});

const BodySchema = z.object({
  treatmentItems: z.array(ItemSchema).min(1, 'At least one treatment item required'),
  regenReceipt: z.boolean().optional(),
});

function toTwoDpString(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}
function ensureNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const treatment = await prisma.treatment.findFirst({
      where: { id: params.id, organizationId },
      include: {
        treatments: true,
        member: true,
        user: { select: { id: true, name: true, email: true, username: true } },
        organization: true,
      },
    });
    if (!treatment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(treatment);
  } catch (e: any) {
    console.error('GET /treatments/[id]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id ?? (session as any).userId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let parsedBody;
  try {
    const raw = await req.json();
    parsedBody = BodySchema.parse(raw);
  } catch (e: any) {
    if (e?.issues) {
      // zod error
      return NextResponse.json({ error: 'Validation error', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message || 'Invalid JSON' }, { status: 400 });
  }

  try {
    // verify treatment belongs to org and grab member for coverage
    const existingTreatment = await prisma.treatment.findFirst({
      where: { id: params.id },
      include: { member: true },
    });
    if (!existingTreatment || existingTreatment.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }
    const member = existingTreatment.member!;
    const coverage = member.coveragePercent ?? 0;

    // Transaction: delete missing items, update existing, create new
    await prisma.$transaction(async (tx) => {
      const existingItems = await tx.treatmentItem.findMany({ where: { treatmentId: params.id }, select: { id: true } });
      const existingIds = existingItems.map(i => i.id);
      const incomingIds = parsedBody.treatmentItems.filter(it => it.id).map(it => it.id as string);

      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length) await tx.treatmentItem.deleteMany({ where: { id: { in: toDelete } } });

      for (const it of parsedBody.treatmentItems) {
        const name = it.treatmentName.trim();
        const qty = Math.max(1, Math.floor(ensureNumber(it.quantity, 1)));
        const price = Math.max(0, ensureNumber(it.unitPrice, 0));
        const total = Math.round(qty * price * 100) / 100;
        const insurerShare = Math.round(total * (coverage / 100) * 100) / 100;
        const memberShare = Math.round((total - insurerShare) * 100) / 100;

        if (it.id) {
          await tx.treatmentItem.update({
            where: { id: it.id },
            data: {
              treatmentName: name,
              quantity: qty,
              unitPrice: toTwoDpString(price),
              insurerShare: toTwoDpString(insurerShare),
              memberShare: toTwoDpString(memberShare),
            },
          });
        } else {
          await tx.treatmentItem.create({
            data: {
              treatmentId: params.id,
              treatmentName: name,
              quantity: qty,
              unitPrice: toTwoDpString(price),
              insurerShare: toTwoDpString(insurerShare),
              memberShare: toTwoDpString(memberShare),
            },
          });
        }
      }
    });

    // Recalculate totals from DB
    const finalItems = await prisma.treatmentItem.findMany({ where: { treatmentId: params.id } });
    const cents = finalItems.reduce((s, it) => s + Math.round(Number(it.unitPrice) * 100) * Math.max(1, it.quantity), 0);
    const totalAmount = cents / 100;
    const insurerShare = Math.round(cents * (coverage / 100)) / 100;
    const memberShare = Math.round((cents - Math.round(cents * (coverage / 100)))) / 100;

    // regenerate receipt unless explicit false
    if (parsedBody.regenReceipt !== false) {
      const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      const creatorName = (session as any).user?.name ?? (session as any).user?.email ?? 'System';
      const pdfBytes = await generateTreatmentReceiptPDF({
        organization: { name: org?.name ?? 'Hospital Insurance' },
        member: { id: member.id, memberCode: member.memberCode, name: member.name, coveragePercent: member.coveragePercent },
        items: finalItems.map(fi => ({ treatmentName: fi.treatmentName, quantity: fi.quantity, unitPrice: Number(fi.unitPrice) })),
        totals: { totalAmount, insurerShare, memberShare },
        createdAt: new Date(),
        createdBy: creatorName,
        treatmentId: params.id,
      });
      const filename = `treatment-${params.id}-${Date.now()}.pdf`;
      const { url } = await saveBufferToStorage(filename, pdfBytes);

      await prisma.treatment.update({ where: { id: params.id }, data: { receiptUrl: url, usercreator: userId ?? undefined } });
    }

    const updated = await prisma.treatment.findFirst({
      where: { id: params.id },
      include: { treatments: true, member: true, user: { select: { id: true, name: true, email: true } }, organization: true },
    });

    return NextResponse.json({ ok: true, treatment: updated }, { status: 200 });
  } catch (e: any) {
    console.error('PUT /treatments/[id] error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const existing = await prisma.treatment.findFirst({ where: { id: params.id, organizationId } });
    if (!existing) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    await prisma.treatmentItem.deleteMany({ where: { treatmentId: params.id } });
    await prisma.treatment.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /treatments/[id] error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
