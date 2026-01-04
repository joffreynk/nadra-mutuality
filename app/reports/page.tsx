import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
      <p className="text-sm sm:text-base text-gray-600">
        View member activity reports and analytics for your organization.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Member Growth</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">0</p>
          <p className="text-xs sm:text-sm text-gray-600">New this month</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Active Members</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">0</p>
          <p className="text-xs sm:text-sm text-gray-600">Current total</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm sm:text-base font-semibold mb-2">Renewal Rate</h3>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">0%</p>
          <p className="text-xs sm:text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Member Activity Chart</h2>
        <div className="p-6 sm:p-8 bg-gray-50 rounded text-center">
          <p className="text-sm sm:text-base text-gray-600">Activity chart will be displayed here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Top Performing Categories</h3>
          <div className="space-y-2 text-sm sm:text-base text-gray-600">
            <p>No data available yet</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Recent Activity</h3>
          <div className="space-y-2 text-sm sm:text-base text-gray-600">
            <p>No recent activity</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Export Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button className="p-4 border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium text-sm sm:text-base">Member Report</p>
              <p className="text-xs sm:text-sm text-gray-600">CSV Export</p>
            </div>
          </button>
          <button className="p-4 border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <p className="font-medium text-sm sm:text-base">Card Report</p>
              <p className="text-xs sm:text-sm text-gray-600">PDF Export</p>
            </div>
          </button>
          <button className="p-4 border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <p className="font-medium text-sm sm:text-base">Billing Report</p>
              <p className="text-xs sm:text-sm text-gray-600">Excel Export</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
