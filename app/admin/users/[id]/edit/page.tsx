import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { RoleType } from '@prisma/client';
import { useState } from 'react';

export default async function EditUserPage(props: any) {
  const { params } = props as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.organizationId !== session.user.organizationId) redirect('/admin/users');

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit User</h1>
      <form action={`/api/admin/users/${user.id}`} method="post" className="space-y-4">
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
          <button formAction={`/api/admin/users/${user.id}`} formMethod="post" className="px-4 py-2 bg-brand text-white rounded">Save Changes</button>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <ChangeUserPassword userId={user.id} />
      </div>
    </div>
  );
}

interface ChangeUserPasswordProps {
  userId: string;
}

function ChangeUserPassword({ userId }: ChangeUserPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}` , {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmNewPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(data.message || 'Password changed successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="adminNewPassword" className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          id="adminNewPassword"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="adminConfirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input
          type="password"
          id="adminConfirmNewPassword"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <button
        type="submit"
        className="w-full bg-brand text-white py-2 px-4 rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        disabled={loading}
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
}


