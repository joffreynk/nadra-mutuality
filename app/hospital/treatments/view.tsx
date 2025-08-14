'use client';
import { useEffect, useState } from 'react';

type Member = { id: string; name: string };
type Service = { id: string; code: string; name: string };

export default function TreatmentsClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCode, setNewServiceCode] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [typingTimer, setTypingTimer] = useState<any>(null);
  const [memberId, setMemberId] = useState('');
  const [items, setItems] = useState<Array<{ serviceId: string; quantity: number; unitPrice: number }>>([{ serviceId: '', quantity: 1, unitPrice: 0 }]);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const m = await fetch('/api/members');
      if (m.ok) setMembers((await m.json()).map((x: any) => ({ id: x.id, name: x.name })));
      const s = await fetch('/api/hospital/services');
      if (s.ok) setServices(await s.json());
  useEffect(() => {
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(async () => {
      const q = serviceQuery.trim();
      if (!q) return;
      const res = await fetch(`/api/hospital/services?search=${encodeURIComponent(q)}`);
      if (res.ok) setServices(await res.json());
    }, 3000);
    setTypingTimer(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceQuery]);
      const t = await fetch('/api/hospital/treatments');
      if (t.ok) setList(await t.json());
    })();
  }, []);

  async function createTreatment(e: React.FormEvent) {
    e.preventDefault();
    const payload = { memberId, items: items.filter(i => i.serviceId).map(i => ({ hospitalServiceId: i.serviceId, quantity: i.quantity, unitPrice: i.unitPrice })) };
    // If user typed a new service name in the query box but didn't pick an existing one, auto-create and use it for the first item with empty serviceId
    if (serviceQuery && !payload.items.some((x: any) => x.hospitalServiceId)) {
      const created = await fetch('/api/hospital/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: serviceQuery.toUpperCase().slice(0, 16), name: serviceQuery }) });
      if (created.ok) {
        const sv = await created.json();
        payload.items = [{ hospitalServiceId: sv.id, quantity: items[0]?.quantity || 1, unitPrice: items[0]?.unitPrice || 0 }];
      }
    }
    const res = await fetch('/api/hospital/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setMemberId('');
      setItems([{ serviceId: '', quantity: 1, unitPrice: 0 }]);
      setList([await res.json(), ...list]);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Treatment Records</h1>
      <form onSubmit={createTreatment} className="bg-white p-6 rounded border shadow space-y-4">
        <div>
          <label className="block text-sm font-medium">Member</label>
          <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Select...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div className="grid grid-cols-4 gap-2" key={idx}>
              <div className="flex gap-2">
                <input className="border rounded p-2 flex-1" placeholder="Type service name" value={serviceQuery} onChange={(e) => setServiceQuery(e.target.value)} />
                <select className="border rounded p-2" value={it.serviceId} onChange={(e) => {
                  const cp = [...items]; cp[idx].serviceId = e.target.value; setItems(cp);
                }}>
                  <option value="">Pick…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <input type="number" min={1} className="border rounded p-2" value={it.quantity} onChange={(e) => { const cp = [...items]; cp[idx].quantity = Number(e.target.value); setItems(cp); }} />
              <input type="number" min={0} step="0.01" placeholder="Unit Price" className="border rounded p-2" value={it.unitPrice ?? ''} onChange={(e) => { const cp = [...items]; cp[idx].unitPrice = e.target.value === '' ? undefined : Number(e.target.value); setItems(cp); }} />
              <button type="button" className="border rounded" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
            <button type="button" className="px-3 py-1 border rounded" onClick={() => setItems([...items, { serviceId: '', quantity: 1, unitPrice: 0 }])}>Add Item</button>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <input placeholder="New Service Code" className="border rounded p-2" value={newServiceCode} onChange={(e) => setNewServiceCode(e.target.value)} />
            <input placeholder="New Service Name" className="border rounded p-2" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
            <button type="button" className="border rounded" onClick={async () => {
              if (!newServiceCode || !newServiceName) return;
              const res = await fetch('/api/hospital/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: newServiceCode, name: newServiceName }) });
              if (res.ok) {
                const sv = await res.json();
                setServices([sv, ...services]);
                setNewServiceCode('');
                setNewServiceName('');
              }
            }}>Create Service</button>
          </div>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded">Save Treatment</button>
      </form>

      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Treatments</h2>
        <div className="space-y-2 text-sm">
          {list.map(t => (
            <div key={t.id} className="border rounded p-3">
              <div className="font-medium">{t.id.slice(0,8)} • {new Date(t.createdAt).toLocaleString()}</div>
              <div>Items: {t.items.length}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


