'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/members?q=${encodeURIComponent(id)}`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find((m: any) => m.id === id);
        setForm(found);
      }
      setLoading(false);
    })();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { setError('Failed to save'); return; }
    router.push('/members');
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Not found</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Member</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded p-2 w-full" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" className="border rounded p-2 w-full" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Category</label>
            <input className="border rounded p-2 w-full" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Coverage %</label>
            <input type="number" className="border rounded p-2 w-full" value={form.coveragePercent || 0} onChange={(e) => setForm({ ...form, coveragePercent: Number(e.target.value) })} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="border rounded px-4 py-2" onClick={() => router.back()}>Cancel</button>
          <button className="bg-brand text-white rounded px-4 py-2">Save</button>
        </div>
      </form>
    </div>
  );
}


