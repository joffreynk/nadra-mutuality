// /app/api/hospital/treatments/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const treatment = await prisma.treatment.findFirst({ where: { id: params.id, organizationId }, include: { treatments: true, member: true } });
    if (!treatment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(treatment);
  } catch (err: any) {
    console.error('GET /api/hospital/treatments/[id]', err);
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
    const data: any = {};
    if (body.usercreator) data.usercreator = body.usercreator;
    if (body.receiptUrl) data.receiptUrl = body.receiptUrl;

    const updated = await prisma.treatment.updateMany({ where: { id: params.id, organizationId }, data });
    if (updated.count === 0) return NextResponse.json({ error: 'Not found or no permission' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('PUT /api/hospital/treatments/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    await prisma.treatment.deleteMany({ where: { id: params.id, organizationId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/hospital/treatments/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
