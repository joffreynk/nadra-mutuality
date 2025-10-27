import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  name: z.string().min(2),
  dob: z.date().optional(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().min(3, 'Address is required'),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  categoryID: z.string().min(4, 'Category ID is required'),
  passportPhotoId: z.string().optional(),
  passportPhotoUrl: z.string().min(3).optional(),
  dependentProofUrl: z.string().optional().nullable(), // Add this line
  isDependent: z.boolean().optional(), // Add this line
  relationship: z.string().optional(), // Add this line
  status: z.string().optional()
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();

  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const json = await req.json();
  delete json.createdAt;
  delete json.updatedAt;
  delete json.organizationId;
  delete json.memberCode;
  delete json.id;

  json.dob = new Date(json.dob);


  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  if (parsed.success) {
    const data = parsed.data;

    if (data.isDependent && !data.relationship) {
      // Check if isDependent is explicitly set to true and relationship is missing
      return NextResponse.json({ error: 'Relationship is required for dependent members' }, { status: 400 });
    }
  }
  
  const before = await prisma.member.findFirst({ where: { id: params.id, organizationId } });
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!before.isDependent){
    const updated = await prisma.member.update({ where: { id: params.id }, data: { ...parsed.data } });
    await prisma.member.updateMany({ where: { organizationId, memberCode: {startsWith: updated.memberCode.concat('/') } }, data: { categoryID: updated.categoryID, companyId: updated.companyId } });
    await prisma.auditLog.create({ data: { organizationId, userId: session.user.id, action: 'member_update', entityType: 'Member', entityId: updated.id, before, after: updated } });
    return NextResponse.json(updated);
  } else {
    if (before.categoryID !== parsed.data.categoryID) {
      return NextResponse.json({ error: 'Cannot change category of a dependent member' }, { status: 400 });
    }else {
      const updated = await prisma.member.update({ where: { id: params.id }, data: { ...parsed.data } });
      await prisma.auditLog.create({ data: { organizationId, userId: session.user.id, action: 'member_update', entityType: 'Member', entityId: updated.id, before, after: updated } });
      return NextResponse.json(updated);
    }
  }
  
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const member = await prisma.member.findFirst({ where: { id: params.id, organizationId } });
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(member);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const before = await prisma.member.findFirst({ where: { id: params.id, organizationId } });
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.member.update({ where: { id: params.id }, data: { deletedAt: new Date(), status: 'Deleted' } });
  if(!before.isDependent){
    await prisma.member.updateMany({ where: { organizationId, memberCode: {startsWith: before.memberCode.concat('/') } }, data: { status: 'Deleted' } });
  }
  await prisma.auditLog.create({ data: { organizationId, userId: session.user.id, action: 'member_delete', entityType: 'Member', entityId: params.id, before, after: { ...before, status: 'Deleted' } } });
  return NextResponse.json({ ok: true });
}


