import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const serviceSchema = z.object({ name: z.string().min(2), price: z.coerce.number().optional() });

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const where: any = { organizationId: session.user.organizationId };
  if (search) where.name = { contains: search, };
  const rows = await prisma.hospitalService.findMany({ where, orderBy: { name: 'asc' }, take: 20 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const json = await req.json();
  const parsed = serviceSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  // Enforce unique name in org
  
  const existing = await prisma.hospitalService.findFirst({ where: { organizationId, name: { contains: parsed.data.name } } });
  if (existing) return NextResponse.json(existing);
  const row = await prisma.hospitalService.create({ data: { organizationId, ...parsed.data} });
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = serviceSchema.extend({ id: z.string() }).safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { id, ...data } = parsed.data as any;
  const row = await prisma.hospitalService.update({ where: { id }, data });
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.hospitalService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


