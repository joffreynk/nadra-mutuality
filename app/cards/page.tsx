import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export default async function CardsPage() {
  const session = await auth();
  
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  const organizationId = session.user.organizationId;
  const [total, active, expired, pending] = await Promise.all([
    prisma.card.count({ where: { organizationId } }),
    prisma.card.count({ where: { organizationId, status: 'Active' } }),
    prisma.card.count({ where: { organizationId, status: 'Expired' } }),
    prisma.card.count({ where: { organizationId, status: 'Pending' } })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Card Management</h1>
        <Link 
          href="/cards/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Issue New Card
        </Link>
      </div>
      
      <p className="text-gray-600">
        Issue and manage insurance cards for members.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Total Cards</h3>
          <p className="text-3xl font-bold text-blue-600">{total}</p>
          <p className="text-sm text-gray-600">Issued</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Active Cards</h3>
          <p className="text-3xl font-bold text-green-600">{active}</p>
          <p className="text-sm text-gray-600">Valid</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Expired Cards</h3>
          <p className="text-3xl font-bold text-red-600">{expired}</p>
          <p className="text-sm text-gray-600">Need renewal</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Pending Cards</h3>
          <p className="text-3xl font-bold text-orange-600">{pending}</p>
          <p className="text-sm text-gray-600">In process</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Card List</h2>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">No cards found. Start by issuing cards for your members.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/cards/new" className="block text-brand hover:text-brand-dark">
              Issue New Card
            </Link>
            <Link href="/cards/renew" className="block text-brand hover:text-brand-dark">
              Renew Expired Cards
            </Link>
            <Link href="/cards/replace" className="block text-brand hover:text-brand-dark">
              Replace Lost Cards
            </Link>
            <Link href="/cards/export" className="block text-brand hover:text-brand-dark">
              Export Card Data
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Card Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Cards Issued Today: <span className="font-semibold">0</span></p>
            <p>Cards Expiring This Week: <span className="font-semibold">0</span></p>
            <p>Cards Expiring This Month: <span className="font-semibold">0</span></p>
            <p>Replacement Requests: <span className="font-semibold">0</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
