'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { set } from 'zod';

// ===== Types =====
interface Member {
  id: string;
  name: string;
  memberCode?: string;
  coveragePercent?: number; // from Prisma schema
}

interface HospitalService {
  id: string;
  name: string;
}

interface TreatmentItemInput {
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  localId: string;
}

// ===== Utilities =====
const isJsonContentType = (ct: string | null) => (ct || '').toLowerCase().includes('application/json');
async function readJsonOrThrow(res: Response, url: string) {
  const ct = res.headers.get('content-type');
  const clone = res.clone();
  if (!isJsonContentType(ct)) {
    const sample = await res.text().catch(() => '');
    throw new Error(`Expected JSON from ${url} but received content-type "${ct || 'unknown'}". Sample: ${sample.slice(0,200)}`);
  }
  try { return await res.json(); } catch (e: any) {
    const sample = await clone.text().catch(() => '');
    throw new Error(`Invalid JSON from ${url}: ${e?.message || String(e)}. Sample: ${sample.slice(0,200)}`);
  }
}
async function readErrorAndThrow(res: Response, url: string): Promise<never> {
  const ct = res.headers.get('content-type');
  let msg = '';
  if (isJsonContentType(ct)) {
    try { const err = await res.json(); msg = typeof err === 'string' ? err : err?.message || JSON.stringify(err); } catch {}
  }
  if (!msg) { try { msg = (await res.text()).slice(0,200); } catch {} }
  throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}${msg ? `: ${msg}` : ''}`);
}
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) return readErrorAndThrow(res, url);
  return readJsonOrThrow(res, url);
}

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export default function TreatmentsClient({ currentProviderType }: { currentProviderType: string }) {
  // Members
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const memberDebounceRef = useRef<number | null>(null);

  // Line items
  const [lineItems, setLineItems] = useState<TreatmentItemInput[]>([]);

  // Save
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // member search
  const fetchData = async () => {
      const url = memberQuery ? `/api/members?q=${encodeURIComponent(memberQuery)}` : '/api/members';
      const mres = await fetch(url);
      if (mres.ok) {
      const newmembers = await mres.json();
      console.log('members', newmembers);
      console.log('query', memberQuery);
        setMembers(newmembers.map((m:any) => ({   id: m.id, name: m.name, memberCode: m.memberCode, coveragePercent: m.coveragePercent })));
      }
    };

    // useEffect(() => {
    //   fetchData();
    // }, [memberQuery])
    

  useEffect(() => {
    const id = setTimeout(() => {
       fetchData();
      // setMembers(members.filter(m => m.name.toLowerCase().includes(memberQuery.toLowerCase())));
    }, 350);
    return () => clearTimeout(id);
  }, [memberQuery]);

  const totals = useMemo(() => {
    const cents = lineItems.reduce((s, li) => {
      const unitCents = Math.round((li.unitPrice || 0) * 100);
      const qty = Math.max(0, Math.floor(li.quantity || 0));
      return s + unitCents * qty;
    }, 0);
    const totalAmount = cents / 100;
    const coverage = selectedMember?.coveragePercent ?? 0;
    const insurerCents = Math.round(cents * (coverage / 100));
    const insurerShare = insurerCents / 100;
    const memberShare = (cents - insurerCents) / 100;
    return { totalAmount, insurerShare, memberShare };
  }, [lineItems, selectedMember?.coveragePercent]);

  // Add a completely new empty line
  function addBlankLine() {
    setLineItems(prev => [...prev, { treatmentName: '', quantity: 1, unitPrice: 0, localId: makeLocalId() }]);
  }

  function updateLineItem(idx: number, patch: Partial<TreatmentItemInput>) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ...patch } : li));
  }
  function removeLineItem(idx: number) { setLineItems(prev => prev.filter((_, i) => i !== idx)); }

  // Ensure any remaining local-only services get created and updated with ids
  async function ensureLineItemsPersisted() {
    for (const li of lineItems) {
      if (!li.treatmentName) {
        if (!li.treatmentName || !li.treatmentName.trim()) throw new Error('Treatment name required for a line item.');
        setLineItems(prev => prev.map(p => p.localId === li.localId ? { ...p, treatmentName: li.treatmentName } : p));
      }
    }
  }

  // Save treatment and items
  async function saveTreatment() {
    setSaveError(null); setReceiptUrl(null);
    if (!selectedMember) { setSaveError('Please select a member.'); return; }
    if (lineItems.length === 0) { setSaveError('Please add at least one service.'); return; }

    for (const li of lineItems) {
      if (!li.treatmentName || !li.treatmentName.trim()) { setSaveError('All line items need a service name.'); return; }
      if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) { setSaveError(`Unit price must be >= 0 for "${li.treatmentName}".`); return; }
      if (!Number.isFinite(li.quantity) || li.quantity < 1) { setSaveError(`Quantity must be >= 1 for "${li.treatmentName}".`); return; }
    }

    setSaving(true);
    try {
      await ensureLineItemsPersisted();
      const finalItems = lineItems.map(li => ({ ...li }));
      const treatmentItems = finalItems.map(li => ({ treatmentName: li.treatmentName, unitPrice: li.unitPrice, quantity: li.quantity }));
      const payload = {
        memberId: selectedMember.id,
        totalAmount: totals.totalAmount,
        insurerShare: totals.insurerShare,
        memberShare: totals.memberShare,
        coveragePercent: selectedMember.coveragePercent ?? 0,
        treatmentItems,
      };
      const res = await fetchJson('/api/hospital/treatments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      setReceiptUrl(res?.receiptUrl ?? null);
      setLineItems([]);
    } catch (e: any) { setSaveError(e.message || String(e)); }
    finally { setSaving(false); }
  }

  // add an initial blank line
  useEffect(() => { if (lineItems.length === 0) addBlankLine(); }, []);

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Member selection */}
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">1) Select Member</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search member by name/code..." value={memberQuery} onChange={e => setMemberQuery(e.target.value)} />
            <Button variant="secondary" onClick={() => { setMemberQuery(''); setMembers([]); setMembersError(null); }}>Clear</Button>
          </div>
          {membersLoading && <div className="text-sm">Searching members…</div>}
          {membersError && <div className="text-sm text-red-600">{membersError}</div>}
          {members.length > 0 && (
            <div className="border rounded-md max-h-48 overflow-auto">
              {members.map(m => (
                <div key={m.id} className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0" onClick={() => { setSelectedMember(m); setMemberQuery(''); setMembers([]); }}>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-600">Code: {m.memberCode} • Coverage: {m.coveragePercent ?? 0}%</div>
                </div>
              ))}
            </div>
          )}
          {selectedMember && <div className="text-sm text-green-700">Member: {selectedMember.name} (Coverage {selectedMember.coveragePercent ?? 0}%)</div>}
        </CardContent>
      </Card>

      {/* Services & items */}
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">2) Add Services</h2>

          <div className="text-sm text-gray-600">Type each service name directly on its line.</div>

          {/* Line items table with simple service name input */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-2">Service</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Unit price</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm text-gray-500" colSpan={5}>No services added yet.</td>
                  </tr>
                )}
                {lineItems.map((li, idx) => (
                  <tr key={`${li.treatmentName ?? li.localId}-${idx}`} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <input type='text' className="w-full min-w-40 border rounded px-2 py-1" id={`treatmentName-${idx}`} value={li.treatmentName} onChange={(e) => updateLineItem(idx, { treatmentName: e.target.value })} placeholder="Service name" />
                      </div>
                    </td>
                    <td className="p-2 w-24">
                      <input type="number" min={1} value={li.quantity} onChange={(e) => updateLineItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-20 border rounded px-2 py-1" />
                    </td>
                    <td className="p-2 w-36">
                      <input type="number" min={0} step="0.01" value={li.unitPrice} onChange={(e) => updateLineItem(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} className="w-28 border rounded px-2 py-1" />
                    </td>
                    <td className="p-2">{(li.unitPrice * li.quantity).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => removeLineItem(idx)}>Remove</Button>
                        {idx === lineItems.length - 1 && <Button variant="secondary" onClick={addBlankLine}>+ Add</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary & save */}
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">3) Summary & Save</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total amount</div>
              <div className="text-xl font-semibold">{totals.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Insurer share ({selectedMember?.coveragePercent ?? 0}%)</div>
              <div className="text-xl font-semibold">{totals.insurerShare.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Member share</div>
              <div className="text-xl font-semibold">{totals.memberShare.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600"># services</div>
              <div className="text-xl font-semibold">{lineItems.length}</div>
            </div>
          </div>

          {saveError && <div className="text-sm text-red-600">{saveError}</div>}

          <div className="flex gap-2">
            <Button onClick={saveTreatment} disabled={saving}>{saving ? 'Saving…' : 'Save treatment & generate receipt'}</Button>
            <Button variant="secondary" onClick={() => { setLineItems([]); setReceiptUrl(null); }}>Reset</Button>
          </div>

          {receiptUrl && (
            <div className="text-sm mt-2">Receipt: <a className="text-blue-700 underline" href={receiptUrl} target="_blank" rel="noreferrer">Open</a></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
