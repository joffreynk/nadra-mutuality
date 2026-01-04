'use client';
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
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Claims Management</h1>
        <Link
          href="/hospital/claims/new"
          className="w-full sm:w-auto bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Submit New Claim
        </Link>
      </div>
      <p className="text-sm sm:text-base text-gray-600">
        Submit and track treatment claims for members.
      </p>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm sm:text-base font-semibold mb-2">Total Claims</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{totalClaims}</p>
              <p className="text-xs sm:text-sm text-gray-600">Submitted</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm sm:text-base font-semibold mb-2">Approved Claims</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{approvedClaims}</p>
              <p className="text-xs sm:text-sm text-gray-600">Processed</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm sm:text-base font-semibold mb-2">Pending Claims</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{pendingClaims}</p>
              <p className="text-xs sm:text-sm text-gray-600">Under review</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm sm:text-base font-semibold mb-2">Rejected Claims</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{rejectedClaims}</p>
              <p className="text-xs sm:text-sm text-gray-600">This month</p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Claims</h2>
            <div className="space-y-2 text-sm">
              {claims.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">No claims found. Start by submitting claims for treatments provided.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="space-y-2 min-w-full">
                    {claims.slice(0, 10).map((c: any) => (
                      <div key={c.id} className="border rounded p-3 hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-xs sm:text-sm break-words">
                          {c.id.slice(0, 8)} • {new Date(c.createdAt).toLocaleString()} • {c.state}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mt-1">
                          Period: {new Date(c.periodStart).toLocaleDateString()} → {new Date(c.periodEnd).toLocaleDateString()}
                        </div>
                        {c.totalAmount && (
                          <div className="text-xs sm:text-sm font-semibold mt-1">Total Amount: ${c.totalAmount}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 text-sm sm:text-base">
            <Link href="/hospital/claims/new" className="block text-brand hover:text-brand-dark py-1">
              Submit New Claim
            </Link>
            <Link href="/hospital/claims/bulk" className="block text-brand hover:text-brand-dark py-1">
              Bulk Claim Submission
            </Link>
            <Link href="/hospital/claims/track" className="block text-brand hover:text-brand-dark py-1">
              Track Claim Status
            </Link>
            <Link href="/hospital/claims/history" className="block text-brand hover:text-brand-dark py-1">
              Claim History
            </Link>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Claim Statistics</h3>
          <div className="space-y-2 text-sm sm:text-base text-gray-600">
            <p>Total Amount Claimed: <span className="font-semibold">${totalAmount.toFixed(2)}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
