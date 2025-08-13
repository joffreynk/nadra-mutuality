'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Member = { id: string; name: string };
type Dependent = { id: string; name: string; memberId: string };

export default function IssueCardPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [targetType, setTargetType] = useState<'member'|'dependent'>('member');
  const [targetId, setTargetId] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.map((m: any) => ({ id: m.id, name: m.name })));
      }
      const dres = await fetch('/api/dependents');
      if (dres.ok) {
        const data = await dres.json();
        setDependents(data);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: any = { number };
      if (targetType === 'member') body.memberId = targetId; else body.dependentId = targetId;
      const res = await fetch('/api/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed');
      router.push('/cards');
    } catch (err) {
      setError('Failed to issue card');
    } finally {
      setLoading(false);
    }
  }

  const options = targetType === 'member' ? members : dependents;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Issue New Card</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Target</label>
          <select className="w-full border rounded p-2" value={targetType} onChange={(e) => { setTargetType(e.target.value as any); setTargetId(''); }}>
            <option value="member">Member</option>
            <option value="dependent">Dependent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Select</label>
          <select className="w-full border rounded p-2" value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
            <option value="">Select...</option>
            {options.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Card Number</label>
          <input className="w-full border rounded p-2" value={number} onChange={(e) => setNumber(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Issuing…' : 'Issue Card'}</button>
        </div>
      </form>
    </div>
  );
}


