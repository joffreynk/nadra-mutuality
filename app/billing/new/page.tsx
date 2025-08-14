'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Member = { id: string; name: string };
type Partner = { id: string; name: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/members');
      if (res.ok) {
        const all = await res.json();
        setMembers(all.map((m: any) => ({ id: m.id, name: `${m.name} (${m.mainId})` })));
      }
      const pr = await fetch('/api/admin/partners');
      if (pr.ok) setPartners(await pr.json());
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberId || null, partnerId: partnerId || null, periodStart, periodEnd, amount: Number(amount) })
      });
      if (!res.ok) throw new Error('Failed');
      router.push('/billing');
    } catch (err) {
      setError('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Invoice</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Member (optional)</label>
            <select className="w-full border rounded p-2" value={memberId} onChange={(e) => { setMemberId(e.target.value); if (e.target.value) setPartnerId(''); }}>
              <option value="">None</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Company (optional)</label>
            <select className="w-full border rounded p-2" value={partnerId} onChange={(e) => { setPartnerId(e.target.value); if (e.target.value) setMemberId(''); }}>
              <option value="">None</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Period Start</label>
            <input type="date" className="w-full border rounded p-2" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required max={periodEnd || undefined} />
          </div>
          <div>
            <label className="block text-sm font-medium">Period End</label>
            <input type="date" className="w-full border rounded p-2" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required min={periodStart || undefined} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input type="number" className="w-full border rounded p-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Saving…' : 'Create Invoice'}</button>
        </div>
      </form>
    </div>
  );
}


