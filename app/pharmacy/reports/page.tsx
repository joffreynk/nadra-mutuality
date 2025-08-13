import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReportsClient from './view';

export default async function PharmacyReportsPage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'PHARMACY' && session.user?.role !== 'HEALTH_OWNER')) redirect('/');
  return <ReportsClient />;
}


