import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CategoriesClient from './view';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

export default async function CategoriesPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');
  const categories = await prisma.category.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: 'asc' } });
  return <CategoriesClient initial={categories} />;
}


