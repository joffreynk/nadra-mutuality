import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const claimSchema = z.object({ memberId: z.string(), details: z.string().min(3), amount: z.number().nonnegative() });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const claims = await prisma.claim.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(claims);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = claimSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, details, amount } = parsed.data;
  const claim = await prisma.claim.create({
    data: { organizationId: session.user.organizationId, memberId, details, amount: amount as any, state: 'Submitted' }
  });
  return NextResponse.json(claim);
}


