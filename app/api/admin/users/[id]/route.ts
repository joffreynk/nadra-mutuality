import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const updateSchema = z.object({ name: z.string().optional(), email: z.string().email().optional(), role: z.enum(['WORKER','PHARMACY','HOSPITAL','HEALTH_OWNER']).optional() });
const changePasswordAdminSchema = z.object({
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmNewPassword: z.string().min(6, "Confirm new password must be at least 6 characters long"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

export async function POST(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const json = await req.formData();
  const data = Object.fromEntries(json.entries());
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const user = await prisma.user.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.redirect(new URL('/admin/users', req.url));
}

export async function PATCH(req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const json = await req.json();
  const parsed = changePasswordAdminSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newPasswordHash },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: user.organizationId,
      userId: session.user.id,
      action: 'admin_user_password_change',
      entityType: 'User',
      entityId: user.id,
      before: { username: user.username, email: user.email, role: user.role, passwordHash: '[OLD_HIDDEN]' },
      after: { username: user.username, email: user.email, role: user.role, passwordHash: '[NEW_HIDDEN]' },
    },
  });

  return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
}

export async function DELETE(_req: Request, context: any) {
  const { params } = context as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


