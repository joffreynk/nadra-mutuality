import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const itemSchema = z.object({ hospitalServiceId: z.string(), quantity: z.number().int().min(1), unitPrice: z.number().optional() });
const treatmentSchema = z.object({ memberId: z.string(), items: z.array(itemSchema).min(1) });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.treatment.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = treatmentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, items } = parsed.data;
  const created = await prisma.treatment.create({
    data: {
      organizationId,
      memberId,
      providerType: 'hospital',
      items: {
        create: items.map((it) => ({ hospitalServiceId: it.hospitalServiceId, quantity: it.quantity, unitPrice: (it.unitPrice ?? null) as any }))
      }
    },
    include: { items: true }
  });
  return NextResponse.json(created);
}


