import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const settingsSchema = z.object({
  systemName: z.string().min(2),
  phoneNumber: z.string().min(5).max(50),
  email: z.string().email(),
  location: z.string().min(2).max(100),
  logo: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const settings = await prisma.systemSetting.findUnique({ where: { organizationId: session.user.organizationId } });
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(json);
  console.log('PASSED',parsed);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  
  const organizationId = session.user.organizationId;
  const updated = await prisma.systemSetting.upsert({
    where: { organizationId },
    create: { organizationId, ...parsed.data },
    update: parsed.data
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: 'settings_update',
      entityType: 'SystemSetting',
      entityId: updated.id,
      after: updated
    }
  });

  return NextResponse.json(updated);
}


