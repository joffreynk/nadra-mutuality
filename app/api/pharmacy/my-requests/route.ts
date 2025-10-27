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
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') ?? undefined;
    const endDate = url.searchParams.get('endDate') ?? undefined;

    // Item-level filter: items we care about (pending OR approved by this user)
    const itemFilter: any = { OR: [{ status: 'Pending' }] };

    // Top-level WHERE: organization + ensure at least one child matches itemFilter
    const where: any = {
      organizationId,
      pharmacyRequests: { some: itemFilter }, // <- ensures children are not empty
    };

    // apply date range if present
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');``
    }

    const list = await prisma.pharmacyRequest.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, memberCode: true, category: { select: { name: true, coveragePercent: true } } } },
        user: { select: { id: true, name: true, role: true } },
        // include only matching child items (so the array will be non-empty)
        pharmacyRequests: {
          where: itemFilter,
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
