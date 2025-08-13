import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ClaimsClient from './view';
export const runtime = 'nodejs';

export default async function ClaimsPage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'PHARMACY' && session.user?.role !== 'HEALTH_OWNER')) redirect('/');
  return <ClaimsClient />;
}
 
