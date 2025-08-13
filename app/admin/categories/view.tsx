'use client';
import { useEffect, useState } from 'react';

type Category = { id: string; name: string; coveragePercent: number };

export default function CategoriesClient({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState('');
  const [coveragePercent, setCoveragePercent] = useState(80);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/admin/categories');
    if (res.ok) setCategories(await res.json());
  }

  async function createCategory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, coveragePercent })
      });
      if (!res.ok) throw new Error('Failed');
      setName('');
      setCoveragePercent(80);
      await refresh();
    } catch (e) {
      setError('Failed to create category');
    } finally {
      setLoading(false);
    }
  }

  async function updateCategory(id: string, data: Partial<Category>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (e) {
      setError('Failed to update category');
    } finally {
      setLoading(false);
    }
  }

  async function deleteCategory(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (e) {
      setError('Failed to delete category');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Create Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Coverage %</label>
            <input type="number" min={0} max={100} className="w-full border rounded p-2" value={coveragePercent} onChange={(e) => setCoveragePercent(Number(e.target.value))} />
          </div>
          <div className="flex items-end">
            <button onClick={createCategory} disabled={loading} className="px-4 py-2 bg-brand text-white rounded">{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Category List</h2>
        {categories.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-600">No categories yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Coverage %</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <input className="border rounded p-1" defaultValue={c.name} onBlur={(e) => updateCategory(c.id, { name: e.target.value })} />
                    </td>
                    <td className="py-2 pr-4">
                      <input type="number" min={0} max={100} className="border rounded p-1 w-24" defaultValue={c.coveragePercent} onBlur={(e) => updateCategory(c.id, { coveragePercent: Number(e.target.value) })} />
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => deleteCategory(c.id)} className="px-3 py-1 border rounded text-red-600">Delete</button>
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


