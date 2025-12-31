'use client';
import { useEffect, useState } from 'react';

export default function HospitalReportsClient() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    loadData();
  }, [from, to]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/hospital/treatments';
      if (from || to) {
        url += `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      }
      const r = await fetch(url);
      if (!r.ok) throw new Error('Failed to fetch treatments');
      const data = await r.json();
      setTreatments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const totalTreatments = treatments.length;
  const totalItems = treatments.reduce((acc, t) => acc + (t.items?.length || t.treatments?.length || 0), 0);
  const totalAmount = treatments.reduce((acc, t) => {
    const items = t.items || t.treatments || [];
    return acc + items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice || 0) * (it.quantity || 1)), 0);
  }, 0);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Hospital Reports</h1>
      
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="date"
          className="w-full sm:w-auto border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From date"
        />
        <input
          type="date"
          className="w-full sm:w-auto border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To date"
        />
        <button
          onClick={loadData}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-brand text-white rounded hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-sm sm:text-base"
        >
          {loading ? 'Loading…' : 'Apply'}
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Treatments</div>
          <div className="text-2xl sm:text-3xl font-bold">{totalTreatments}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Items</div>
          <div className="text-2xl sm:text-3xl font-bold">{totalItems}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-2xl sm:text-3xl font-bold">${totalAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Treatments</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading…</div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No treatments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {treatments.slice(0, 10).map((t: any) => (
                <div key={t.id} className="border rounded p-3 hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-sm sm:text-base">
                    {t.id.slice(0, 8)} • {new Date(t.createdAt).toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    Member: {t.member?.name || '—'} • Items: {t.items?.length || t.treatments?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
