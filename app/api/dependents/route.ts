import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createDependentSchema = z.object({
  parentMemberId: z.string(),
  name: z.string().min(2),
  relationship: z.string().min(2),
  dob: z.string(),
  passportPhotoUrl: z.string().url(),
  document: z.object({ filename: z.string(), mimeType: z.string(), size: z.number(), url: z.string() }).optional(),
  memberCode: z.string(), // Changed from mainId to memberCode
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = createDependentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { parentMemberId, name, relationship, dob, passportPhotoUrl, document, memberCode } = parsed.data;
  const dependent = await prisma.$transaction(async (tx) => {
    const parent = await tx.member.findUnique({ where: { id: parentMemberId } });
    if (!parent) throw new Error('Parent member not found');
    // Create a member record for the dependent (regular member under a parent)
    const childMember = await tx.member.create({
      data: {
        organizationId,
        memberCode,
        name,
        dob: new Date(dob),
        passportPhotoUrl,
        isDependent: true,
        categoryID: parent.categoryID,
        contact: parent.contact,
        address: parent.address,
        email: parent.email,
        country: parent.country,
        companyId: parent.companyId,
        status: 'Active',
      }
    });
    if (document) {
      await tx.document.create({
        data: {
          organizationId,
          ownerType: 'Dependent',
          ownerId: childMember.id,
          filename: document.filename,
          mimeType: document.mimeType,
          size: document.size,
          url: document.url,
        }
      });
    }
    return childMember;
  });
  await prisma.auditLog.create({
    data: { organizationId, userId: session.user.id, action: 'dependent_create', entityType: 'Dependent', entityId: dependent.id, after: dependent }
  });
  return NextResponse.json(dependent);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  const members = await prisma.member.findMany({
    where: {
      organizationId,
      isDependent: false,
      OR: [
        { name: { contains: q } },
        { memberCode: { contains: q } }
      ]
    },
    select: { id: true, name: true, memberCode: true },
    take: 10,
  });
  return NextResponse.json(members);
}


