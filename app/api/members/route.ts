import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMonths, differenceInMonths } from 'date-fns';

const createMemberSchema = z.object({
  memberCode: z.string().min(5),
  name: z.string().min(2),
  dob: z.string(),
  gender: z.string().min(1),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyId: z.string().optional().nullable(),
  categoryID: z.string(),
  passportPhotoUrl: z.string().min(5, 'Passport photo URL is required'),
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
  let mainMember = null;
  if(data.isDependent){
    mainMember = await prisma.member.findUnique({
      where: { memberCode: data.memberCode.split('/')[0] },
      select: { endOfSubscription: true, status: true }
    });
    if(!mainMember){
      return NextResponse.json({ error: 'Main member not found for dependent' }, { status: 404 });
    }
  }

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
      categoryID: data.categoryID,
      isDependent: data.isDependent,
      familyRelationship: data.familyRelationship || null,
      endOfSubscription: data.isDependent && mainMember ? mainMember.endOfSubscription : addMonths(new Date(), 6),
      status: data.isDependent && mainMember ? mainMember.status : 'inactive',
    }
  });
  if (!member) return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });

  const period = differenceInMonths(member.endOfSubscription, new Date());

  // Run invoice creation and audit log in parallel (don't await audit log)
  const promises = [];
  
  if(!data.isDependent){
    const category = await prisma.category.findUnique({
      where: { id: data.categoryID },
      select: { price: true }
    });
    promises.push(
      prisma.invoice.create({
        data: {
          organizationId: session.user.organizationId,
          memberId: member.id,
          amount: Number(category?.price || 0) * period,
          period: period,
        }
      })
    );
  }
  
  // Fire and forget audit log
  prisma.auditLog.create({
    data: {
      organizationId,
      action: 'member_create',
      entityType: 'Member',
      entityId: member.id,
      after: member
    }
  }).catch(() => {});

  await Promise.all(promises);
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
  if (q) {
    where.OR = [
      { name: { contains: q} },
      { memberCode: { contains: q} }
    ];
  }
  
  // Use select instead of include for better performance
  // Only fetch what's needed
  try {
    const members = await prisma.member.findMany({ 
      where,
      select: {
        id: true,
        name: true,
        memberCode: true,
        passportPhotoUrl: true,
        status: true,
        createdAt: true,
        isDependent: true,
        familyRelationship: true,
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            coveragePercent: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit for performance
    });
    
    // Return empty array if no members found, not an error
    return NextResponse.json(members.map((m: any) => ({
      ...m,
      coveragePercent: m.category?.coveragePercent ?? null,
      companyName: m.company?.name ?? null,
      companyId: m.company?.id ?? null
    })));
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch members' }, { status: 500 });
  }
}
