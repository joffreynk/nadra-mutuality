// app/receipts/page.tsx
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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptDTO[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [combining, setCombining] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<'approved' | 'created'>('approved');

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/receipts?mode=${mode}`);
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'Invalid response');
      setReceipts(j.receipts || []);
      // reset selection
      setSelected({});
    } catch (e:any) {
      console.error(e);
      setErr(e?.message ?? 'Failed to load receipts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [mode]);

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
    if (ids.length === 0) { alert('Select at least one receipt'); return; }
    setCombining(true); setErr(null);
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
    } catch (e:any) {
      console.error(e);
      setErr(e?.message ?? 'Combine failed');
    } finally { setCombining(false); }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-4">
        <h1 className="text-xl font-semibold">My Receipts</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-xs">Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="approved">Approved (I approved items)</option>
              <option value="created">Created (I generated receipts)</option>
            </select>
          </div>
          <Button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
        </div>
      </div>

      {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {receipts.length === 0 && !loading && <div className="col-span-full text-sm text-gray-500">No receipts found.</div>}

        {receipts.map(r => (
          <Card key={r.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Receipt #{r.id}</div>
                  <div className="text-xs text-gray-600">{r.request?.member?.name ?? 'Member unknown'}</div>
                  <div className="text-xs text-gray-500">Request: {r.pharmacyRequestId ?? (r.request?.id ?? '—')}</div>
                  <div className="text-xs text-gray-500">Created: {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <input type="checkbox" checked={!!selected[r.id]} onChange={() => toggle(r.id)} />
                  <div className="text-xs text-right">{(r.request?.items ?? []).length} item(s)</div>
                </div>
              </div>

              <div className="space-y-1">
                {(r.request?.items || []).map(it => (
                  <div key={it.id} className="flex items-center justify-between gap-2 border rounded p-2">
                    <div>
                      <div className="font-medium">{it.mdecineName}</div>
                      <div className="text-xs text-gray-500">{it.quantity} × {it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '—'}</div>
                    </div>
                    <div className="text-xs text-gray-600">{it.approver?.name ?? ''}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">Receipt file</div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => window.open(r.url, '_blank')}>Open</Button>
                  <a className="text-sm text-blue-600 underline" href={r.url} target="_blank" rel="noreferrer">Download</a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={openSelected} disabled={Object.values(selected).every(v => !v)}>Open selected</Button>
        <Button variant="secondary" onClick={combineSelected} disabled={Object.values(selected).every(v => !v) || combining}>
          {combining ? 'Combining…' : 'Combine selected into one PDF'}
        </Button>
        <Button variant="ghost" onClick={() => { setSelected({}); }}>Clear selection</Button>
      </div>
    </div>
  );
}
