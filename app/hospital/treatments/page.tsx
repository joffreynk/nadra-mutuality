import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TreatmentsClient from './view';
export const runtime = 'nodejs';

export default async function TreatmentsPage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'HOSPITAL' && session.user?.role !== 'HEALTH_OWNER')) redirect('/');
  return <TreatmentsClient />;
}


