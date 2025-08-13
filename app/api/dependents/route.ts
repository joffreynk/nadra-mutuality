import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createDependentSchema = z.object({
  memberId: z.string(),
  name: z.string().min(2),
  relationship: z.string().min(2),
  dob: z.string()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = createDependentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { memberId, name, relationship, dob } = parsed.data;
  const dependent = await prisma.dependent.create({
    data: { organizationId, memberId, name, relationship, dob: new Date(dob) }
  });
  await prisma.auditLog.create({
    data: { organizationId, userId: session.user.id, action: 'dependent_create', entityType: 'Dependent', entityId: dependent.id, after: dependent }
  });
  return NextResponse.json(dependent);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const dependents = await prisma.dependent.findMany({ where: { organizationId } });
  return NextResponse.json(dependents);
}


