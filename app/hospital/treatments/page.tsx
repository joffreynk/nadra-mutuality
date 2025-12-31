'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';

// Lightweight JSON fetch helper
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ----- Types -----
interface TreatmentItemDTO {
  id: string;
  treatmentName: string;
  quantity: number;
  unitPrice: string | number;
}

interface TreatmentDTO {
  id: string;
  memberId: string;
  member?: { id: string; name: string; memberCode?: string };
  receiptUrl?: string | null;
  treatments?: TreatmentItemDTO[];
  createdAt?: string;
  user?: { id: string; name: string; email: string };
}

interface HospitalOption { id: string; name: string }

// Utility to build query URLs
function buildUrl(base: string, params: Record<string, any>) {
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

export default function AdminTreatments() {
  const [query, setQuery] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [treatments, setTreatments] = useState<TreatmentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TreatmentDTO | null>(null);
  const [servicesForMember, setServicesForMember] = useState<{ name: string; qty: number; amount: number }[] | null>(null);

  async function loadHospitals() {
    try {
      const data = await fetchJson('/api/admin/hospitals');
      setHospitals(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore silently — admin endpoint may not exist yet
    }
  }

  async function load() {
    setError(null); 
    setLoading(true);
    try {
      const params: any = {};
      if (query) params.q = query;
      if (hospitalId) params.hospitalId = hospitalId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const url = buildUrl('/api/hospital/treatments', params);
      const data = await fetchJson(url);
      setTreatments(Array.isArray(data) ? data : []);
    } catch (e: any) { 
      setError(e.message || String(e)); 
    }
    finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    loadHospitals(); 
    load(); 
  }, []);

  const rows = useMemo(() => treatments.map(t => ({
    id: t.id,
    date: t.createdAt ? new Date(t.createdAt).toLocaleString() : '—',
    member: t.member?.name ?? '—',
    memberCode: t.member?.memberCode ?? '—',
    items: t.treatments?.length ?? 0,
    user: { id: t.user?.id ?? '—', name: t.user?.name ?? '—', email: t.user?.email ?? '—' },
    total: t.treatments ? t.treatments.reduce((s, it) => s + (Number(it.unitPrice) * (it.quantity || 1)), 0) : 0,
    receiptUrl: t.receiptUrl ?? null,
  })), [treatments]);

  return (
    <div className="w-full p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Treatments</h1>
        <Link 
          href="/hospital/treatments/new" 
          className="w-full sm:w-auto bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          New Treatment
        </Link>
      </div>
      
      <Card>
        <CardContent className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4">
          <Input 
            placeholder="Search by member, code, or treatment id" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-[200px] text-sm sm:text-base"
          />
          <select 
            value={hospitalId} 
            onChange={e => setHospitalId(e.target.value)} 
            className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All hospitals</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <label className="text-xs sm:text-sm text-gray-600">Start</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="text-xs sm:text-sm text-gray-600">End</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={load} disabled={loading} className="text-sm sm:text-base">
            {loading ? 'Loading…' : 'Apply'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => { 
              setQuery(''); 
              setHospitalId(''); 
              setStartDate(''); 
              setEndDate(''); 
              load(); 
            }}
            className="text-sm sm:text-base"
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Treatments</h3>
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

          <div className="overflow-x-auto mt-2">
            <table className="w-full table-auto border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="p-2">Date</th>
                  <th className="p-2">Treatment ID</th>
                  <th className="p-2">Member</th>
                  <th className="p-2 hidden sm:table-cell">Hospital</th>
                  <th className="p-2"># Items</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && (
                  <tr><td className="p-4 text-sm text-gray-500 text-center" colSpan={7}>No treatments found.</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-2 align-top">{r.date}</td>
                    <td className="p-2 align-top font-mono text-xs">{r.id.slice(0, 8)}</td>
                    <td className="p-2 align-top">
                      <div className="font-medium">{r.member}</div>
                      <div className="text-xs text-gray-500">{r.memberCode}</div>
                    </td>
                    <td className="p-2 align-top hidden sm:table-cell">{r?.user?.name ?? '—'}</td>
                    <td className="p-2 align-top">{r.items}</td>
                    <td className="p-2 align-top font-semibold">{r.total.toFixed(2)}</td>
                    <td className="p-2 align-top">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Button 
                          size="sm"
                          onClick={async () => { 
                            try { 
                              const payload = await fetchJson(`/api/hospital/treatments/${r.id}`); 
                              setSelected(payload); 
                            } catch (err:any) { 
                              setError(err.message || String(err)); 
                            } 
                          }}
                          className="text-xs"
                        >
                          View
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={async () => { 
                            if (!confirm('Delete this treatment?')) return; 
                            try { 
                              await fetchJson(`/api/hospital/treatments/${r.id}`, { method: 'DELETE' }); 
                              setTreatments(prev => prev.filter(t => t.id !== r.id)); 
                            } catch (err:any) { 
                              setError(err.message || String(err)); 
                            } 
                          }}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {servicesForMember && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setServicesForMember(null); }}>
          <DialogContent className="max-w-md">
            <h3 className="text-lg font-semibold">Services for member</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full table-auto text-xs sm:text-sm">
                <thead><tr className="text-xs text-gray-600 border-b"><th className="p-1">Service</th><th className="p-1">Qty</th><th className="p-1">Amount</th></tr></thead>
                <tbody>
                  {servicesForMember.map(s => (
                    <tr key={s.name} className="border-b">
                      <td className="p-1">{s.name}</td>
                      <td className="p-1">{s.qty}</td>
                      <td className="p-1">{s.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4"><Button variant="secondary" onClick={() => setServicesForMember(null)}>Close</Button></div>
          </DialogContent>
        </Dialog>
      )}

      {selected && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setSelected(null); }}>
          <DialogTitle>Member: {selected.member?.name ?? '—'}</DialogTitle>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold">Treatment {selected.id}</h3>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div>Member: {selected.member?.name ?? '—'}</div>
              <div>Created: {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Items</h4>
              <div className="overflow-x-auto mt-2">
                <table className="w-full table-auto text-xs sm:text-sm">
                  <thead><tr className="text-xs text-gray-600 border-b"><th className="p-1">Name</th><th className="p-1">Qty</th><th className="p-1">Unit</th><th className="p-1">Amount</th></tr></thead>
                  <tbody>
                    {selected.treatments?.map(it => (
                      <tr key={it.id} className="border-b">
                        <td className="p-1">{it.treatmentName}</td>
                        <td className="p-1">{it.quantity}</td>
                        <td className="p-1">{Number(it.unitPrice).toFixed(2)}</td>
                        <td className="p-1">{(Number(it.unitPrice) * (it.quantity || 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.receiptUrl && (
                <a className="text-blue-700 underline text-sm" href={selected.receiptUrl} target="_blank" rel="noreferrer">
                  Open receipt
                </a>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Link href={`/hospital/treatments/${selected.id}`} className="text-blue-700 underline text-sm">
                Edit
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
