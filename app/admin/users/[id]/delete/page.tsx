import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DeleteUserPage(props: any) {
  const { params } = props as { params: { id: string } };
  const session = await auth();
  if (!session || session.user?.role !== 'HEALTH_OWNER') redirect('/');
  return (
    <form action={`/api/admin/users/${params.id}`} method="post" className="max-w-md">
      <h1 className="text-2xl font-semibold mb-4">Delete User</h1>
      <p className="mb-6">Are you sure you want to delete this user?</p>
      <button formAction={`/api/admin/users/${params.id}`} formMethod="delete" className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
    </form>
  );
}


