import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

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
          <button formAction={`/api/admin/users/${user.id}`} formMethod="post" className="px-4 py-2 bg-brand text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}


