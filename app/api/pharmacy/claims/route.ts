import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// List dispensed requests for reporting (source data for claims)
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('memberId') || undefined;
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  // If any filter is present, return requests; otherwise, return claims
  if (memberId || from || to) {
    const where: any = { organizationId: session.user.organizationId };
    if (memberId) where.memberId = memberId;
    if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
    const rows = await prisma.pharmacyRequest.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows);
  } else {
    const claims = await prisma.claim.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(claims);
  }
}

// Claim endpoints for pharmacy: create/list claims which are now date-range reports (no per-member field)
const createClaimSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string()
}).refine((data) => new Date(data.periodStart) <= new Date(data.periodEnd), { message: 'Invalid period range' });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = createClaimSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { periodStart, periodEnd } = parsed.data;

  // Prevent exceeding previous/current claim dates: last claim's periodEnd < new periodStart, and periodEnd <= now
  const last = await prisma.claim.findFirst({ where: { organizationId: session.user.organizationId }, orderBy: { periodEnd: 'desc' } });
  const now = new Date();
  const ps = new Date(periodStart);
  const pe = new Date(periodEnd);
  if (last && ps <= (last as any).periodEnd) return NextResponse.json({ error: 'Start date must be after last claimed end date' }, { status: 400 });
  if (pe > now) return NextResponse.json({ error: 'End date cannot be in the future' }, { status: 400 });

  const claim = await prisma.claim.create({
    data: { organizationId: session.user.organizationId, periodStart: ps, periodEnd: pe, state: 'Submitted' }
  });
  return NextResponse.json(claim);
}


