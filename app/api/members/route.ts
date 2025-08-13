import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createMemberSchema = z.object({
  mainId: z.string().min(3),
  name: z.string().min(2),
  dob: z.string(),
  contact: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  category: z.string().min(2),
  coveragePercent: z.number().min(0).max(100)
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = createMemberSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const data = parsed.data;
  const organizationId = (session as any).organizationId as string | null;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const member = await prisma.member.create({
    data: {
      organizationId,
      mainId: data.mainId,
      name: data.name,
      dob: new Date(data.dob),
      contact: data.contact,
      address: data.address,
      idNumber: data.idNumber,
      category: data.category,
      coveragePercent: data.coveragePercent
    }
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      action: 'member_create',
      entityType: 'Member',
      entityId: member.id,
      after: member
    }
  });

  return NextResponse.json(member);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).organizationId as string | null;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const members = await prisma.member.findMany({ where: { organizationId } });
  return NextResponse.json(members);
}


