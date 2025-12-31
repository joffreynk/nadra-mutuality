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
  
  const organizationId = session.user.organizationId;
  
  // Use database aggregation instead of fetching all records
  // Get unique user IDs who have treatments (for HOSPITAL) - using distinct
  const [hospitalUsers, pharmacyUsers, allUsers] = await Promise.all([
    prisma.treatment.findMany({
      where: { organizationId },
      select: { usercreator: true },
      distinct: ['usercreator'],
    }),
    prisma.pharmacyRequest.findMany({
      where: { organizationId },
      select: { usercreator: true },
      distinct: ['usercreator'],
    }),
    prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['HOSPITAL', 'PHARMACY'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
    }),
  ]);

  const hasTreatment = new Set(hospitalUsers.map(t => t.usercreator).filter(Boolean));
  const hasMedicine = new Set(pharmacyUsers.map(p => p.usercreator).filter(Boolean));

  // Filter users: HOSPITAL must have treatments, PHARMACY must have pharmacy requests
  const filtered = allUsers.filter(u => {
    if (u.role === 'HOSPITAL') return hasTreatment.has(u.id);
    if (u.role === 'PHARMACY') return hasMedicine.has(u.id);
    return false;
  });

  return NextResponse.json(filtered);
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
    where: { 
      OR: [
        { username: parsed.data.username },
        ...(parsed.data.email ? [{ email: parsed.data.email }] : [])
      ] as any 
    }
  });
  if (existing) return NextResponse.json({ error: 'Username or email exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name ?? parsed.data.username,
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
