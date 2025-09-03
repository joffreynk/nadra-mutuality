'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RequestEditModal from './RequestEditModal'; // relative path
import { Input } from '@/components/ui/input';

export default function RequestDetailsModal({ requestId, onClose, onChanged, currentUserId }: {
  requestId: string;
  onClose: () => void;
  onChanged?: () => void;
  currentUserId?: string | null;
}) {
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Map of itemId -> unitPrice (local input state)
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>({});

  // editor
  const [editing, setEditing] = useState(false);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/hospital/pharmacyRequests/${requestId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequest(data);

      // initialize unit price map from server values (use numeric 0 if null)
      const map: Record<string, number> = {};
      (data.pharmacyRequests || []).forEach((it: any) => {
        map[it.id] = it.unitPrice != null ? Number(it.unitPrice) : 0;
      });
      setUnitPrices(map);
    } catch (e:any) { console.error(e); setErr(e?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [requestId]);

  function setUnitPriceFor(itemId: string, value: number) {
    setUnitPrices(prev => ({ ...prev, [itemId]: value }));
  }

  async function postAction(itemId: string, actionBody: any) {
    setBusyItemId(itemId);
    setErr(null);
    try {
      // If approving, ensure we have a positive unit price for this item
      if (actionBody.action === 'Approved') {
        const price = unitPrices[itemId];
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Unit price must be > 0 to approve the item.');
        }
        actionBody.unitPrice = price;
      }

      const res = await fetch(`/api/pharmacy/requests/${requestId}/items/${itemId}/status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actionBody),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt || res.statusText);

      // refresh data after successful change
      await load();
      onChanged?.();
    } catch (e:any) { console.error(e); setErr(e?.message ?? 'Action failed'); }
    finally { setBusyItemId(null); }
  }

  async function doDelete(itemId: string) {
    if (!confirm('Delete this medicine?')) return;
    setBusyItemId(itemId);
    try {
      const res = await fetch(`/api/pharmacy/requests/${requestId}/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      await load(); onChanged?.();
    } catch (e:any) { console.error(e); setErr(e?.message ?? 'Delete failed'); }
    finally { setBusyItemId(null); }
  }

  if (!request) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded p-6 max-w-lg w-full">
        {loading ? 'Loading…' : (err ?? 'No data')}
        <div className="mt-3"><Button onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );

  const isCreator = request.usercreator === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-lg">
        <div className="p-4 border-b flex items-start justify-between">
          <div>
            <div className="font-semibold">Request {request.id}</div>
            <div className="text-sm text-gray-600">Member: {request.member?.name ?? request.memberId}</div>
            <div className="text-xs text-gray-500">Created by: {request.user?.name ?? request.usercreator} • {new Date(request.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="space-y-2">
            {(!request.pharmacyRequests || request.pharmacyRequests.length === 0) && <div className="text-sm text-gray-500">No items.</div>}
            {request.pharmacyRequests.map((it:any) => {
              const isApproved = it.status === 'Approved';
              const isApprover = it.userAproverId === currentUserId;
              const canApprove = !isApproved;
              const canRevert = isApproved && isApprover;

              // the local controlled value for this input
              const localPrice = unitPrices[it.id] ?? 0;

              return (
                <Card key={it.id}>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium">{it.mdecineName}</div>
                      <div className="text-xs text-gray-500">
                        {it.quantity} × {it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {it.status}{it.user?.name ? ` • by ${it.user.name}` : ''}
                      </div>
                    </div>

                    <div className="w-40">
                      <label htmlFor={`unitPrice-${it.id}`} className="text-xs text-gray-600 block">Unit Price</label>
                      <Input
                        id={`unitPrice-${it.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={localPrice}
                        onChange={(e) => setUnitPriceFor(it.id, Number(e.target.value))}
                        disabled={isApproved} // disable editing for approved items by default
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {canApprove && (
                        <Button disabled={!!busyItemId} onClick={() => postAction(it.id, { action: 'Approved' })}>
                          Approve
                        </Button>
                      )}
                      {canRevert && (
                        <Button variant="ghost" disabled={!!busyItemId} onClick={() => postAction(it.id, { action: 'Reverted' })}>
                          Revert
                        </Button>
                      )}
                      {/* creator can remove pending items */}
                      {isCreator && !isApproved && (
                        <Button variant="destructive" onClick={() => doDelete(it.id)} disabled={!!busyItemId}>Delete</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className='text-center'>
          <div className="flex items-center gap-2 mb-2 justify-center">
            {isCreator && <Button onClick={() => setEditing(true)}>Edit list</Button>}
            <Button variant="ghost" onClick={() => { onClose(); }}>Close</Button>
          </div>
        </div>
      </div>

      {/* Edit modal: full medicines list editor */}
      {editing && (
        <RequestEditModal
          requestId={requestId}
          initialItems={request.pharmacyRequests}
          onClose={() => { setEditing(false); load(); onChanged?.(); }}
          onSaved={(res) => { /* res contains updated request from server if route returns it */ }}
        />
      )}
    </div>
  );
}
