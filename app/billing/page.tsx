import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';
import { bifFormatter } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default async function BillingPage() {
  const session = await auth();
  
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  const organizationId = session.user.organizationId;
  const [pending, overdue, paid, amount, recent] = await Promise.all([
    prisma.invoice.count({ where: { organizationId, status: 'Pending' } }),
    prisma.invoice.count({ where: { organizationId, status: 'Overdue' } }),
    prisma.invoice.count({ where: { organizationId, status: 'Paid' } }),
    prisma.invoice.findMany({ where: { organizationId, status: 'paid' }, select:{amount: true} }),
    prisma.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, member: { select: { name: true } }, period: true, amount: true, status: true } }),
  ]);  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing & Invoices</h1>
        <Link 
          href="/billing/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Create Invoice
        </Link>
      </div>
      
      <p className="text-gray-600">
        Generate invoices, track payments, and manage billing for members.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{bifFormatter.format(amount.reduce((acc:any, curr:any) => acc + Number(curr.amount), 0))}</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Pending Invoices</h3>
          <p className="text-3xl font-bold text-orange-600">{pending}</p>
          <p className="text-sm text-gray-600">Awaiting payment</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Overdue Invoices</h3>
          <p className="text-3xl font-bold text-red-600">{overdue}</p>
          <p className="text-sm text-gray-600">Past due</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Paid Invoices</h3>
          <p className="text-3xl font-bold text-blue-600">{paid}</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
        {recent.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">No invoices found. Start by creating invoices for your members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Member</th>
                  <th className="py-2 pr-4">Paid Months</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv:any) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{inv?.member?.name}</td>
                    <td className="py-2 pr-4">{inv.period ?? '-'} </td>
                    <td className="py-2 pr-4">{bifFormatter.format(inv.amount)}</td>
                    <td className="py-2 pr-4">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/billing/new" className="block text-brand hover:text-brand-dark">
              Create New Invoice
            </Link>
            <Link href="/billing/bulk" className="block text-brand hover:text-brand-dark">
              Bulk Invoice Generation
            </Link>
            <Link href="/billing/payments" className="block text-brand hover:text-brand-dark">
              Record Payments
            </Link>
            <Link href="/billing/reports" className="block text-brand hover:text-brand-dark">
              Billing Reports
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Billing Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Invoices Created Today: <span className="font-semibold">{recent.filter((r:any) => new Date(r.createdAt).toDateString() === new Date().toDateString()).length}</span></p>
            <p>Total Outstanding: <span className="font-semibold">$0</span></p>
            <p>Average Payment Time: <span className="font-semibold">-</span></p>
            <p>Collection Rate: <span className="font-semibold">-</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
