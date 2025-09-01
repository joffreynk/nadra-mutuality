'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreatePharmacyRequestBody } from '@/lib/validations';
import { z } from 'zod';

interface Member {
  id: string;
  memberCode?: string;
  name: string;
  coveragePercent?: number;
}

interface PharmacyItemInput {
  mdecineName: string;
  quantity: number;
  unitPrice: number;
  localId: string;
}

// ===== Utilities: robust JSON fetch (copied/embedded for safety) =====
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

// ===== Component =====
export default function HospitalPharmacyRequestEditor({ initialMemberId }:{ initialMemberId?:string }) {
  // Member search
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const memberDebounceRef = useRef<number | null>(null);

  // Line items
  const [items, setItems] = useState<PharmacyItemInput[]>([{ localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]);

  // Save state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  // Debounced member search (simple GET /api/members?q=...)
  useEffect(() => {
    if (memberDebounceRef.current) window.clearTimeout(memberDebounceRef.current);
    if (!memberQuery.trim()) { setMembers([]); setMembersError(null); return; }
    memberDebounceRef.current = window.setTimeout(async () => {
      setMembersLoading(true); setMembersError(null);
      try {
        const data = await fetchJson(`/api/members?q=${encodeURIComponent(memberQuery.trim())}`);
        setMembers(Array.isArray(data) ? data.map((m:any) => ({ id: m.id, name: m.name, memberCode: m.memberCode, coveragePercent: m.coveragePercent })) : []);
      } catch (e:any) {
        setMembersError(e.message || String(e));
      } finally {
        setMembersLoading(false);
      }
    }, 300);
    return () => { if (memberDebounceRef.current) window.clearTimeout(memberDebounceRef.current); };
  }, [memberQuery]);

  // Item helpers
  function updateItemById(localId: string, patch: Partial<PharmacyItemInput>) {
    setItems(prev => prev.map(it => it.localId === localId ? { ...it, ...patch } : it));
  }
  function addItem() {
    setItems(prev => [...prev, { localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]);
  }
  function removeItemById(localId: string) {
    setItems(prev => prev.filter(it => it.localId !== localId));
  }
  function resetItems() {
    setItems([{ localId: makeLocalId(), mdecineName:'', quantity:1, unitPrice:0 }]);
  }

  // Totals (cents to avoid float drift)
  const totals = useMemo(() => {
    const cents = items.reduce((s, it) => {
      const unitCents = Math.round((it.unitPrice || 0) * 100);
      const qty = Math.max(0, Math.floor(it.quantity || 0));
      return s + unitCents * qty;
    }, 0);
    const totalAmount = cents / 100;
    const coverage = selectedMember?.coveragePercent ?? 0;
    const insurerCents = Math.round(cents * (coverage / 100));
    const insurerShare = insurerCents / 100;
    const memberShare = (cents - insurerCents) / 100;
    return { totalAmount, insurerShare, memberShare };
  }, [items, selectedMember?.coveragePercent]);

  // Validation + create request
  async function handleCreate() {
    setMsg(null);
    try {
      if (!selectedMember) {
        setMsg('Please select a member before creating the request.');
        return;
      }
      // build payload in shape zod expects
      const payload = {
        memberId: selectedMember.id,
        items: items.map(it => ({ mdecineName: String(it.mdecineName || '').trim(), quantity: Number(it.quantity || 0), unitPrice: Number(it.unitPrice || 0) })),
      };
      // validate client-side
      CreatePharmacyRequestBody.parse(payload);

      // basic checks
      for (const it of payload.items) {
        if (!it.mdecineName) { throw new Error('All medicines must have a name.'); }
        if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) { throw new Error(`Unit price must be >= 0 for "${it.mdecineName}".`); }
        if (!Number.isFinite(it.quantity) || it.quantity < 1) { throw new Error(`Quantity must be >= 1 for "${it.mdecineName}".`); }
      }

      setLoading(true);
      const res = await fetch('/api/hospital/pharmacyRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || `Request failed: ${res.status}`);
      }
      const created = await res.json();
      setMsg('Request created');
      // reset but keep selected member for convenience
      resetItems();
      // Optionally, you might want to navigate to request details or show created.id
      // setMsg(`Request created: ${created.id}`);
    } catch (e:any) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // Initialize member if provided
  useEffect(() => {
    if (initialMemberId) {
      // quick fetch single member by id
      (async () => {
        try {
          const m = await fetchJson(`/api/members/${encodeURIComponent(initialMemberId)}`);
          if (m && m.id) setSelectedMember({ id: m.id, name: m.name, memberCode: m.memberCode, coveragePercent: m.coveragePercent });
        } catch {
          // ignore
        }
      })();
    }
  }, [initialMemberId]);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">1) Select Member</h2>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search member by name or code..."
                value={memberQuery}
                onChange={e => { setMemberQuery(e.target.value); setMembersError(null); }}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setMemberQuery(''); setMembers([]); setMembersError(null); }}>Clear</Button>
            </div>
          </div>

          {membersLoading && <div className="text-sm text-gray-500">Searching members…</div>}
          {membersError && <div className="text-sm text-red-600">{membersError}</div>}

          {members.length > 0 && (
            <div className="border rounded-md max-h-56 overflow-auto">
              {members.map(m => (
                <button
                  key={m.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  onClick={() => { setSelectedMember(m); setMemberQuery(''); setMembers([]); }}
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-600">Code: {m.memberCode ?? '-'} • Coverage: {m.coveragePercent ?? 0}%</div>
                </button>
              ))}
            </div>
          )}

          {selectedMember && (
            <div className="text-sm text-green-700">Selected: {selectedMember.name} (Coverage {selectedMember.coveragePercent ?? 0}%)</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">2) Medicines</h2>
          <div className="text-sm text-gray-600">Type each medicine on its own line.</div>

          {/* responsive table-like list */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="p-2">Medicine</th>
                  <th className="p-2 w-28">Quantity</th>
                  <th className="p-2 w-36">Unit price</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td className="p-4 text-sm text-gray-500" colSpan={5}>No medicines added yet.</td>
                  </tr>
                )}
                {items.map(it => (
                  <tr key={it.localId} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="w-full min-w-40 border rounded px-2 py-1"
                          value={it.mdecineName}
                          onChange={(e) => updateItemById(it.localId, { mdecineName: e.target.value })}
                          placeholder="Medicine name"
                        />
                      </div>
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => updateItemById(it.localId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-20 border rounded px-2 py-1"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.unitPrice}
                        onChange={(e) => updateItemById(it.localId, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-28 border rounded px-2 py-1"
                      />
                    </td>

                    <td className="p-2">{(it.unitPrice * it.quantity).toFixed(2)}</td>

                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => removeItemById(it.localId)}>Remove</Button>
                      </div>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={5} className="p-2">
                    <Button variant="secondary" onClick={addItem}>+ Add</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">3) Summary & Create</h2>

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
              <div className="text-sm text-gray-600"># items</div>
              <div className="text-xl font-semibold">{items.length}</div>
            </div>
          </div>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create pharmacy request'}
            </Button>
            <Button variant="secondary" onClick={() => { resetItems(); setMsg(null); }}>Reset</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
