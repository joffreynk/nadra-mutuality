import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const where: any = { organizationId };
  if (q) where.OR = [
    { member: { name: { contains: q } } },
    { member: { memberCode: { contains: q } } },
    { company: { name: { contains: q } } },
  ];
  const last = await prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          category: { select: { name: true, coveragePercent: true, price: true } },
        },
    });
  if (!last) return NextResponse.json({ error: 'No members found' }, { status: 404 });
  return NextResponse.json(last);
}