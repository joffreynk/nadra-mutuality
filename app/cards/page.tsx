"use client";

import { Decimal } from "@prisma/client/runtime/library";
import Image from "next/image";
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
  }, []);

  // Fetch members on mount and when query changes (for server-side search)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingMembers(true);
      setError(null);
      try {
        const searchUrl = query.trim() ? `/api/members?q=${encodeURIComponent(query.trim())}` : '/api/members';
        const res = await fetch(searchUrl);
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
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      load();
    }, query.trim() ? 300 : 0);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  // Show all members when no query, or filter when query exists
  const filtered = useMemo(() => {
    if (!query.trim()) return members;
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (m.memberCode && m.memberCode.toLowerCase().includes(q)) return true;
      if (m.name && m.name.toLowerCase().includes(q)) return true;
      if (m.company?.name && m.company.name.toLowerCase().includes(q)) return true;
      if (m.category?.name && m.category.name.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [members, query]);

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
      const url = `/api/cards`;
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
    generateCardFor(member);
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Member Card Generator</h2>
          <p className="text-xs sm:text-sm text-gray-500">Search by name, member code, company or category</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            aria-label="Search members"
            placeholder="Search member name, code or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => {
              setQuery("");
            }}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm sm:text-base transition-colors"
            title="Clear"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* left: list */}
          <div className="md:col-span-2 bg-white rounded shadow-sm overflow-auto max-h-[60vh]">
            {loadingMembers ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading members...</div>
            ) : error ? (
              <div className="p-4 text-red-600 text-sm bg-red-50 rounded">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-gray-600 text-sm text-center">
                {query.trim() ? `No members match "${query}".` : members.length === 0 ? "No members found. Please add members first." : "No members match your search."}
              </div>
            ) : (
              <ul>
                {filtered.map((m) => (
                  <li
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                      selected?.id === m.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {m.passportPhotoUrl ? (
                        <Image
                          width={56}
                          height={56}
                          src={m.passportPhotoUrl}
                          alt={`${m.name} avatar`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm sm:text-base">{m.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {m.memberCode} • {m.category?.name ?? "—"} • {m.category?.coveragePercent?.toString().concat("%") ?? "—"}
                      </div>
                      {m.company?.name && <div className="text-xs sm:text-sm text-gray-400 truncate">{m.company.name}</div>}
                    </div>

                    <div className="text-xs sm:text-sm text-gray-500">
                      {m.isDependent ? <span className="text-red-600">Dependent</span> : <span>Member</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* right: preview + actions */}
          <div className="md:col-span-1 bg-white rounded shadow-sm p-3 sm:p-4 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
              {!selected ? (
                <div className="text-center text-gray-500 text-sm">Select a member to preview card</div>
              ) : generating ? (
                <div className="text-center">
                  <div className="mb-2 text-sm">Generating card...</div>
                  <div className="h-32 sm:h-40 w-48 sm:w-60 bg-gray-100 animate-pulse rounded" />
                </div>
              ) : cardUrl ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <img src={cardUrl} alt={`Card ${selected.memberCode}`} className="w-full h-auto rounded shadow" />
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <a
                      href={cardUrl}
                      download={`card-${selected.memberCode}.png`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded shadow hover:opacity-95 text-center text-sm transition-opacity"
                    >
                      Download PNG
                    </a>
                    <button
                      onClick={() => generateCardFor(selected)}
                      className="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm">No preview yet — select a member to generate card.</div>
              )}
            </div>

            {/* small meta area */}
            <div className="mt-4 w-full text-xs sm:text-sm text-gray-600">
              <div className="flex justify-between">
                <div>Selected:</div>
                <div className="font-medium">{selected?.name ?? "—"}</div>
              </div>
              <div className="flex justify-between">
                <div>Member code:</div>
                <div className="font-medium">{selected?.memberCode ?? "—"}</div>
              </div>

              {error && <div className="mt-2 text-red-600 text-xs">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
