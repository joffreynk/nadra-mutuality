import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createMemberSchema = z.object({
  memberCode: z.string().min(5), // Changed from mainId
  name: z.string().min(2),
  dob: z.string(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyId: z.string().optional().nullable(),
  category: z.string(),
  coveragePercent: z.number().min(0).max(100),
  passportPhotoUrl: z.string(),
  dependentProofUrl: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  console.log('organization error', organizationId);
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  
  const json = await req.json();
  const parsed = createMemberSchema.safeParse(json);
  console.log('parse data', parsed);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  console.log('Parsed data', data);

  const member = await prisma.member.create({
    data: {
      organizationId,
      memberCode: data.memberCode,
      name: data.name,
      dob: new Date(data.dob),
      gender: data.gender,
      email: data.email,
      contact: data.contact,
      address: data.address,
      idNumber: data.idNumber,
      country: data.country,
      companyId: data.companyId,
      passportPhotoUrl: data.passportPhotoUrl,
      dependentProofUrl: data.dependentProofUrl,
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
  const where: any = { organizationId };
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { memberCode: { contains: q, mode: 'insensitive' } }
  ];
  const members = await prisma.member.findMany({ 
    where,
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(members.map(m => ({
    ...m,
    companyName: m.company?.name ?? null
  })));
}


