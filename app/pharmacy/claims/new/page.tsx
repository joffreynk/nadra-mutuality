'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClaimPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [memberId, setMemberId] = useState('');
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { (async () => { const r = await fetch('/api/members'); if (r.ok) setMembers(await r.json()); })(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/pharmacy/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, details, amount: Number(amount) }) });
      if (!res.ok) throw new Error('Failed');
      router.push('/pharmacy/claims');
    } catch (e) {
      setError('Failed to submit claim');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">New Claim</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Member</label>
          <select className="w-full border rounded p-2" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Select…</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Details</label>
          <textarea className="w-full border rounded p-2" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input type="number" className="w-full border rounded p-2" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Submitting…' : 'Submit Claim'}</button>
        </div>
      </form>
    </div>
  );
}


