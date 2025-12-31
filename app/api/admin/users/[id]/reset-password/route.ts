import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = resetPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, organizationId: true, username: true, email: true, role: true }
  });

  if (!user || user.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash, failedLogins: 0, isLocked: false },
  });

  // Fire and forget audit log
  prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: session.user.id,
      action: 'user_password_reset',
      entityType: 'User',
      entityId: user.id,
      before: { username: user.username, email: user.email, role: user.role, passwordHash: '[OLD_HIDDEN]' },
      after: { username: user.username, email: user.email, role: user.role, passwordHash: '[NEW_HIDDEN]' },
    },
  }).catch(() => {});

  return NextResponse.json({ message: 'Password reset successfully' });
}

