import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const invoiceSchema = z.object({
  memberId: z.string().nullable().optional(),
  period: z.number().nonnegative()
})

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = invoiceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, companyId, periodStart, periodEnd, amount } = parsed.data;
  if (!memberId && !companyId) {
    return NextResponse.json({ error: 'Invoice must have either member or company' }, { status: 400 });
  }
  if (memberId) {
    // Ensure we don't bill dependents directly by mistake. We only store memberId for main members.
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }
  const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.user.organizationId,
      memberId: memberId ?? null,
      companyId: companyId ?? null,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      amount: amount as any
    }
  });
  return NextResponse.json(invoice);
}

export async function PUT(req: Request) {
  // Mark invoice as completed
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = await prisma.invoice.update({ where: { id }, data: { status: 'Completed' } });
  return NextResponse.json(updated);
}


