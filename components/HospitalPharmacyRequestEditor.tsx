// components/HospitalPharmacyRequestEditor.tsx
'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { CreatePharmacyRequestBody } from '@/lib/validations';

function makeLocalId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

export default function HospitalPharmacyRequestEditor({ initialMemberId }:{ initialMemberId?:string }) {
  const [memberId, setMemberId] = useState(initialMemberId ?? '');
  const [items, setItems] = useState<any[]>([{ localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  function updateItem(i:number, patch:Partial<any>){ setItems(prev => prev.map((it,idx)=> idx===i ? {...it, ...patch} : it)); }
  function addItem(){ setItems(prev => [...prev, { localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]); }
  function removeItem(i:number){ setItems(prev => prev.filter((_,idx)=>idx!==i)); }

  async function handleCreate(){
    setMsg(null);
    try {
      const payload = { memberId, items: items.map(it => ({ mdecineName: it.mdecineName, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })) };
      CreatePharmacyRequestBody.parse(payload); // quick client zod validation
      setLoading(true);
      const res = await fetch('/api/hospital/pharmacyRequests', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text().catch(()=>res.statusText);
        throw new Error(txt || 'Server error');
      }
      setMsg('Request created');
      setItems([{ localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]);
    } catch (e:any) {
      setMsg(e?.message || String(e));
    } finally { setLoading(false); }
  }

  const total = items.reduce((s,it)=> s + Math.round((Number(it.unitPrice)||0)*100)*Math.max(1, Number(it.quantity)||0), 0) / 100;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-lg font-semibold">Create Pharmacy Request</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600">Member ID</label>
              <Input value={memberId} onChange={e=>setMemberId(e.target.value)} placeholder="Member ID" />
            </div>
            <div className="sm:col-span-1 text-right">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-lg font-semibold">{total.toFixed(2)}</div>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((it, idx)=>(
              <div key={it.localId} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded p-2">
                <div className="md:col-span-6">
                  <Input placeholder="Medicine name" value={it.mdecineName} onChange={e=>updateItem(idx, { mdecineName: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Input type="number" min={1} value={it.quantity} onChange={e=>updateItem(idx, { quantity: Math.max(1, Number(e.target.value)||1) })} />
                </div>
                <div className="md:col-span-2">
                  <Input type="number" step="0.01" min={0} value={it.unitPrice} onChange={e=>updateItem(idx, { unitPrice: Math.max(0, Number(e.target.value)||0) })} />
                </div>
                <div className="md:col-span-1 text-sm">
                  {(Number(it.unitPrice||0)*Number(it.quantity||0)).toFixed(2)}
                </div>
                <div className="md:col-span-1 text-right">
                  <button onClick={()=>removeItem(idx)} className="p-2 rounded hover:bg-red-50 text-red-600"><Trash size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={addItem}>+ Add medicine</Button>
              <Button variant="ghost" onClick={()=>setItems([{ localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }])}>Reset</Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={loading}>{loading ? 'Creating…' : 'Create request'}</Button>
            </div>
          </div>

          {msg && <div className="text-sm">{msg}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
