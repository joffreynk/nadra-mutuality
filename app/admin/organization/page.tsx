import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminOrganizationPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organization Management</h1>
      <p className="text-gray-600">
        Manage your healthcare organization details and settings.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Organization Name</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              defaultValue={session.user?.organizationId ? "Your Organization" : ""}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization ID</label>
            <input 
              type="text" 
              className="w-full border rounded p-2 bg-gray-50" 
              value={session.user?.organizationId || "Not available"}
              disabled
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Organization Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600">Total Members</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600">Active Users</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-2xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600">Partners</p>
          </div>
        </div>
      </div>
    </div>
  );
}
