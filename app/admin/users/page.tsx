import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');

  const users = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link href="/admin/users/new" className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">Add User</Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">User List</h2>
        {users.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">No users yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{u.name ?? '-'}</td>
                    <td className="py-2 pr-4">{u.username}</td>
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.role}</td>
                    <td className="py-2 pr-4">{u.isLocked ? 'Locked' : 'Active'}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/admin/users/${u.id}/edit`} className="px-3 py-1 border rounded mr-2">Edit</Link>
                      <Link href={`/admin/users/${u.id}/delete`} className="px-3 py-1 border rounded text-red-600">Delete</Link>
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