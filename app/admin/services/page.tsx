import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminServicesClient from './servicesClient';

export default async function AdminServicesPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminServicesClient />
    </Suspense>
  );
}
