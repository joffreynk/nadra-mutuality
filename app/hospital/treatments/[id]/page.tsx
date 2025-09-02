// components/EditTreatment.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useParams } from 'next/navigation';

// Zod schemas (mirror server)
const ItemSchema = z.object({
  id: z.string().optional(),
  treatmentName: z.string().min(1, 'Name required'),
  quantity: z.number().int().min(1, 'Quantity must be >= 1'),
  unitPrice: z.number().nonnegative('Unit price must be >= 0'),
});
const BodySchema = z.object({
  treatmentItems: z.array(ItemSchema).min(1, 'Add at least one item'),
  regenReceipt: z.boolean().optional(),
});

type Item = z.infer<typeof ItemSchema>;

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

function makeLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function EditTreatment() {
  const { id } = useParams();
  if (!id) throw new Error('Missing treatment ID');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treatmentItems, setTreatmentItems] = useState<Item[]>([]);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [regenReceipt, setRegenReceipt] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const t = await fetchJson(`/api/hospital/treatments/${encodeURIComponent(`${id}`)}`);
        // t.treatments is the items array
        const items = (t.treatments || []).map((it: any) => ({
          id: it.id,
          treatmentName: it.treatmentName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
        }));
        setTreatmentItems(items.length ? items : [{ id: undefined, treatmentName: '', quantity: 1, unitPrice: 0 }]);
        setMemberName(t.member?.name ?? null);
      } catch (e: any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setTreatmentItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }
  function addItem() {
    setTreatmentItems(prev => [...prev, { id: undefined, treatmentName: '', quantity: 1, unitPrice: 0 }]);
  }
  function removeItem(idx: number) {
    setTreatmentItems(prev => prev.filter((_, i) => i !== idx));
  }

  const totals = useMemo(() => {
    const cents = treatmentItems.reduce((s, it) => {
      const unit = Math.round((Number(it.unitPrice) || 0) * 100);
      const qty = Math.max(0, Math.floor(it.quantity || 0));
      return s + unit * qty;
    }, 0);
    return { total: cents / 100 };
  }, [treatmentItems]);

  async function handleSave() {
    setError(null);
    try {
      // convert input types (zod expects numbers)
      const payload = {
        treatmentItems: treatmentItems.map(it => ({
          id: it.id,
          treatmentName: String(it.treatmentName || '').trim(),
          quantity: Number(it.quantity || 0),
          unitPrice: Number(it.unitPrice || 0),
        })),
        regenReceipt,
      };
      BodySchema.parse(payload); // client-side validation (throws on invalid)
      setSaving(true);
      const res = await fetchJson(`/api/hospital/treatments/${encodeURIComponent(`${id}`)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // success: show some UI feedback — here we'll simply reload items from server
      if (res?.treatment?.treatments) {
        const items = res.treatment.treatments.map((it: any) => ({ id: it.id, treatmentName: it.treatmentName, quantity: it.quantity, unitPrice: Number(it.unitPrice) }));
        setTreatmentItems(items);
      }
    } catch (e: any) {
      if (e?.issues) {
        // zod client validation error
        setError(e.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; '));
      } else {
        setError(e.message || String(e));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Edit Treatment</h2>
              <div className="text-sm text-gray-600">Member: <span className="font-medium">{memberName ?? '—'}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={regenReceipt} onChange={e => setRegenReceipt(e.target.checked)} />
                <span>Regenerate receipt</span>
              </label>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>

          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {/* Items: responsive grid */}
          <div className="space-y-3">
            {treatmentItems.map((it, idx) => (
              <div key={it.id ?? `i-${idx}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center border rounded p-2">
                <div className="sm:col-span-6">
                  <Input placeholder="Service name" value={it.treatmentName} onChange={e => updateItem(idx, { treatmentName: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
                <div className="sm:col-span-2">
                  <Input type="number" min={0} step="0.01" value={it.unitPrice} onChange={e => updateItem(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
                <div className="sm:col-span-1 text-sm">
                  {(Number(it.unitPrice || 0) * (it.quantity || 0)).toFixed(2)}
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button onClick={() => removeItem(idx)} aria-label="Remove" className="p-2 rounded hover:bg-red-50 text-red-600">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={addItem}>+ Add service</Button>
              <Button variant="ghost" onClick={() => {
                // reset to a single blank line
                setTreatmentItems([{ id: undefined, treatmentName: '', quantity: 1, unitPrice: 0 }]);
              }}>Reset lines</Button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-semibold">{totals.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            This editor is responsive — stacked inputs on small screens and a compact row layout on larger devices.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
