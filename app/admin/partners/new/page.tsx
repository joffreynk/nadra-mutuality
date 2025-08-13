'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPartnerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', type: 'Hospital', contact: '', services: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to create partner');
      router.push('/admin/partners');
    } catch (err) {
      setError('Failed to create partner');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Add New Partner</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select className="w-full border rounded p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Hospital</option>
            <option>Pharmacy</option>
            <option>Clinic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Contact</label>
          <input className="w-full border rounded p-2" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Services</label>
          <input className="w-full border rounded p-2" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save Partner'}</button>
        </div>
      </form>
    </div>
  );
}


