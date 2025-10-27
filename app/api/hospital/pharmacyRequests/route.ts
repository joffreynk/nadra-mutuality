// app/api/hospital/pharmacyRequests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { CreatePharmacyRequestBody } from '@/lib/validations';
import { use } from 'react';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get('memberId') ?? undefined;
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;

    const where: any = { organizationId, usercreator: session.user.id };
    if (memberId) where.memberId = memberId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
    }

    const list = await prisma.pharmacyRequest.findMany({
      where,
      include: {
        pharmacyRequests: {where: {
          pharmacyRequestId: session.user.id
        } },
        pharmacyRequestReceipts: {where: {
          pharmacyRequestId: session.user.id
        }},
        member: { include: { category: { select: { name: true, coveragePercent: true } } } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let payload: any;
  try {
    payload = await req.json();
    console.log(payload);
    
    CreatePharmacyRequestBody.parse(payload);
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Validation error', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: e?.message ?? 'Invalid JSON' }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const pr = await tx.pharmacyRequest.create({
        data: {
          organizationId,
          memberId: payload.memberId,
          usercreator: userId,
          code: payload.code,
        },
      });

      const itemsToCreate = payload.items.map((it: any) => ({
        pharmacyRequestId: pr.id,
        mdecineName: it.mdecineName,
        quantity: it.quantity,
        unitPrice: null,
        status: 'Pending',
        userAproverId: null, // explicit null now allowed
      }));

      await tx.pharmacyRequestItem.createMany({
        data: itemsToCreate,
      });

      const full = await tx.pharmacyRequest.findUnique({
        where: { id: pr.id },
        include: { pharmacyRequests: true, pharmacyRequestReceipts: true, member: true },
      });

      return full;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/hospital/pharmacyRequests error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
