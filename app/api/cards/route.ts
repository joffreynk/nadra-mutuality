import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const issueCardSchema = z.object({
  memberId: z.string().optional(),
  dependentId: z.string().optional(),
  number: z.string().min(4)
}).refine((data) => !!data.memberId || !!data.dependentId, { message: 'Either memberId or dependentId is required' });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = issueCardSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, dependentId, number } = parsed.data;

  const card = await prisma.card.create({
    data: { organizationId, memberId: memberId ?? null, dependentId: dependentId ?? null, number }
  });
  await prisma.auditLog.create({ data: { organizationId, userId: session.user.id, action: 'card_issue', entityType: 'Card', entityId: card.id, after: card } });
  return NextResponse.json(card);
}


