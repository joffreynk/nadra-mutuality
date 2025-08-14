import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const issueCardSchema = z.object({
  memberId: z.string().optional(),
  dependentId: z.string().optional(),
  number: z.string().min(1)
}).refine((data) => !!data.memberId || !!data.dependentId, { message: 'Either memberId or dependentId is required' });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = issueCardSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, dependentId } = parsed.data;
  // Number should use member mainId; for dependent, use their parent's mainId
  let number = '';
  if (memberId) {
    const m = await prisma.member.findUnique({ where: { id: memberId } });
    if (!m) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    number = m.mainId;
  } else if (dependentId) {
    const d = await prisma.dependent.findUnique({ where: { id: dependentId }, include: { childMember: true } });
    if (!d) return NextResponse.json({ error: 'Dependent not found' }, { status: 404 });
    number = d.mainId; // dependent has own ID like Nadra0005/1
  }

  const card = await prisma.card.create({
    data: { organizationId, memberId: memberId ?? null, dependentId: dependentId ?? null, number },
    include: { member: true, dependent: true }
  });
  await prisma.auditLog.create({ data: { organizationId, userId: session.user.id, action: 'card_issue', entityType: 'Card', entityId: card.id, after: card } });
  return NextResponse.json(card);
}


