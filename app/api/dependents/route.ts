import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createDependentSchema = z.object({
  parentMemberId: z.string(),
  name: z.string().min(2),
  relationship: z.string().min(2),
  dob: z.string(),
  passportPhotoId: z.string(),
  passportPhotoUrl: z.string().url(),
  document: z.object({ filename: z.string(), mimeType: z.string(), size: z.number(), cloudinaryId: z.string() }).optional()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = createDependentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { parentMemberId, name, relationship, dob, passportPhotoId, passportPhotoUrl, document } = parsed.data;
  const dependent = await prisma.$transaction(async (tx) => {
    const parent = await tx.member.findUnique({ where: { id: parentMemberId } });
    if (!parent) throw new Error('Parent member not found');
    // Compute dependent mainId as ParentMainId/n where n is next sequence
    const existing = await tx.dependent.count({ where: { parentMemberId } });
    const mainId = `${parent.mainId}/${existing + 1}`;
    // Create a member record for the dependent (regular member under a parent)
    const childMember = await tx.member.create({
      data: {
        organizationId,
        mainId,
        name,
        dob: new Date(dob),
        passportPhotoId,
        passportPhotoUrl,
        category: parent.category,
        coveragePercent: parent.coveragePercent,
        contact: parent.contact,
        address: parent.address,
        email: parent.email,
        country: parent.country,
        companyName: parent.companyName,
        paidBy: parent.paidBy,
        status: 'Active'
      }
    });
    const d = await tx.dependent.create({
      data: { organizationId, parentMemberId, childMemberId: childMember.id, mainId }
    });
    if (document) {
      await tx.document.create({
        data: {
          organizationId,
          ownerType: 'Dependent',
          ownerId: d.id,
          filename: document.filename,
          mimeType: document.mimeType,
          size: document.size,
          cloudinaryId: document.cloudinaryId
        }
      });
    }
    return d;
  });
  await prisma.auditLog.create({
    data: { organizationId, userId: session.user.id, action: 'dependent_create', entityType: 'Dependent', entityId: dependent.id, after: dependent }
  });
  return NextResponse.json(dependent);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const dependents = await prisma.dependent.findMany({ where: { organizationId } });
  return NextResponse.json(dependents);
}


