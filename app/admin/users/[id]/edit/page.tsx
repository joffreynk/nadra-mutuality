import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditUserClient from './editClient';

type Props = { params: { id: string } };

export default async function EditUserPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');

  const user = await prisma.user.findUnique({ 
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      organizationId: true,
    }
  });
  
  if (!user || user.organizationId !== session.user.organizationId) {
    redirect('/admin/users');
  }

  return <EditUserClient user={user} />;
}
