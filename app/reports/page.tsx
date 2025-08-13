import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      <p className="text-gray-600">
        View member activity reports and analytics for your organization.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Member Growth</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600">New this month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Active Members</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-sm text-gray-600">Current total</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Renewal Rate</h3>
          <p className="text-3xl font-bold text-purple-600">0%</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Member Activity Chart</h2>
        <div className="p-8 bg-gray-50 rounded text-center">
          <p className="text-gray-600">Activity chart will be displayed here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Top Performing Categories</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>No data available yet</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>No recent activity</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Export Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border rounded hover:bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium">Member Report</p>
              <p className="text-sm text-gray-600">CSV Export</p>
            </div>
          </button>
          <button className="p-4 border rounded hover:bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <p className="font-medium">Card Report</p>
              <p className="text-sm text-gray-600">PDF Export</p>
            </div>
          </button>
          <button className="p-4 border rounded hover:bg-gray-50">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <p className="font-medium">Billing Report</p>
              <p className="text-sm text-gray-600">Excel Export</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
