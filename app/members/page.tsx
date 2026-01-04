'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Member = {
  id: string;
  name: string;
  memberCode: string;
  passportPhotoUrl?: string | null;
  status: string;
  company?: { id: string; name: string } | null;
  category?: { id: string; name: string; coveragePercent: number | null } | null;
  coveragePercent?: number | null;
  companyName?: string | null;
  companyId?: string | null;
};

type Stats = {
  total: number;
  active: number;
  pending: number;
};

export default function MembersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
      router.push('/');
    }
  }, [session, sessionStatus, router]);

  // Fetch members with debounced search
  useEffect(() => {
    let cancelled = false;
    
    async function fetchMembers() {
      if (sessionStatus === 'loading') return;
      
      setSearchLoading(true);
      setError(null);
      
      try {
        const searchUrl = query.trim() 
          ? `/api/members?q=${encodeURIComponent(query.trim())}` 
          : '/api/members';
        
        const res = await fetch(searchUrl);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to fetch members' }));
          throw new Error(errorData.error || `Failed to fetch members: ${res.status}`);
        }
        
        const data = await res.json();
        if (!cancelled) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        console.error('Error fetching members:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load members');
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
          setLoading(false);
        }
      }
    }

    // Debounce search - wait 300ms after user stops typing
    const timeoutId = setTimeout(() => {
      fetchMembers();
    }, query.trim() ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, sessionStatus]);

  // Fetch stats once on mount
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    
    async function fetchStats() {
      try {
        // Fetch all members to calculate stats
        const res = await fetch('/api/members');
        if (res.ok) {
          const allMembers = await res.json();
          const total = allMembers.length;
          const active = allMembers.filter((m: Member) => m.status === 'Active').length;
          const pending = allMembers.filter((m: Member) => m.status === 'Pending').length;
          setStats({ total, active, pending });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    
    fetchStats();
  }, [sessionStatus]);

  if (sessionStatus === 'loading') {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    return null;
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
          <div className="space-y-2 text-sm sm:text-base">
            <Link href="/members/new" className="block text-brand hover:text-brand-dark py-1">
              Create New Member
            </Link>
            <Link href="/cards" className="block text-brand hover:text-brand-dark py-1">
              Manage Cards
            </Link>
            <Link href="/billing" className="block text-brand hover:text-brand-dark py-1">
              Billing & Invoices
            </Link>
            <Link href="/members/bulk" className="block text-brand hover:text-brand-dark py-1">
              Bulk Import/Update
            </Link>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Statistics</h3>
          {stats ? (
            <div className="space-y-2 text-sm sm:text-base text-gray-600">
              <p>Total Members: <span className="font-semibold">{stats.total}</span></p>
              <p>Active Members: <span className="font-semibold">{stats.active}</span></p>
              <p>Pending Members: <span className="font-semibold">{stats.pending}</span></p>
            </div>
          ) : (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Member Management</h1>
        <Link 
          href="/members/new" 
          className="w-full sm:w-auto bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Add New Member
        </Link>
      </div>
      
      <p className="text-sm sm:text-base text-gray-600">
        Manage insurance member records and information.
      </p>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Member List</h2>
        
        {/* Search Input */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or member code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-full sm:w-auto border rounded px-4 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm sm:text-base"
            >
              Clear
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !searchLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && members.length === 0 && (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              {query.trim() ? `No members found matching "${query}".` : 'No members found. Create your first member.'}
            </p>
          </div>
        )}

        {/* Members Table */}
        {!loading && members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="py-2 pr-2 sm:pr-4">Photo</th>
                  <th className="py-2 pr-2 sm:pr-4">Name</th>
                  <th className="py-2 pr-2 sm:pr-4">ID</th>
                  <th className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">Company</th>
                  <th className="py-2 pr-2 sm:pr-4 hidden md:table-cell">Category</th>
                  <th className="py-2 pr-2 sm:pr-4 hidden lg:table-cell">Coverage</th>
                  <th className="py-2 pr-2 sm:pr-4">Status</th>
                  <th className="py-2 pr-2 sm:pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-2 sm:pr-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
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
                    </td>
                    <td className="py-2 pr-2 sm:pr-4 font-medium">{m.name}</td>
                    <td className="py-2 pr-2 sm:pr-4 text-xs sm:text-sm font-mono">{m.memberCode}</td>
                    <td className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">{m.company?.name || m.companyName || '-'}</td>
                    <td className="py-2 pr-2 sm:pr-4 hidden md:table-cell">{m.category?.name || '-'}</td>
                    <td className="py-2 pr-2 sm:pr-4 hidden lg:table-cell">{m.category?.coveragePercent ?? m.coveragePercent ?? 0}%</td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        m.status === 'Active' ? 'bg-green-100 text-green-800' :
                        m.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2 pr-2 sm:pr-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Link href={`/members/${m.id}/edit`} className="text-brand underline text-xs sm:text-sm hover:text-brand-dark">
                          Edit
                        </Link>
                        <Link href={`/members/${m.id}/delete`} className="text-red-600 underline text-xs sm:text-sm hover:text-red-700">
                          Delete
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results Count */}
        {!loading && members.length > 0 && (
          <div className="mt-4 text-xs sm:text-sm text-gray-500">
            Showing {members.length} {members.length === 1 ? 'member' : 'members'}
            {query.trim() && ` matching "${query}"`}
          </div>
        )}
      </div>
    </div>
  );
}
