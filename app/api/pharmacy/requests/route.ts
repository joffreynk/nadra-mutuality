import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const itemSchema = z.object({ medicineId: z.string(), quantity: z.number().int().min(1) });
const requestSchema = z.object({ memberId: z.string(), items: z.array(itemSchema).min(1) });

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.pharmacyRequest.findMany({ where: { organizationId: session.user.organizationId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, items } = parsed.data;
  const created = await prisma.pharmacyRequest.create({
    data: { organizationId: session.user.organizationId, memberId, items: { create: items.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })) } },
    include: { items: true }
  });
  return NextResponse.json(created);
}


