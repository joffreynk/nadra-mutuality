import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const categorySchema = z.object({
  name: z.string().min(1),
  coveragePercent: z.number().min(0).max(100).default(80),
  price: z.number().min(1).default(0)
});

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.category.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const created = await prisma.category.create({ data: { organizationId: session.user.organizationId, ...parsed.data } });
  return NextResponse.json(created);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.json();
  const id = json?.data?.id;
  delete json.data.id;
  const parsed = categorySchema.safeParse({name: json.data.name, coveragePercent: json.data.coveragePercent, price: Number(json.data.price)});
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


