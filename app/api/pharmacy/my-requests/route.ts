// app/api/pharmacy/my-requests/route.ts
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

    // Pharmacy gets requests that:
    // - they created (if pharmacies create requests),
    // - they approved an item for,
    // - OR have pending items (so pharmacies can pick them up).
    const where: any = {
      organizationId,
      OR: [
        { usercreator: userId },
        { pharmacyRequests: { some: { userAproverId: userId } } },
        { pharmacyRequests: { some: { status: { in: ['Pending', 'Reverted'] } } } },
      ],
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate + 'T00:00:00Z');
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59Z');
    }

    const list = await prisma.pharmacyRequest.findMany({
      where,
      include: {
      member: true,
      user: { select: { id: true, name: true } }, // request creator
      pharmacyRequests: {
        where: { status: { in: ['Pending', 'Reverted'] } },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true } } // approver user (nullable)
        }
      },
      pharmacyRequestReceipts: true,
    },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    console.error('GET /api/pharmacy/my-requests error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
