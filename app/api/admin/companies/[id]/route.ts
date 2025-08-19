import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const companyId = params.id;
  const company = await prisma.company.findUnique({ where: { id: companyId, organizationId } });
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  return NextResponse.json(company);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const companyId = params.id;
  const json = await req.json();
  const parsed = updateCompanySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const existingCompany = await prisma.company.findUnique({ where: { id: companyId, organizationId } });
  if (!existingCompany) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  const company = await prisma.company.update({
    where: { id: companyId },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      action: 'company_update',
      entityType: 'Company',
      entityId: company.id,
      before: existingCompany,
      after: company,
    },
  });

  return NextResponse.json(company);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const companyId = params.id;
  const existingCompany = await prisma.company.findUnique({ where: { id: companyId, organizationId } });
  if (!existingCompany) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Check if there are any members or invoices associated with this company
  const membersCount = await prisma.member.count({ where: { companyId } });
  const invoicesCount = await prisma.invoice.count({ where: { companyId } });

  if (membersCount > 0 || invoicesCount > 0) {
    return NextResponse.json({ error: 'Cannot delete company with associated members or invoices.' }, { status: 400 });
  }

  const company = await prisma.company.delete({ where: { id: companyId } });

  await prisma.auditLog.create({
    data: {
      organizationId,
      action: 'company_delete',
      entityType: 'Company',
      entityId: company.id,
      before: company,
    },
  });

  return NextResponse.json({ message: 'Company deleted successfully' });
}
