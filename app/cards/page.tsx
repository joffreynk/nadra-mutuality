"use client";

import { Decimal } from "@prisma/client/runtime/library";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Member = {
  id: string;
  name: string;
  memberCode: string;
  passportPhotoUrl?: string | null;
  isDependent?: boolean;
  familyRelationship?: string | null;
  category?: { name?: string, coveragePercent: Decimal } | null;
  company?: { name?: string } | null;
};

export default function CardGeneratorClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (cardUrl) URL.revokeObjectURL(cardUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch members once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingMembers(true);
      setError(null);
      try {
        const res = await fetch(`api/members`);
        if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
        const data = (await res.json()) as Member[];
        if (!cancelled && mountedRef.current) setMembers(data || []);
      } catch (err: any) {
        console.error(err);
        if (!cancelled && mountedRef.current) setError(err?.message ?? "Error loading members");
      } finally {
        if (!cancelled && mountedRef.current) setLoadingMembers(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [members.length]);

  // Debounced local filter: small client-side debounce
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return members;
    return members.filter((m) => {
      const q = debouncedQuery;
      if (m.memberCode && m.memberCode.toLowerCase().includes(q)) return true;
      if (m.name && m.name.toLowerCase().includes(q)) return true;
      if (m.company?.name && m.company.name.toLowerCase().includes(q)) return true;
      if (m.category?.name && m.category.name.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [members, debouncedQuery]);

  // Generate card for selected member
  async function generateCardFor(member: Member) {
    try {
      setGenerating(true);
      setError(null);
      if (cardUrl) {
        URL.revokeObjectURL(cardUrl);
        setCardUrl(null);
      }
      // Hit the server-side endpoint which returns a PNG
      const url = `api/cards`;
      const res = await fetch(url, 
        {method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, memberCode: member.memberCode }),
      }
      );
      if (!res.ok) throw new Error(`Card generation failed: ${res.status}`);
      const CardUrl = await res.json();
      if (mountedRef.current) setCardUrl(CardUrl.url);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Error generating card");
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  }

  function handleSelect(member: Member) {
    setSelected(member);
    // auto-generate when a member is selected
    generateCardFor(member);
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Member card generator</h2>
          <p className="text-sm text-gray-500">Search by name, member code, company or category</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <input
            aria-label="Search members"
            placeholder="Search member name, code or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => {
              setQuery("");
            }}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
            title="Clear"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* left: list */}
          <div className="md:col-span-2 bg-white rounded shadow-sm overflow-auto max-h-[60vh]">
            {loadingMembers ? (
              <div className="p-4">Loading members...</div>
            ) : error ? (
              <div className="p-4 text-red-600">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-gray-600">No members match your search.</div>
            ) : (
              <ul>
                {filtered.map((m) => (
                  <li
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selected?.id === m.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {m.passportPhotoUrl ? (
                        // plain <img> — expects public paths or full URLs
                        // Next/Image avoided for simplicity inside a client component
                        <img
                          src={m.passportPhotoUrl}
                          alt={`${m.name} avatar`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-sm text-gray-500 truncate">{m.memberCode} • {m.category?.name ?? "—"} • {m.category?.coveragePercent.toString().concat("%") ?? "—"}</div>
                      {m.company?.name ? <div className="text-sm text-gray-400 truncate">{m.company.name}</div> : null}
                    </div>

                    <div className="text-sm text-gray-500">
                      {m.isDependent ? <span className="text-red-600">Dependent</span> : <span>Member</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* right: preview + actions */}
          <div className="md:col-span-1 bg-white rounded shadow-sm p-4 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              {!selected ? (
                <div className="text-center text-gray-500">Select a member to preview card</div>
              ) : generating ? (
                <div className="text-center">
                  <div className="mb-2">Generating card...</div>
                  <div className="h-40 w-60 bg-gray-100 animate-pulse rounded" />
                </div>
              ) : cardUrl ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <img src={cardUrl} alt={`Card ${selected.memberCode}`} className="w-full h-auto rounded shadow" />
                  <div className="flex gap-2">
                    <a
                      href={cardUrl}
                      download={`card-${selected.memberCode}.png`}
                      className="px-3 py-2 bg-blue-600 text-white rounded shadow hover:opacity-95"
                    >
                      Download PNG
                    </a>
                    <button
                      onClick={() => generateCardFor(selected)}
                      className="px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">No preview yet — select a member to generate card.</div>
              )}
            </div>

            {/* small meta area */}
            <div className="mt-4 w-full text-sm text-gray-600">
              <div className="flex justify-between">
                <div>Selected:</div>
                <div className="font-medium">{selected?.name ?? "—"}</div>
              </div>
              <div className="flex justify-between">
                <div>Member code:</div>
                <div className="font-medium">{selected?.memberCode ?? "—"}</div>
              </div>

              {error ? <div className="mt-2 text-red-600">{error}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
