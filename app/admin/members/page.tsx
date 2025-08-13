import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminMembersPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Member Management</h1>
        <Link 
          href="/admin/members/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Add New Member
        </Link>
      </div>
      
      <p className="text-gray-600">
        View and manage all insurance members across your organization.
      </p>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Member List</h2>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">No members found. Start by adding your first member.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/members/new" className="block text-brand hover:text-brand-dark">
              Create New Member
            </Link>
            <Link href="/admin/members/import" className="block text-brand hover:text-brand-dark">
              Import Members (CSV)
            </Link>
            <Link href="/admin/members/export" className="block text-brand hover:text-brand-dark">
              Export Member Data
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Total Members: <span className="font-semibold">0</span></p>
            <p>Active Members: <span className="font-semibold">0</span></p>
            <p>Pending Members: <span className="font-semibold">0</span></p>
            <p>Expired Members: <span className="font-semibold">0</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
