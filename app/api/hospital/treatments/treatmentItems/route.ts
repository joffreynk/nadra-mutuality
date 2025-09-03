// /app/api/hospital/treatmentItems/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function toTwoDpString(n: number) { return (Math.round(n * 100) / 100).toFixed(2); }

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const url = new URL(req.url);
    const treatmentId = url.searchParams.get('treatmentId');
    if (!treatmentId) return NextResponse.json({ error: 'treatmentId required' }, { status: 400 });

    const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { id: true, organizationId: true, memberId: true } });
    if (!treatment || treatment.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    const items = await prisma.treatmentItem.findMany({ where: { treatmentId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json(items);
  } catch (err: any) {
    console.error('GET /api/hospital/treatmentItems', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await req.json();
    const { treatmentId, items } = body;
    if (!treatmentId || !Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const treatment = await prisma.treatment.findUnique({ where: { id: treatmentId }, select: { organizationId: true, memberId: true } });
    if (!treatment || treatment.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    const created = await prisma.$transaction(
      items.map((it: any) => {
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const price = Number(it.unitPrice) || 0;
        return prisma.treatmentItem.create({
          data: {
            treatmentId,
            treatmentName: (it.treatmentName ?? '').trim(),
            quantity: qty,
            unitPrice: toTwoDpString(price),          }
        });
      })
    );

    return NextResponse.json({ ok: true, added: created }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/hospital/treatmentItems', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
