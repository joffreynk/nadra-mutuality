'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  address: z.string().optional().nullable(),
});

export default function NewCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const parsed = companySchema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errorMessages = Object.entries(fieldErrors)
          .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
          .join('; ');
        setError(`Please check the form: ${errorMessages}`);
        return;
      }

      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create company');
      }
      setSuccess('Company created successfully!');
      setForm({ name: '', phoneNumber: '', email: '', address: '' }); // Clear form
      router.push('/admin/companies');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Create New Company</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input className="mt-1 w-full border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input className="mt-1 w-full border rounded p-2" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input type="email" className="mt-1 w-full border rounded p-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input className="mt-1 w-full border rounded p-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <div className="flex gap-2">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Company'}</button>
        </div>
      </form>
    </div>
  );
}
