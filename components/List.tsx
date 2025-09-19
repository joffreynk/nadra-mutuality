'use client';
import React, { useEffect, useState } from 'react';
import RequestList from '@/components/RequestList'; // adjust path if needed
import RequestDetailModal from '@/components/RequestDetailModal'; // the popup you created
import { Button } from '@/components/ui/button';

export default function HospitalRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function fetchRequests() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/hospital/my-requests');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e:any) {
      console.error(e);
      setErr(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRequests(); }, []);

  // onSelect opens modal
  function onSelect(r: any) {
    setSelected(r);
  }

  // onAction receives (itemId, currentStatus) from modal.
  // We prompt for a price when approving; confirm when reverting.
  async function onAction(itemId: string, currentStatus: string) {
    if (!selected) return;
    try {
      setBusy(true);
      if (currentStatus === 'Approved') {
        // revert
        if (!confirm('Revert this approved medicine?')) return;
        const res = await fetch(`/api/pharmacy/requests/${selected.id}/items/${itemId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'Reverted' }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        // approve -> ask for unit price
        const input = window.prompt('Enter unit price for this medicine (e.g. 12.50):');
        if (input === null) return; // cancelled
        const price = Number(input);
        if (!Number.isFinite(price) || price <= 0) { alert('Please enter a valid positive price.'); return; }

        const res = await fetch(`/api/pharmacy/requests/${selected.id}/items/${itemId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'Approved', unitPrice: price }),
        });
        if (!res.ok) throw new Error(await res.text());
      }

      // Refresh parent list and selected details (modal will refetch if you pass a prop or you can re-open)
      await fetchRequests();
      // re-fetch the selected request details from API so modal shows updated info
      try {
        const dres = await fetch(`/api/hospital/pharmacyRequests/${selected.id}`);
        if (dres.ok) {
          const fresh = await dres.json();
          setSelected(fresh);
        } else {
          // if request gone or forbidden, close modal
          setSelected(null);
        }
      } catch (e) {
        setSelected(null);
      }
    } catch (e:any) {
      console.error(e);
      alert(e?.message ?? 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Pharmacy Requests</h1>
        <div>
          <Button variant="ghost" onClick={fetchRequests} disabled={loading || busy}>{loading ? 'Loading…' : 'Refresh'}</Button>
        </div>
      </div>

      {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

      <RequestList requests={requests} onSelect={onSelect} />

      {selected && (
        <RequestDetailModal
          request={selected}
          onAction={onAction}
          session={/* If you have a session object client-side, pass it here. Otherwise pass minimal: */ { user: { id: selected?.currentUserId ?? '' } }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
