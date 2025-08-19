'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Member = { id: string; name: string; mainId: string; company?: { name: string } | null };
type Company = { id: string; name: string; email?: string; phoneNumber?: string; address?: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/members?q=${memberSearchQuery}`);
      if (res.ok) {
        const all = await res.json();
        setMembers(all.map((m: any) => ({ id: m.id, name: m.name, mainId: m.mainId, company: m.company })));
      }
      const compRes = await fetch(`/api/admin/companies?q=${companySearchQuery}`);
      if (compRes.ok) setCompanies(await compRes.json());
    })();
  }, [memberSearchQuery, companySearchQuery]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: any = { periodStart, periodEnd, amount: Number(amount) };
      if (memberId) body.memberId = memberId;
      if (companyId) body.companyId = companyId;

      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed');
      }
      router.push('/billing');
    } catch (err: any) {
      setError('Failed to create invoice: ' + err.message);
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
            <input
              type="text"
              className="w-full border rounded p-2 mb-2"
              placeholder="Search by name or ID..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
            />
            <select className="w-full border rounded p-2" value={memberId} onChange={(e) => { setMemberId(e.target.value); if (e.target.value) setCompanyId(''); }}>
              <option value="">None</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.mainId}){m.company && ` - ${m.company.name}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Company (optional)</label>
            <input
              type="text"
              className="w-full border rounded p-2 mb-2"
              placeholder="Search by name, email or phone..."
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
            />
            <select className="w-full border rounded p-2" value={companyId} onChange={(e) => { setCompanyId(e.target.value); if (e.target.value) setMemberId(''); }}>
              <option value="">None</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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


