import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

type Props = { params: { id: string } };

export default async function EditUserPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.organizationId !== session.user.organizationId) redirect('/admin/users');

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit User</h1>

      {/* Profile edit form - posts to your API route, handle server-side */}
      <form action={`/api/admin/users/${user.id}`} method="post" className="space-y-4">
        {/* If your API expects PATCH, handle the method on the server or accept POST with _method */}
        <input type="hidden" name="_action" value="updateProfile" />

        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" className="w-full border rounded p-2" defaultValue={user.name ?? ''} />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" className="w-full border rounded p-2" defaultValue={user.email ?? ''} />
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select name="role" className="w-full border rounded p-2" defaultValue={user.role}>
            <option value="WORKER">Worker</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="HEALTH_OWNER">Health Owner</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-brand text-white rounded"
            /* server form submit — server should handle update */
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>

        {/* Server-side change password form.
            Posts to the same API endpoint but with a different _action so the server can handle it. */}
        <form action={`/api/admin/users/${user.id}`} method="post" className="space-y-4">
          <input type="hidden" name="_action" value="changePassword" />

          <div>
            <label htmlFor="adminNewPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              id="adminNewPassword"
              name="newPassword"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="adminConfirmNewPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              id="adminConfirmNewPassword"
              name="confirmNewPassword"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
