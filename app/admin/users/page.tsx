import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isLocked: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Users</h1>
        <Link 
          href="/admin/users/new" 
          className="w-full sm:w-auto bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Add User
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User List</h2>
        {users.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">No users yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="py-2 pr-2 sm:pr-4">Name</th>
                  <th className="py-2 pr-2 sm:pr-4">Username</th>
                  <th className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">Email</th>
                  <th className="py-2 pr-2 sm:pr-4">Role</th>
                  <th className="py-2 pr-2 sm:pr-4">Status</th>
                  <th className="py-2 pr-2 sm:pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-2 sm:pr-4">{u.name ?? '-'}</td>
                    <td className="py-2 pr-2 sm:pr-4 font-medium">{u.username}</td>
                    <td className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">{u.email}</td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.role === 'HEALTH_OWNER' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'HOSPITAL' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'PHARMACY' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.isLocked ? 'Locked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Link href={`/admin/users/${u.id}/edit`} className="text-brand underline text-xs sm:text-sm">Edit</Link>
                        <Link href={`/admin/users/${u.id}/delete`} className="text-red-600 underline text-xs sm:text-sm">Delete</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
