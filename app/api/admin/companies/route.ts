import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import handleSession from '@/lib/sessionHandle';

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

  await prisma.auditLog.create({
    data: {
      organizationId,
      action: 'company_create',
      entityType: 'Company',
      entityId: company.id,
      after: company,
    },
  });

  return NextResponse.json(company);
}

export async function GET(req: Request) {

  const organizationId = await handleSession();
  console.log(organizationId);
  

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;

  const where: any = { organizationId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phoneNumber: { contains: q, mode: 'insensitive' } },
    ];
  }

  const companies = await prisma.company.findMany({ where, orderBy: { name: 'asc' } });
  return NextResponse.json(companies);
}
