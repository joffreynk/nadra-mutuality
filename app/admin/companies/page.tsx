'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Company = { id: string; name: string; phoneNumber?: string; email?: string; address?: string };

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  async function fetchCompanies() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies${searchQuery && `?q=${searchQuery}`}`);
      if (!res.ok) throw new Error('No company found');
      setCompanies(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, [searchQuery]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete company');
      }
      alert('Company deleted successfully!');
      fetchCompanies(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Companies</h1>

      {error && <p className="text-red-500 mb-4">Error: {error}</p>}

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search companies..."
          className="border rounded p-2 flex-grow mr-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Link href="/admin/companies/new" className="bg-brand text-white px-4 py-2 rounded">
          Add New Company
        </Link>
      </div>

      {loading ? (
        <p>Loading companies...</p>
      ) : companies.length === 0 ? (
        <p>No companies found. Create one to get started!</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{company.name}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{company.phoneNumber || '-'}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{company.email || '-'}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{company.address || '-'}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                    <Link href={`/admin/companies/${company.id}/edit`} className="text-brand hover:underline mr-3">Edit</Link>
                    <button onClick={() => handleDelete(company.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
