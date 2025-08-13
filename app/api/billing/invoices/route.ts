import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const invoiceSchema = z.object({
  memberId: z.string().nullable().optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
  amount: z.number().nonnegative()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = invoiceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, periodStart, periodEnd, amount } = parsed.data;
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.user.organizationId,
      memberId: memberId ?? null,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      amount: amount as any
    }
  });
  return NextResponse.json(invoice);
}


