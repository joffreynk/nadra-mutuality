import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const organizationId = session.user.organizationId;
  const createdAt: any = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };

  const [treatments, pharmacy] = await Promise.all([
    prisma.treatment.findMany({ where: { organizationId, createdAt, status: { not: 'Deleted' } as any }, include: { items: true, member: true } }),
    prisma.pharmacyRequest.findMany({ where: { organizationId, createdAt, status: { not: 'Deleted' } as any }, include: { items: true, member: true } })
  ]);

  const map = new Map<string, any>();
  const ensure = (memberId: string, memberName: string, mainId?: string, companyName?: string) => {
    if (!map.has(memberId)) map.set(memberId, { memberId, memberName, mainId, companyName, treatmentCount: 0, pharmacyCount: 0, items: 0 });
    return map.get(memberId);
  };

  for (const t of treatments) {
    const row = ensure(t.memberId, t.member?.name || 'Member', (t.member as any)?.mainId, (t.member as any)?.companyName);
    row.treatmentCount += 1;
    row.items += t.items.length;
  }
  for (const r of pharmacy) {
    const row = ensure(r.memberId, r.member?.name || 'Member', (r.member as any)?.mainId, (r.member as any)?.companyName);
    row.pharmacyCount += 1;
    row.items += r.items.length;
  }

  return NextResponse.json(Array.from(map.values()).sort((a, b) => a.memberName.localeCompare(b.memberName)));
}


