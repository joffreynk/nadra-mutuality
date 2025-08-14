import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const where: any = { organizationId: session.user.organizationId, providerType: 'hospital' };
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  const rows = await prisma.treatment.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

const createClaimSchema = z.object({ periodStart: z.string(), periodEnd: z.string() }).refine((d) => new Date(d.periodStart) <= new Date(d.periodEnd), { message: 'Invalid range' });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = createClaimSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { periodStart, periodEnd } = parsed.data;

  const last = await prisma.claim.findFirst({ where: { organizationId: session.user.organizationId }, orderBy: { periodEnd: 'desc' } });
  const now = new Date();
  const ps = new Date(periodStart);
  const pe = new Date(periodEnd);
  if (last && ps <= (last as any).periodEnd) return NextResponse.json({ error: 'Start date must be after last claimed end date' }, { status: 400 });
  if (pe > now) return NextResponse.json({ error: 'End date cannot be in the future' }, { status: 400 });

  const claim = await prisma.claim.create({ data: { organizationId: session.user.organizationId, periodStart: ps, periodEnd: pe, state: 'Submitted' } });
  return NextResponse.json(claim);
}


