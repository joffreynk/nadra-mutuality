'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ReceiptDTO = {
  id: string;
  url: string;
  createdAt: string;
  pharmacyRequestId?: string;
  request?: {
    id: string;
    member?: { id?: string; name?: string; memberCode?: string } | null;
    creator?: { id?: string; name?: string } | null;
    items?: Array<{ id: string; mdecineName: string; quantity: number; unitPrice: number | null; status: string; approver?: { id?: string; name?: string } | null }>;
  } | null;
};

export default function HospitalReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptDTO[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [combining, setCombining] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'approved' | 'created'>('created');

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/hospital/receipts?mode=${mode}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load receipts');
      }
      const data = await res.json();
      setReceipts(Array.isArray(data) ? data : []);
      setSelected({});
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [mode]);

  function toggle(id: string) {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function openSelected() {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return;
    const sel = receipts.filter(r => ids.includes(r.id));
    for (const r of sel) {
      window.open(r.url, '_blank');
    }
  }

  async function combineSelected() {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) {
      alert('Select at least one receipt');
      return;
    }
    setCombining(true);
    setErr(null);
    try {
      const res = await fetch('/api/receipts/combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptIds: ids }),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Failed to combine');
      window.open(j.url, '_blank');
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? 'Combine failed');
    } finally {
      setCombining(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">My Receipts</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs sm:text-sm">Mode</label>
            <select
              value={mode}
              onChange={e => setMode(e.target.value as any)}
              className="border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="approved">Approved (I approved items)</option>
              <option value="created">Created (I generated receipts)</option>
            </select>
          </div>
          <Button
            onClick={load}
            disabled={loading}
            className="text-sm sm:text-base"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {receipts.length === 0 && !loading && (
          <div className="col-span-full text-sm text-gray-500 text-center p-4">No receipts found.</div>
        )}

        {receipts.map(r => (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm sm:text-base">Receipt #{r.id.slice(0, 8)}</div>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">{r.request?.member?.name ?? 'Member unknown'}</div>
                  <div className="text-xs text-gray-500">Request: {r.pharmacyRequestId ?? (r.request?.id?.slice(0, 8) ?? '—')}</div>
                  <div className="text-xs text-gray-500">Created: {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-2">
                  <input
                    type="checkbox"
                    checked={!!selected[r.id]}
                    onChange={() => toggle(r.id)}
                    className="cursor-pointer"
                  />
                  <div className="text-xs text-right">{(r.request?.items ?? []).length} item(s)</div>
                </div>
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(r.request?.items || []).map(it => (
                  <div key={it.id} className="flex items-center justify-between gap-2 border rounded p-2 text-xs sm:text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.mdecineName}</div>
                      <div className="text-xs text-gray-500">{it.quantity} × {it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '—'}</div>
                    </div>
                    <div className="text-xs text-gray-600">{it.approver?.name ?? ''}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="text-xs sm:text-sm text-gray-600">Receipt file</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(r.url, '_blank')}
                    className="text-xs sm:text-sm"
                  >
                    Open
                  </Button>
                  <a
                    className="text-xs sm:text-sm text-blue-600 underline"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={openSelected}
          disabled={Object.values(selected).every(v => !v)}
          className="text-sm sm:text-base"
        >
          Open selected
        </Button>
        <Button
          variant="secondary"
          onClick={combineSelected}
          disabled={Object.values(selected).every(v => !v) || combining}
          className="text-sm sm:text-base"
        >
          {combining ? 'Combining…' : 'Combine selected into one PDF'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => { setSelected({}); }}
          className="text-sm sm:text-base"
        >
          Clear selection
        </Button>
      </div>
    </div>
  );
}
