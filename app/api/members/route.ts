import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createMemberSchema = z.object({
  mainId: z.string().min(3),
  name: z.string().min(2),
  dob: z.string(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  category: z.string().min(2),
  coveragePercent: z.number().min(0).max(100),
  passportPhotoId: z.string(),
  passportPhotoUrl: z.string().url()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await req.json();
  const parsed = createMemberSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const organizationId = (session as any).organizationId as string | null;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  // Auto-generate mainId if not provided: Nadra0001 style
  let mainId = data.mainId;
  if (!mainId) {
    const count = await prisma.member.count({ where: { organizationId } });
    mainId = `Nadra${(count + 1).toString().padStart(4, '0')}`;
  }

  const member = await prisma.member.create({
    data: {
      organizationId,
      mainId,
      name: data.name,
      dob: new Date(data.dob),
      gender: data.gender,
      email: data.email,
      contact: data.contact,
      address: data.address,
      idNumber: data.idNumber,
      country: data.country,
      companyName: data.companyName,
      passportPhotoId: data.passportPhotoId,
      passportPhotoUrl: data.passportPhotoUrl,
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

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).organizationId as string | null;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const company = searchParams.get('company') || undefined;
  const where: any = { organizationId };
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { mainId: { contains: q, mode: 'insensitive' } },
    { companyName: { contains: q, mode: 'insensitive' } }
  ];
  if (company) where.companyName = { contains: company, mode: 'insensitive' };
  const members = await prisma.member.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(members);
}


