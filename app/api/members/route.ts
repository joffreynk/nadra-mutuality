import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createMemberSchema = z.object({
  memberCode: z.string().min(5), // Changed from mainId
  name: z.string().min(2),
  dob: z.string(),
  gender: z.string().min(1),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyId: z.string().optional().nullable(),
  category: z.string(),
  coveragePercent: z.number().min(0).max(100),
  passportPhotoUrl: z.string().min(5, 'Passport photo URL is required'),
  dependentProofUrl: z.string().optional().nullable(),
  isDependent: z.boolean().default(false),
  familyRelationship: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  
  const json = await req.json();
  
  const parsed = createMemberSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  
  const data = parsed.data;
  
  if (data.isDependent && !data.familyRelationship) {
    return NextResponse.json({ error: 'Relationship is required for dependent members' }, { status: 400 });
  }
  console.log(organizationId);

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
      coveragePercent: data.coveragePercent,
      isDependent: data.isDependent,
      familyRelationship: data.familyRelationship || null,
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
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const where: any = { organizationId };
  if (q) where.OR = [
    { name: { contains: q, } },
    { memberCode: { contains: q,} }
  ];
  const members = await prisma.member.findMany({ 
    where,
    include: { company: true },
    orderBy: { createdAt: 'desc' }
  });  
  if (!members) return NextResponse.json({ error: 'No members found' }, { status: 404 });
  return NextResponse.json(members.map((m: any) => ({
    ...m,
    companyName: m.company?.name ?? null,
    companyId: m.company?.id ?? null
  })));
}


