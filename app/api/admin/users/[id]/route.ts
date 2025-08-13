import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({ name: z.string().optional(), email: z.string().email().optional(), role: z.enum(['WORKER','PHARMACY','HOSPITAL','HEALTH_OWNER']).optional() });

export async function POST(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.formData();
  const data = Object.fromEntries(json.entries());
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const user = await prisma.user.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.redirect(new URL('/admin/users', req.url));
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


