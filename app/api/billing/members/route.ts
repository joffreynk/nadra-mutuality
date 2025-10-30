import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stat } from 'fs';

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
  where.AND = { isDependent: false, status: 'Inactive' };
  const members = await prisma.member.findMany({ 
    where,
    include: { company: true, category: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!members) return NextResponse.json({ error: 'No members found' }, { status: 404 });
  return NextResponse.json(members.map((m: any) => ({
    name: m.name, memberCode: m.memberCode,id: m.id,
    include: { company: { select: { id: true, name: true } }},
    category: { select: { id: true, name: true, coveragePercent: true, price: true } },
  })));
}

