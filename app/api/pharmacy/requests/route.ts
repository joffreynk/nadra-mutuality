// app/api/pharmacy/requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? undefined; // Pending, Approved, Reverted
    const memberId = url.searchParams.get('memberId') ?? undefined;

    const where: any = { organizationId };
    if (memberId) where.memberId = memberId;
    if (status) where.pharmacyRequests = { some: { status } };

    const list = await prisma.pharmacyRequest.findMany({
      where,
      include: { pharmacyRequests: true, member: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(list);
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
