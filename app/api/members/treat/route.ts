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
    { name: { contains: q, } },
    { memberCode: { contains: q,} }
  ];
  const members = await prisma.member.findMany({ 
    where,
    take: 3,
    select: {id: true, name: true, memberCode: true, category: { select: { name: true, coveragePercent: true } }}
  });  
  if (!members) return NextResponse.json({ error: 'No members found' }, { status: 404 });
  return NextResponse.json(members);
}


