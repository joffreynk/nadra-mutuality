import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const partnerSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  contact: z.string().optional().nullable(),
  services: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = session.user.organizationId;
  const json = await req.json();
  const parsed = partnerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const partner = await prisma.partner.create({
    data: {
      organizationId,
      name: parsed.data.name,
      type: parsed.data.type,
      contact: parsed.data.contact ?? undefined,
      services: parsed.data.services ?? undefined
    }
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: 'partner_create',
      entityType: 'Partner',
      entityId: partner.id,
      after: partner
    }
  });

  return NextResponse.json(partner);
}


