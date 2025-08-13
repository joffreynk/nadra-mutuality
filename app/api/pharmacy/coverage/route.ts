import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ memberId: z.string(), medicineId: z.string(), quantity: z.number().int().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { memberId, medicineId, quantity } = parsed.data;
  const [member, medicine] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId } }),
    prisma.medicine.findUnique({ where: { id: medicineId } })
  ]);
  if (!member || !medicine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const price = Number(medicine.price as any) * quantity;
  const covered = Math.round((price * member.coveragePercent) / 100);
  const copay = price - covered;
  return NextResponse.json({ price, covered, copay, coveragePercent: member.coveragePercent });
}


