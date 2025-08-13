import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HospitalClaimsPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HOSPITAL') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <Link 
          href="/hospital/claims/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Submit New Claim
        </Link>
      </div>
      
      <p className="text-gray-600">
        Submit and track treatment claims for members.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Total Claims</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-600">Submitted</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Approved Claims</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
          <p className="text-sm text-gray-600">Processed</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Pending Claims</h3>
          <p className="text-3xl font-bold text-orange-600">0</p>
          <p className="text-sm text-gray-600">Under review</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Rejected Claims</h3>
          <p className="text-3xl font-bold text-red-600">0</p>
          <p className="text-sm text-gray-600">This month</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Recent Claims</h2>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">No claims found. Start by submitting claims for treatments provided.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/hospital/claims/new" className="block text-brand hover:text-brand-dark">
              Submit New Claim
            </Link>
            <Link href="/hospital/claims/bulk" className="block text-brand hover:text-brand-dark">
              Bulk Claim Submission
            </Link>
            <Link href="/hospital/claims/track" className="block text-brand hover:text-brand-dark">
              Track Claim Status
            </Link>
            <Link href="/hospital/claims/history" className="block text-brand hover:text-brand-dark">
              Claim History
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Claim Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Claims Submitted Today: <span className="font-semibold">0</span></p>
            <p>Average Processing Time: <span className="font-semibold">0 days</span></p>
            <p>Approval Rate: <span className="font-semibold">0%</span></p>
            <p>Total Amount Claimed: <span className="font-semibold">$0</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
