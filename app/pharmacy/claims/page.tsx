import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PharmacyClaimsPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'PHARMACY') redirect('/');
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pharmacy Claims</h1>
        <Link href="/pharmacy/claims/new" className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">New Claim</Link>
      </div>
      <div className="bg-white p-6 rounded border shadow">
        <p className="text-sm text-gray-600">Use New Claim to select a date range and compile dispensed medicines into a claim.</p>
      </div>
    </div>
  );
}

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ClaimsClient from './view';
export const runtime = 'nodejs';

export default async function ClaimsPage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'PHARMACY' && session.user?.role !== 'HEALTH_OWNER')) redirect('/');
  return <ClaimsClient />;
}
 
