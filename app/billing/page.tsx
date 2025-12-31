import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { bifFormatter } from '@/lib/utils';

async function BillingStats() {
  const session = await auth();
  if (!session) return null;
  
  const organizationId = session.user.organizationId;
  const [pending, overdue, paid, amount, recent] = await Promise.all([
    prisma.invoice.count({ where: { organizationId, status: 'Pending' } }),
    prisma.invoice.count({ where: { organizationId, status: 'Overdue' } }),
    prisma.invoice.count({ where: { organizationId, status: 'Paid' } }),
    prisma.invoice.findMany({ where: { organizationId, status: 'paid' }, select:{amount: true} }),
    prisma.invoice.findMany({ 
      where: { organizationId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 10, 
      select: { id: true, member: { select: { name: true } }, period: true, amount: true, status: true, createdAt: true } 
    }),
  ]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Total Revenue</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{bifFormatter.format(amount.reduce((acc:any, curr:any) => acc + Number(curr.amount), 0))}</p>
          <p className="text-xs sm:text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Pending Invoices</h3>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600">{pending}</p>
          <p className="text-xs sm:text-sm text-gray-600">Awaiting payment</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Overdue Invoices</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{overdue}</p>
          <p className="text-xs sm:text-sm text-gray-600">Past due</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Paid Invoices</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{paid}</p>
          <p className="text-xs sm:text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Invoices</h2>
        {recent.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">No invoices found. Start by creating invoices for your members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-2 sm:pr-4">Member</th>
                  <th className="py-2 pr-2 sm:pr-4">Months</th>
                  <th className="py-2 pr-2 sm:pr-4">Total</th>
                  <th className="py-2 pr-2 sm:pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv:any) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-2 sm:pr-4">{inv?.member?.name || '—'}</td>
                    <td className="py-2 pr-2 sm:pr-4">{inv.period ?? '-'}</td>
                    <td className="py-2 pr-2 sm:pr-4">{bifFormatter.format(inv.amount)}</td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default async function BillingPage() {
  const session = await auth();
  
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Billing & Invoices</h1>
        <Link 
          href="/billing/new" 
          className="w-full sm:w-auto bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Create Invoice
        </Link>
      </div>
      
      <p className="text-sm sm:text-base text-gray-600">
        Generate invoices, track payments, and manage billing for members.
      </p>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <BillingStats />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 text-sm sm:text-base">
            <Link href="/billing/new" className="block text-brand hover:text-brand-dark py-1">
              Create New Invoice
            </Link>
            <Link href="/billing/bulk" className="block text-brand hover:text-brand-dark py-1">
              Bulk Invoice Generation
            </Link>
            <Link href="/billing/payments" className="block text-brand hover:text-brand-dark py-1">
              Record Payments
            </Link>
            <Link href="/billing/reports" className="block text-brand hover:text-brand-dark py-1">
              Billing Reports
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Billing Statistics</h3>
          <div className="space-y-2 text-sm sm:text-base text-gray-600">
            <p>Total Outstanding: <span className="font-semibold">$0</span></p>
            <p>Average Payment Time: <span className="font-semibold">-</span></p>
            <p>Collection Rate: <span className="font-semibold">-</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
