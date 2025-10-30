'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/lib/components/ui/table';
import { bifFormatter } from '@/lib/utils';

type Member = { id: string; name: string; mainId: string; memberCode: string; company?: { id: string; name: string }, category: { id: string; name: string, coveragePercent: number, price: number } | null };
type Company = { id: string; name: string; email?: string; phoneNumber?: string; address?: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
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
        setMembers(all.map((m: any) => ({ id: m.id, name: m.name, memberCode: m.memberCode, company: m.company, category: m.category })));
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
      const body: any = { period, amount: Number(amount) };
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
    <div className="max-w-4xl  py-8">
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
            <select className="w-full border rounded p-2" value={memberId} onChange={(e) => {  (e.target.value); if (e.target.value) setCompanyId(''); }}>
              <option value="">Member</option>
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
            <select className="w-full border rounded p-2" value={companyId} onChange={(e) => { setCompanyId(e.target.value); if (e.target.value) setMemberId(''); setSelectedMembers(members.filter(m => m.company?.id === e.target.value)); }}>
              <option value="">Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Number of months: </label>
            <input type="number" className="w-full border rounded p-2" value={period} onChange={(e) => setPeriod(e.target.value)} required min={1} placeholder='Nomber des mois a payer' />
          </div>
          <div className="flex gap-2 h-fit mt-6 justify-end">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Saving…' : 'Create Invoice'}</button>
        </div>
        </div>


        {selectedMembers.length > 0 && (
          <Table>
            <TableCaption>A list of members from {companyId ? companies.find(c => c.id === companyId)?.name : 'all companies'}.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="">Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedMembers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell className="font-medium">{m.memberCode}</TableCell>
                  <TableCell>{m.category?.name} - {m.category?.coveragePercent}%</TableCell>
                  <TableCell className="text-right">{m.category?.price} * {period} = {m.category?.price! * Number(period)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{bifFormatter.format(selectedMembers.reduce((acc, m) => acc + (m.category?.price! * Number(period)), 0))}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}


        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}


