import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const medicineSchema = z.object({ code: z.string().min(1), name: z.string().min(2), price: z.coerce.number() });

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const where: any = { organizationId: session.user.organizationId };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const rows = await prisma.medicine.findMany({ where, orderBy: { name: 'asc' }, take: 20 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = medicineSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  // Enforce unique by name in org
  const exists = await prisma.medicine.findFirst({ where: { organizationId: session.user.organizationId, name: { equals: parsed.data.name, mode: 'insensitive' } } });
  if (exists) return NextResponse.json(exists);
  const code = parsed.data.code || parsed.data.name.replace(/[^A-Za-z0-9]+/g, '-').toUpperCase().slice(0, 16);
  const row = await prisma.medicine.create({ data: { organizationId: session.user.organizationId, ...parsed.data, code, price: parsed.data.price as any } });
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = medicineSchema.extend({ id: z.string() }).safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { id, ...data } = parsed.data as any;
  const row = await prisma.medicine.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.medicine.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


