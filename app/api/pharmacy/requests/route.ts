// /app/api/hospital/treatments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const url = new URL(req.url);
    const memberId = url.searchParams.get('memberId') ?? undefined;

    const where: any = { organizationId,  pharmacyRequests: {some: {userAproverId: session.user.id}},  };
    if (memberId) where.memberId = memberId;

    const list = await prisma.pharmacyRequest.findMany({
      where, 
      include: {
        pharmacyRequests: {where: {userAproverId: session.user.id}, include: {user: {select: {id: true, name: true}}}},
        member: {select: { id: true, name: true, memberCode: true, coveragePercent: true }},
        user: {select: { id: true, name: true, email: true }},
        pharmacyRequestReceipts: {where: {userId: session.user.id}, select: { id: true, url: true }},
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}