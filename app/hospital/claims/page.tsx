'use client'
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HospitalClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/hospital/claims');
        if (!res.ok) throw new Error('Failed to fetch claims');
        setClaims(await res.json());
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calculate statistics
  const totalClaims = claims.length;
  const approvedClaims = claims.filter((c: any) => c.state === 'Approved').length;
  const pendingClaims = claims.filter((c: any) => c.state === 'Pending' || c.state === 'Submitted').length;
  const rejectedClaims = claims.filter((c: any) => c.state === 'Rejected').length;
  const totalAmount = claims.reduce((acc: number, c: any) => acc + (c.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <Link 
          href="/hospital/claims/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Submit New Claim
        </Link>
      </div>
      <p className="text-gray-600">
        Submit and track treatment claims for members.
      </p>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-2">Total Claims</h3>
              <p className="text-3xl font-bold text-blue-600">{totalClaims}</p>
              <p className="text-sm text-gray-600">Submitted</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-2">Approved Claims</h3>
              <p className="text-3xl font-bold text-green-600">{approvedClaims}</p>
              <p className="text-sm text-gray-600">Processed</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-2">Pending Claims</h3>
              <p className="text-3xl font-bold text-orange-600">{pendingClaims}</p>
              <p className="text-sm text-gray-600">Under review</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-2">Rejected Claims</h3>
              <p className="text-3xl font-bold text-red-600">{rejectedClaims}</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Recent Claims</h2>
            <div className="space-y-2 text-sm">
              {claims.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">No claims found. Start by submitting claims for treatments provided.</p>
                </div>
              ) : (
                claims.slice(0, 10).map((c: any) => (
                  <div key={c.id} className="border rounded p-3">
                    <div className="font-medium">{c.id.slice(0,8)} • {new Date(c.createdAt).toLocaleString()} • {c.state}</div>
                    <div>Period: {new Date(c.periodStart).toLocaleDateString()} → {new Date(c.periodEnd).toLocaleDateString()}</div>
                    {c.totalAmount && <div>Total Amount: ${c.totalAmount}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/hospital/claims/new" className="block text-brand hover:text-brand-dark">
              Submit New Claim
            </Link>
            <Link href="/hospital/claims/bulk" className="block text-brand hover:text-brand-dark">
              Bulk Claim Submission
            </Link>
            <Link href="/hospital/claims/track" className="block text-brand hover:text-brand-dark">
              Track Claim Status
            </Link>
            <Link href="/hospital/claims/history" className="block text-brand hover:text-brand-dark">
              Claim History
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Claim Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Total Amount Claimed: <span className="font-semibold">${totalAmount}</span></p>
            {/* Add more statistics as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
