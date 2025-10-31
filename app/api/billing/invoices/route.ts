import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMonths } from 'date-fns';


const invoiceLineItemSchema = z.object({
  memberId: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
});
const invoiceSchema = z.object({
  ids: z.array(invoiceLineItemSchema),
  period: z.number().nonnegative(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = invoiceSchema.safeParse(json);

  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { ids, period } = parsed.data;
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Invoice must have at least one line item' }, { status: 400 });
  }
  for (const item of ids) {
    if (item.memberId) {
      const member = await prisma.member.findUnique({ where: { id: item.memberId } });
      if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    const invoice = await prisma.invoice.create({
    data: {
      organizationId: session.user.organizationId,
      memberId: item.memberId ?? null,
      amount: item.amount,
      period: period,
    }
  });

  if (invoice){
    await prisma.member.updateMany({
      where: {
        OR: [
      {
        memberCode: { equals: member.memberCode }
      },
      {
        memberCode: { startsWith: member.memberCode.concat('/') }
      }
    ]
      },
      data: {status: 'active', endOfSubscription: addMonths(new Date(), invoice.period)}
    })
  }
    }
  }
  
  return NextResponse.json('invoice created successfully');
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const json = await req.json();
  const { id } = json;
  if (!id) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const updated = await prisma.invoice.update({ where: { id }, data: { status: 'paid' } });
  const member = await prisma.member.findUnique({ where: { id: updated.memberId! } });
  if (member) {
    await prisma.member.updateMany({
      where: { memberCode: { startsWith: member.memberCode } },
      data: { status: 'active', endOfSubscription: addMonths(new Date(), updated.period) }
    });
  } else{
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}


