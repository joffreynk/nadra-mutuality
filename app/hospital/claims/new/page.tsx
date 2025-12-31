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
    if (res.ok) setItems(await res.json());
    else setItems([]);
  }

  async function submit() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/hospital/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: from, periodEnd: to })
      });
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
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Create Claim (Hospital)</h1>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button
            className="w-full sm:w-auto border rounded px-4 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            onClick={load}
          >
            Preview
          </button>
        </div>
        <div className="bg-white rounded border p-4 sm:p-6 shadow-sm">
          <h2 className="font-medium mb-2 text-sm sm:text-base">Services in Range</h2>
          {items.length === 0 ? (
            <p className="text-sm text-gray-600">No services found.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {items.map((t: any) => (
                <li key={t.id} className="border-b pb-1 last:border-0">
                  #{t.id.slice(0, 8)} • {new Date(t.createdAt).toLocaleString()} • Items: {t.items?.length || t.treatments?.length || 0} • Total: {t.totalAmount ?? 0}
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            className="flex-1 sm:flex-none px-4 py-2 border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            className="flex-1 sm:flex-none px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Submitting…' : 'Submit Claim'}
          </button>
        </div>
      </div>
    </div>
  );
}
