import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const partnerSchema = z.object({
  name: z.string().min(2),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
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
      contact: parsed.data.contact ?? undefined,
      phoneNumber: parsed.data.phoneNumber ?? undefined,
      email: parsed.data.email ?? undefined,
      address: parsed.data.address ?? undefined,
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

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const partners = await prisma.partner.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(partners);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const json = await req.json();
  const { id, ...rest } = json;
  const parsed = partnerSchema.partial().safeParse(rest);
  if (!parsed.success || !id) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const updated = await prisma.partner.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await prisma.partner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


