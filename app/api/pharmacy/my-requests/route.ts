// app/api/hospital/my-requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  const userId = (session as any).user?.id;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    // optional query filters 
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;

    const createdOrRelatedOrPending = {
      OR: [
        { usercreator: userId }, // requests user created
        { pharmacyRequests: { some: { userAproverId: userId } } }, // where user approved some item
        { pharmacyRequests: { some: { status: 'Pending' } } }, // requests that have pending items
      ],
    };

    const where: any = { organizationId, ...createdOrRelatedOrPending };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
    }

    // Include only items that are Pending or Approved
    const list = await prisma.pharmacyRequest.findMany({
      where: {
        organizationId,
        pharmacyRequests: {
          some: { status: { in: ['Pending'] } }, // filter parent requests
        },
      },
      include: {
        member: { select: { id: true, name: true, memberCode: true } },
        user: { select: { id: true, name: true, role: true } },
        pharmacyRequests: {
          where: { status: { in: ['Pending'] } }, // filter child requests
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        pharmacyRequestReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error('GET /api/hospital/my-requests error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
