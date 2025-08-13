'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Member = { id: string; name: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/members');
      if (res.ok) setMembers((await res.json()).map((m: any) => ({ id: m.id, name: m.name })));
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
        body: JSON.stringify({ memberId: memberId || null, periodStart, periodEnd, amount: Number(amount) })
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
        <div>
          <label className="block text-sm font-medium">Member (optional)</label>
          <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">None</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Period Start</label>
            <input type="date" className="w-full border rounded p-2" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Period End</label>
            <input type="date" className="w-full border rounded p-2" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
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


