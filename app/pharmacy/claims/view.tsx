'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClaimsClient() {
  const [claims, setClaims] = useState<any[]>([]);
  useEffect(() => { (async () => { const r = await fetch('/api/pharmacy/claims'); if (r.ok) setClaims(await r.json()); })(); }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Claims</h1>
        <Link className="px-4 py-2 bg-brand text-white rounded" href="/pharmacy/claims/new">New Claim</Link>
      </div>
      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Claims</h2>
        <div className="space-y-2 text-sm">
          {claims.map((c) => (
            <div key={c.id} className="border rounded p-3">
              <div className="font-medium">{c.id.slice(0,8)} • {new Date(c.createdAt).toLocaleString()} • {c.state}</div>
              <div>{c.details}</div>
              <div>Amount: ${c.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


