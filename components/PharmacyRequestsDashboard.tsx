'use client';
import React, { useEffect, useState } from 'react';
import RequestList from './RequestList';
import RequestDetail from './RequestDetail';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

async function fetchJson(url:string, init?:RequestInit){
  const res = await fetch(url, init);
  if (!res.ok) { const t = await res.text().catch(()=>res.statusText); throw new Error(t || res.statusText); }
  return res.json();
}

export default function PharmacyRequestsDashboard(){
  const [q, setQ] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any|null>(null);
  const [session, setSession] = useState(null)

  async function load(){
    try {
      const url = q ? `/api/pharmacy/requests?memberId=${encodeURIComponent(q)}` : '/api/pharmacy/requests';
      const data = await fetchJson(url);
      setRequests(Array.isArray(data) ? data : []);

      const sessionData = await fetchJson('/api/auth/session');
      setSession(sessionData);
    } catch (e:any) {throw new Error(e.message || String(e));}
    finally { }
  }

  useEffect(()=>{ load(); }, []);

  async function onAction(itemId:string, currentStatus:string){
    if (!selected) return;
    const action = currentStatus === 'Approved' ? 'Pending' : 'Approved';
    try {
      await fetchJson(`/api/pharmacy/requests/${selected.id}/items/${itemId}/status`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action })
      });
      // update local
      setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, pharmacyRequests: r.pharmacyRequests.map((it:any)=> it.id===itemId ? {...it, status: action} : it) } : r));
      setSelected((prev:any) => prev ? { ...prev, pharmacyRequests: prev.pharmacyRequests.map((it:any)=> it.id===itemId ? {...it, status: action} : it),  } : prev);
    } catch (e:any) {
      alert(e.message || String(e));
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex-1">
            <Input placeholder="Filter by member id" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={load}>Search</Button>
            <Button variant="secondary" onClick={()=>{ setQ(''); load(); }}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RequestList requests={requests} onSelect={(r)=>setSelected(r)} />
        </div>
        <div>
          <RequestDetail request={selected} onAction={onAction} session={session} />
        </div>
      </div>
    </div>
  );
}
