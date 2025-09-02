// app/api/hospital/pharmacyRequests/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { UpdatePharmacyRequestBody } from '@/lib/validations';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const pr = await prisma.pharmacyRequest.findFirst({
      where: { id: params.id, organizationId },
      include: { pharmacyRequests: {
        include: {
          user: { select: { id: true, name: true, role:true } } // approver user (nullable)
        }
      }, pharmacyRequestReceipts: true, member: true, user: { select: { id: true, name: true } } },
    });
    if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(pr);
  } catch (err: any) {
    console.error('GET /api/hospital/pharmacyRequests/[id] error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let payload: any;
  try {
    payload = await req.json();
    UpdatePharmacyRequestBody.parse(payload);
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Validation error', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: e?.message ?? 'Invalid JSON' }, { status: 400 });
  }

  try {
    const existing = await prisma.pharmacyRequest.findUnique({ where: { id: params.id } });
    if (!existing || existing.organizationId !== organizationId) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const existingItems = await tx.pharmacyRequestItem.findMany({ where: { pharmacyRequestId: params.id }, select: { id: true } });
      const existingIds = existingItems.map(i => i.id);
      const incomingIds = payload.items.filter((it:any) => it.id).map((it:any) => it.id);

      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length) await tx.pharmacyRequestItem.deleteMany({ where: { id: { in: toDelete } } });

      for (const it of payload.items) {
        if (it.id) {
          await tx.pharmacyRequestItem.update({
            where: { id: it.id },
            data: {
              mdecineName: it.mdecineName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
            },
          });
        } else {
          await tx.pharmacyRequestItem.create({
            data: {
              pharmacyRequestId: params.id,
              mdecineName: it.mdecineName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              status: 'Pending',
            },
          });
        }
      }
    });

    const updated = await prisma.pharmacyRequest.findFirst({ where: { id: params.id }, include: { pharmacyRequests: true, pharmacyRequestReceipts: true, member: true } });
    return NextResponse.json({ ok: true, pharmacyRequest: updated });
  } catch (err: any) {
    console.error('PUT /api/hospital/pharmacyRequests/[id] error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const existing = await prisma.pharmacyRequest.findFirst({ where: { id: params.id, organizationId } });
    if (!existing) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });

    await prisma.pharmacyRequestItem.deleteMany({ where: { pharmacyRequestId: params.id } });
    await prisma.pharmacyRequest.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/hospital/pharmacyRequests/[id] error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
