'use client';
import { useEffect, useState } from 'react';

export default function RequestsClient() {
  const [members, setMembers] = useState<any[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [medQuery, setMedQuery] = useState('');
  const [typingTimer, setTypingTimer] = useState<any>(null);
  const [memberId, setMemberId] = useState('');
  const [items, setItems] = useState<Array<{ medicineId: string; quantity: number }>>([{ medicineId: '', quantity: 1 }]);
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const m = await fetch('/api/members');
      if (m.ok) setMembers(await m.json());
      const md = await fetch('/api/pharmacy/medicines');
      if (md.ok) setMedicines(await md.json());
      const r = await fetch('/api/pharmacy/requests');
      if (r.ok) setList(await r.json());
    })();
  }, []);

  useEffect(() => {
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(async () => {
      const q = medQuery.trim();
      if (!q) return;
      const res = await fetch(`/api/pharmacy/medicines?search=${encodeURIComponent(q)}`);
      if (res.ok) setMedicines(await res.json());
    }, 3000);
    setTypingTimer(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medQuery]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    let finalItems = items.filter(i => i.medicineId);
    // If user typed a new medicine in the text box and did not choose one, create it and use it for the first item
    if (medQuery && finalItems.length === 0) {
      const created = await fetch('/api/pharmacy/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: medQuery.toUpperCase().slice(0, 16), name: medQuery, price: 0 }) });
      if (created.ok) {
        const md = await created.json();
        finalItems = [{ medicineId: md.id, quantity: 1 }];
      }
    }
    const res = await fetch('/api/pharmacy/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, items: finalItems }) });
    if (res.ok) {
      setMemberId('');
      setItems([{ medicineId: '', quantity: 1 }]);
      setList([await res.json(), ...list]);
    }
  }

  const filteredMembers = members.filter((m) => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return true;
    return (m.name?.toLowerCase().includes(q) || m.mainId?.toLowerCase().includes(q) || m.companyName?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pharmacy Requests</h1>
      <form onSubmit={create} className="bg-white p-6 rounded border shadow space-y-4">
        <div>
          <label className="block text-sm font-medium">Member</label>
          <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Select…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div className="grid grid-cols-3 gap-2" key={idx}>
              <div className="flex gap-2">
                <input className="border rounded p-2 flex-1" placeholder="Type medicine name" value={medQuery} onChange={(e) => setMedQuery(e.target.value)} />
                <select className="border rounded p-2" value={it.medicineId} onChange={(e) => { const cp = [...items]; cp[idx].medicineId = e.target.value; setItems(cp); }}>
                  <option value="">Pick…</option>
                  {medicines.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <input type="number" min={1} className="border rounded p-2" value={it.quantity} onChange={(e) => { const cp = [...items]; cp[idx].quantity = Number(e.target.value); setItems(cp); }} />
              <button type="button" className="border rounded" onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</button>
            </div>
          ))}
          <button type="button" className="px-3 py-1 border rounded" onClick={() => setItems([...items, { medicineId: '', quantity: 1 }])}>Add Item</button>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded">Create Request</button>
      </form>
      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Requests</h2>
        <div className="space-y-2 text-sm">
          {list.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="font-medium">{r.id.slice(0,8)} • {new Date(r.createdAt).toLocaleString()}</div>
              <div>Items: {r.items.length}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


