import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function toTwoDpString(n: number) { return (Math.round(n * 100) / 100).toFixed(2); }

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const itm = await prisma.treatmentItem.findUnique({ where: { id: params.id }, include: { treatment: true } });
    if (!itm || itm.treatment.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    return NextResponse.json(itm);
  } catch (err: any) {
    console.error('GET /api/hospital/treatmentItems/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const body = await _req.json();
    const existing = await prisma.treatmentItem.findUnique({ where: { id: params.id }, include: { treatment: true } });
    if (!existing || existing.treatment.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    const updates: any = {};
    if (body.treatmentName) updates.treatmentName = body.treatmentName;
    if (body.quantity !== undefined) updates.quantity = Math.max(1, Math.floor(Number(body.quantity)));
    if (body.unitPrice !== undefined) updates.unitPrice = toTwoDpString(Number(body.unitPrice));

    await prisma.treatmentItem.update({ where: { id: params.id }, data: updates });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('PUT /api/hospital/treatmentItems/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const existing = await prisma.treatmentItem.findUnique({ where: { id: params.id }, include: { treatment: true } });
    if (!existing || existing.treatment.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    await prisma.treatmentItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/hospital/treatmentItems/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
