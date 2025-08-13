'use client';
import { useEffect, useState } from 'react';

export default function CoverageClient() {
  const [members, setMembers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [memberId, setMemberId] = useState('');
  const [medicineId, setMedicineId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const m = await fetch('/api/members');
      if (m.ok) setMembers(await m.json());
      const md = await fetch('/api/pharmacy/medicines');
      if (md.ok) setMedicines(await md.json());
    })();
  }, []);

  async function check() {
    const res = await fetch('/api/pharmacy/coverage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, medicineId, quantity }) });
    if (res.ok) setResult(await res.json()); else setResult(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Coverage Check</h1>
      <div className="bg-white p-6 rounded border shadow space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Member</label>
            <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Medicine</label>
            <select className="w-full border rounded p-2" value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
              <option value="">Select…</option>
              {medicines.map((m) => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input type="number" min={1} className="w-full border rounded p-2" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
        </div>
        <button className="px-4 py-2 bg-brand text-white rounded" onClick={check}>Check</button>
        {result && (
          <div className="text-sm text-gray-800">
            Price: ${result.price} • Covered: ${result.covered} • Copay: ${result.copay} • Coverage: {result.coveragePercent}%
          </div>
        )}
      </div>
    </div>
  );
}


