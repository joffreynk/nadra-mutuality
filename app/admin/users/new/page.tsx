'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'WORKER' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to create user');
      router.push('/admin/users');
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Add New User</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="w-full border rounded p-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input className="w-full border rounded p-2" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="w-full border rounded p-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select className="w-full border rounded p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="WORKER">Worker</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="HOSPITAL">Hospital</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Saving...' : 'Save User'}</button>
        </div>
      </form>
    </div>
  );
}


