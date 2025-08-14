'use client';
import { useRouter, useParams } from 'next/navigation';

export default function DeleteMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  async function confirmDelete() {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/members');
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Delete Member</h1>
      <p className="mb-4">Are you sure you want to delete this member?</p>
      <div className="flex gap-2">
        <button className="border rounded px-4 py-2" onClick={() => router.back()}>Cancel</button>
        <button className="bg-red-600 text-white rounded px-4 py-2" onClick={confirmDelete}>Delete</button>
      </div>
    </div>
  );
}


