import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminFinancialsPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Reports</h1>
      <p className="text-gray-600">
        View revenue, billing reports, and financial analytics for your organization.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">$0</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600">Current members</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Pending Payments</h3>
          <p className="text-3xl font-bold text-orange-600">$0</p>
          <p className="text-sm text-gray-600">Overdue invoices</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Claims Paid</h3>
          <p className="text-3xl font-bold text-purple-600">$0</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Revenue Trends</h2>
        <div className="p-8 bg-gray-50 rounded text-center">
          <p className="text-gray-600">Revenue chart will be displayed here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Top Revenue Sources</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>No revenue data available yet</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>No transactions found</p>
          </div>
        </div>
      </div>
    </div>
  );
}
