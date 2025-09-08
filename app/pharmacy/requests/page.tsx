'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RequestDetailsModal from '@/components/RequestDetailsModal';

export default function HospitalMyRequestsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  async function fetchSession() {
    try {
      const r = await fetch('/api/session');
      const j = await r.json();
      setCurrentUserId(j?.user?.id ?? null);
    } catch {}
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/hospital/requests');
      const data = await res.json();
      console.log('Fetched data:', JSON.stringify(data, null, 2));
      setList(Array.isArray(data) ? data : []);
    } catch (e:any) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchSession(); load(); }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Medecines requests</h1>
      {loading && <div>Loading…</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map(req => (
          <Card key={req.id}>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="font-medium">Request #{req.id}</div>
                <div className="text-sm text-gray-600">Member: {req.member?.name ?? req.memberId}</div>
                <div className="text-xs text-gray-500">Created by: {req.user?.name ?? req.usercreator}</div>
              </div>

              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <div className="text-sm text-gray-600 mr-4">{(req.pharmacyRequests?.length ?? 0)} item(s)</div>
                <Button variant="ghost" onClick={() => setOpenRequestId(req.id)}>View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {openRequestId && (
        <RequestDetailsModal
          requestId={openRequestId}
          onClose={() => { setOpenRequestId(null); load(); }}
          currentUserId={currentUserId}
          onChanged={() => load()}
        />
      )}
    </div>
  );
}
