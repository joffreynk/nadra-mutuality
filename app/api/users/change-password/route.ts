import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmNewPassword: z.string().min(6, "Confirm new password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await req.json();
  const parsed = changePasswordSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'User not found or password not set' }, { status: 404 });
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      action: 'user_password_change',
      entityType: 'User',
      entityId: user.id,
      before: { username: user.username, email: user.email, role: user.role, passwordHash: '[OLD_HIDDEN]' },
      after: { username: user.username, email: user.email, role: user.role, passwordHash: '[NEW_HIDDEN]' },
    },
  });

  return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
}
