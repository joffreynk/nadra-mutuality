'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

function makeLocalId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

const ItemSchema = z.object({
  id: z.string().optional(),
  mdecineName: z.string().min(1, 'Name required'),
  quantity: z.coerce.number().int().min(1, 'Quantity >= 1'),
});
const UpdateRequestSchema = z.object({ items: z.array(ItemSchema).min(1, 'At least one item') });

type ItemRow = {
  id?: string | null;
  localId: string;
  mdecineName: string;
  quantity: number;
};

export default function RequestEditModal({
  requestId,
  initialItems,
  onClose,
  onSaved,
  savingLabel = 'Saving…'
}: {
  requestId: string;
  initialItems: any[]; // items from server
  onClose: () => void;
  onSaved?: (updated: any) => void;
  savingLabel?: string;
}) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mapped = (initialItems || []).map(i => ({
      id: i.id,
      localId: makeLocalId(),
      mdecineName: i.mdecineName ?? '',
      quantity: Number(i.quantity ?? 1),
    })) as ItemRow[];
    setItems(mapped.length ? mapped : [{ id: undefined, localId: makeLocalId(), mdecineName: '', quantity: 1 }]);
  }, [initialItems]);

  function update(iLocalId: string, patch: Partial<ItemRow>) {
    setItems(prev => prev.map(r => r.localId === iLocalId ? { ...r, ...patch } : r));
  }  
  function addRow() { setItems(prev => [...prev, { id: undefined, localId: makeLocalId(), mdecineName: '', quantity: 1 }]); }


  async function removeRow(localId: string) {
  const item = items.find(i => i.localId === localId);
  if (!item) return;
  const itemDbId = item.id ?? null;
  const cameFromServer = !!itemDbId && (initialItems || []).some(ii => String(ii.id) === String(itemDbId));
  if (cameFromServer) {
    setBusy(true);
    try {
      const res = await fetch(`/api/pharmacy/requests/${requestId}/items/${encodeURIComponent(String(itemDbId))}/status`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || 'Delete failed');
      }
    } catch (e: any) {
      console.error('Delete failed', e);
      setError(e?.message ?? 'Delete failed');
      setBusy(false);
      return;
    } finally {
      setBusy(false);
    }
  }
  setItems(prev => prev.filter(r => r.localId !== localId));
}


  async function handleSave() {
    setError(null);
    // prepare payload
    const payload = { items: items.map(it => ({ id: it.id, mdecineName: it.mdecineName.trim(), quantity: Number(it.quantity) })) };
    // client-side zod validation
    const parseRes = UpdateRequestSchema.safeParse(payload);
    if (!parseRes.success) {
      setError(parseRes.error.errors.map(e => e.message).join('; '));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/hospital/pharmacyRequests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || res.statusText);
      const json = JSON.parse(text);
      onSaved?.(json);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
      console.error(e);
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-lg">
        <div className="p-4 border-b gap-2 md:gap-4">
          <h3 className="text-lg font-semibold">Edit medicines</h3>
          <h4 className='text-lg font-semibold'>Request {requestId}</h4>
          
        </div>

        <div className="p-4 space-y-3">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={it.localId} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded p-2">
                <div className="md:col-span-5">
                  <label className="text-xs text-gray-600">Medicine</label>
                  <Input placeholder="Medicine name" value={it.mdecineName} onChange={e => update(it.localId, { mdecineName: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600">Quantity</label>
                  <Input type="number" min={1} value={it.quantity} onChange={e => update(it.localId, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
                <div className="md:col-span-1 text-right">
                <button
                  className="p-2 rounded hover:bg-red-50 text-red-600"
                  onClick={() => removeRow(it.localId)}
                  disabled={busy || items.length === 1}
                >
                  Remove
                </button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="secondary" onClick={addRow} disabled={busy}>+ Add medicine</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button onClick={handleSave} disabled={busy}>{busy ? savingLabel : 'Save changes'}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
