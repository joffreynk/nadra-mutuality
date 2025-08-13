import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RoleType } from '@prisma/client';

const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['WORKER', 'PHARMACY', 'HOSPITAL'])
});

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const users = await prisma.user.findMany({ where: { organizationId: session.user.organizationId } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username }, ...(parsed.data.email ? [{ email: parsed.data.email }] : [])] as any }
  });
  if (existing) return NextResponse.json({ error: 'Username or email exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      email: parsed.data.email ?? `${parsed.data.username}@example.local`,
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role as RoleType
    }
  });

  await prisma.auditLog.create({
    data: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      action: 'user_create',
      entityType: 'User',
      entityId: user.id,
      after: { ...user, passwordHash: '[HIDDEN]' }
    }
  });

  return NextResponse.json(user);
}


