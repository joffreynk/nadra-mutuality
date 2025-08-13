import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CoverageClient from './view';
export const runtime = 'nodejs';

export default async function CoveragePage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'PHARMACY' && session.user?.role !== 'HEALTH_OWNER')) redirect('/');
  return <CoverageClient />;
}
 
