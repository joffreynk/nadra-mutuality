'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';

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
  hospitalServiceId?: string;
  serviceName: string;
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

// Small helper to generate local ids
const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

// Inline service input with its own debounced suggestions (non-blocking)
function InlineServiceInput({
  value,
  onChange,
  onSelectService,
  onCreateService,
  placeholder = 'Type service name...'
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectService: (s: HospitalService) => void;
  onCreateService: (name: string) => Promise<HospitalService>;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) { setSuggestions([]); setError(null); return; }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const data = await fetchJson(`/api/hospital/services?search=${encodeURIComponent(query.trim())}`);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (e: any) { setError(e.message || String(e)); }
      finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setSuggestions([]);
    }
    window.addEventListener('click', onDoc);
    return () => window.removeEventListener('click', onDoc);
  }, []);

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      // if exact match exists in suggestions, select it
      const exact = suggestions.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
      if (exact) {
        onSelectService(exact);
        setSuggestions([]);
        return;
      }
      // otherwise create service and return selection
      try {
        const created = await onCreateService(trimmed);
        onSelectService(created);
        setSuggestions([]);
      } catch (err) {
        // bubble up error by setting local error
        setError((err as Error)?.message || String(err));
      }
    }
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      // focus first suggestion by mimicking click (UX improvement could be added)
      e.preventDefault();
      const first = suggestions[0];
      onSelectService(first);
      setSuggestions([]);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        className="w-full border rounded px-2 py-1"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); }}
        onKeyDown={handleKeyDown}
      />
      {(loading || suggestions.length > 0 || error) && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-auto z-20">
          {loading && <div className="p-2 text-sm">Searching…</div>}
          {error && <div className="p-2 text-sm text-red-600">{error}</div>}
          {suggestions.map(s => (
            <div key={s.id} className="px-3 py-2 cursor-pointer hover:bg-gray-50" onClick={() => { onSelectService(s); setSuggestions([]); }}>
              <div className="font-medium">{s.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreatmentsClient({ currentProviderType }: { currentProviderType: string }) {
  // Members
  const [memberQuery, setMemberQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const memberDebounceRef = useRef<number | null>(null);

  // Top-level service add (optional)
  const [serviceQuery, setServiceQuery] = useState('');
  const [servicesCache, setServicesCache] = useState<HospitalService[]>([]); // keep a small cache
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const serviceDebounceRef = useRef<number | null>(null);

  // Line items
  const [lineItems, setLineItems] = useState<TreatmentItemInput[]>([]);

  // Save
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  // member search
  useEffect(() => {
    if (memberDebounceRef.current) window.clearTimeout(memberDebounceRef.current);
    if (!memberQuery.trim()) { setMembers([]); setMembersError(null); return; }
    memberDebounceRef.current = window.setTimeout(async () => {
      setMembersLoading(true); setMembersError(null);
      try {
        const data = await fetchJson(`/api/members?q=${encodeURIComponent(memberQuery.trim())}`);
        setMembers(Array.isArray(data) ? data : []);
      } catch (e: any) { setMembersError(e.message || String(e)); }
      finally { setMembersLoading(false); }
    }, 300);
    return () => { if (memberDebounceRef.current) window.clearTimeout(memberDebounceRef.current); };
  }, [memberQuery]);

  // top-level service search to populate cache (non-blocking)
  useEffect(() => {
    if (serviceDebounceRef.current) window.clearTimeout(serviceDebounceRef.current);
    if (!serviceQuery.trim()) { setServicesCache([]); setServicesError(null); return; }
    serviceDebounceRef.current = window.setTimeout(async () => {
      setServicesLoading(true); setServicesError(null);
      try {
        const data = await fetchJson(`/api/hospital/services?search=${encodeURIComponent(serviceQuery.trim())}`);
        setServicesCache(Array.isArray(data) ? data : []);
      } catch (e: any) { setServicesError(e.message || String(e)); }
      finally { setServicesLoading(false); }
    }, 300);
    return () => { if (serviceDebounceRef.current) window.clearTimeout(serviceDebounceRef.current); };
  }, [serviceQuery]);

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

  // CRUD helpers for services
  async function createServiceOnServer(name: string) {
    const created: HospitalService = await fetchJson('/api/hospital/services', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
    });
    // update cache
    setServicesCache(prev => [created, ...prev.filter(p => p.id !== created.id)]);
    return created;
  }

  // Add a completely new empty line
  function addBlankLine() {
    setLineItems(prev => [...prev, { hospitalServiceId: undefined, serviceName: '', quantity: 1, unitPrice: 0, localId: makeLocalId() }]);
  }

  // Add a line item by name (from top input or suggestion)
  async function addLineItemByName(name: string) {
    const trimmed = name.trim(); if (!trimmed) return;
    // try find in cache
    const existing = servicesCache.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setLineItems(prev => [...prev, { hospitalServiceId: existing.id, serviceName: existing.name, quantity: 1, unitPrice: 0, localId: makeLocalId() }]);
      setServiceQuery('');
      return;
    }
    // create
    setServicesLoading(true);
    try {
      const created = await createServiceOnServer(trimmed);
      setLineItems(prev => [...prev, { hospitalServiceId: created.id, serviceName: created.name, quantity: 1, unitPrice: 0, localId: makeLocalId() }]);
      setServiceQuery('');
    } catch (e: any) { setServicesError(e.message || String(e)); }
    finally { setServicesLoading(false); }
  }

  function updateLineItem(idx: number, patch: Partial<TreatmentItemInput>) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ...patch } : li));
  }
  function removeLineItem(idx: number) { setLineItems(prev => prev.filter((_, i) => i !== idx)); }

  // Ensure any remaining local-only services get created and updated with ids
  async function ensureLineItemsPersisted() {
    for (const li of lineItems) {
      if (!li.hospitalServiceId) {
        if (!li.serviceName || !li.serviceName.trim()) throw new Error('Service name required for a line item.');
        const created = await createServiceOnServer(li.serviceName.trim());
        setLineItems(prev => prev.map(p => p.localId === li.localId ? { ...p, hospitalServiceId: created.id } : p));
      }
    }
  }

  // Save treatment and items
  async function saveTreatment() {
    setSaveError(null); setReceiptUrl(null);
    if (!selectedMember) { setSaveError('Please select a member.'); return; }
    if (lineItems.length === 0) { setSaveError('Please add at least one service.'); return; }

    for (const li of lineItems) {
      if (!li.serviceName || !li.serviceName.trim()) { setSaveError('All line items need a service name.'); return; }
      if (!Number.isFinite(li.unitPrice) || li.unitPrice < 0) { setSaveError(`Unit price must be >= 0 for "${li.serviceName}".`); return; }
      if (!Number.isFinite(li.quantity) || li.quantity < 1) { setSaveError(`Quantity must be >= 1 for "${li.serviceName}".`); return; }
    }

    setSaving(true);
    try {
      await ensureLineItemsPersisted();
      const finalItems = lineItems.map(li => ({ ...li }));
      const treatmentItems = finalItems.map(li => ({ hospitalServiceId: li.hospitalServiceId, unitPrice: li.unitPrice, quantity: li.quantity }));
      const payload = {
        memberId: selectedMember.id,
        providerType: currentProviderType,
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

  // Shortcuts: add an initial blank line when component mounts
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
          <div className="text-xs text-gray-600">Provider type: <span className="font-medium">{currentProviderType}</span></div>
          {selectedMember && <div className="text-sm text-green-700">Selected: {selectedMember.name} (Coverage {selectedMember.coveragePercent ?? 0}%)</div>}
        </CardContent>
      </Card>

      {/* Services & items */}
      <Card>
        <CardContent className="space-y-2">
          <h2 className="text-lg font-semibold">2) Add Services</h2>

          {/* Top quick add (optional) */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type service name. Press Enter to add (creates if not found)."
              value={serviceQuery}
              onChange={e => setServiceQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && serviceQuery.trim()) { e.preventDefault(); addLineItemByName(serviceQuery.trim()); } }}
            />
            <Button variant="secondary" onClick={() => { setServiceQuery(''); setServicesCache([]); setServicesError(null); }}>Clear</Button>
          </div>
          {servicesLoading && <div className="text-sm">Searching/creating services…</div>}
          {servicesError && <div className="text-sm text-red-600">{servicesError}</div>}

          {/* Line items table with inline suggestion-enabled service input */}
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
                  <tr key={`${li.hospitalServiceId ?? li.localId}-${idx}`} className="border-t">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-full">
                          <InlineServiceInput
                            value={li.serviceName}
                            onChange={(v) => updateLineItem(idx, { serviceName: v })}
                            onSelectService={(s) => updateLineItem(idx, { serviceName: s.name, hospitalServiceId: s.id })}
                            onCreateService={async (name) => {
                              // create and return the created service
                              const created = await createServiceOnServer(name);
                              // ensure the line reflects the saved id
                              updateLineItem(idx, { hospitalServiceId: created.id, serviceName: created.name });
                              return created;
                            }}
                          />
                        </div>
                        {li.hospitalServiceId ? <span className="text-xs text-green-600">Saved</span> : <span className="text-xs text-yellow-600">Local</span>}
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
                        {idx === lineItems.length - 1 && <Button variant="secondary" onClick={addBlankLine}>+ Add line</Button>}
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
