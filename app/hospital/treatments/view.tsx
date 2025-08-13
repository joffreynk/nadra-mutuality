'use client';
import { useEffect, useState } from 'react';

type Member = { id: string; name: string };
type Service = { id: string; code: string; name: string };

export default function TreatmentsClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [memberId, setMemberId] = useState('');
  const [items, setItems] = useState<Array<{ serviceId: string; quantity: number }>>([{ serviceId: '', quantity: 1 }]);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const m = await fetch('/api/members');
      if (m.ok) setMembers((await m.json()).map((x: any) => ({ id: x.id, name: x.name })));
      const s = await fetch('/api/hospital/services');
      if (s.ok) setServices(await s.json());
      const t = await fetch('/api/hospital/treatments');
      if (t.ok) setList(await t.json());
    })();
  }, []);

  async function createTreatment(e: React.FormEvent) {
    e.preventDefault();
    const payload = { memberId, items: items.filter(i => i.serviceId).map(i => ({ hospitalServiceId: i.serviceId, quantity: i.quantity })) };
    const res = await fetch('/api/hospital/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setMemberId('');
      setItems([{ serviceId: '', quantity: 1 }]);
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
            <div className="grid grid-cols-3 gap-2" key={idx}>
              <select className="border rounded p-2" value={it.serviceId} onChange={(e) => {
                const cp = [...items]; cp[idx].serviceId = e.target.value; setItems(cp);
              }}>
                <option value="">Service…</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
              </select>
              <input type="number" min={1} className="border rounded p-2" value={it.quantity} onChange={(e) => { const cp = [...items]; cp[idx].quantity = Number(e.target.value); setItems(cp); }} />
              <button type="button" className="border rounded" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
          <button type="button" className="px-3 py-1 border rounded" onClick={() => setItems([...items, { serviceId: '', quantity: 1 }])}>Add Item</button>
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


