'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewHospitalClaimPage() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setError(null);
    const res = await fetch(`/api/hospital/treatments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (res.ok) setItems(await res.json()); else setItems([]);
  }
  async function submit() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/hospital/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ periodStart: from, periodEnd: to }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to create claim');
      }
      router.push('/hospital/claims');
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Create Claim (Hospital)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="datetime-local" className="border rounded p-2" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="datetime-local" className="border rounded p-2" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="border rounded p-2" onClick={load}>Preview</button>
      </div>
      <div className="bg-white rounded border p-4">
        <h2 className="font-medium mb-2">Services in Range</h2>
        {items.length === 0 ? <p className="text-sm text-gray-600">No services found.</p> : (
          <ul className="text-sm space-y-1">
            {items.map((t: any) => (
              <li key={t.id}>#{t.id.slice(0,8)} • {new Date(t.createdAt).toLocaleString()} • Items: {t.items.length} • Total: {t.totalAmount ?? 0}</li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
        <button className="px-4 py-2 bg-brand text-white rounded" onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Submit Claim'}</button>
      </div>
    </div>
  );
}


