import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createCompanySchema = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const json = await req.json();
  const parsed = createCompanySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const company = await prisma.company.create({
    data: { ...parsed.data, organizationId },
  });

  // Don't await audit log - fire and forget for performance
  prisma.auditLog.create({
    data: {
      organizationId,
      action: 'company_create',
      entityType: 'Company',
      entityId: company.id,
      after: company,
    },
  }).catch(() => {}); // Silent fail for audit log

  return NextResponse.json(company);
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
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phoneNumber: { contains: q } },
    ];
  }

  // Use select instead of returning all fields
  const companies = await prisma.company.findMany({
    where,
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
    take: 100, // Limit results for performance
  });
  
  return NextResponse.json(companies);
}
