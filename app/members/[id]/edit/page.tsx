'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [form, setForm] = useState<any>(null);
  const [isDependent, setIsDependent] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [parentMemberId, setParentMemberId] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [dependentProof, setDependentProof] = useState<File | null>(null);
  const [passportPhotoUrl, setPassportPhotoUrl] = useState<string | null>(null); // For displaying existing URL
  const [dependentProofUrl, setDependentProofUrl] = useState<string | null>(null); // For displaying existing URL
  const [categories, setCategories] = useState<any[]>([]); // To fetch categories for dropdown
  const [companies, setCompanies] = useState<any[]>([]); // To fetch companies for dropdown
  const [parents, setParents] = useState<any[]>([]); // For parent member selection
  const [parentMemberSearchQuery, setParentMemberSearchQuery] = useState('');
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch member data
        const memberRes = await fetch(`/api/members/${id}`);
        if (!memberRes.ok) throw new Error('Member not found');
        const memberData = await memberRes.json();
        setForm({ 
          ...memberData, 
          dob: memberData.dob ? new Date(memberData.dob).toISOString().split('T')[0] : '' // Format DOB for input
        });
        setIsDependent(memberData.isDependent);
        setRelationship(memberData.relationship || '');
        setParentMemberId(memberData.parentMemberId || '');
        setPassportPhotoUrl(memberData.passportPhotoUrl || null);
        setDependentProofUrl(memberData.dependentProofUrl || null);
        setSelectedCompanyId(memberData.companyId || null);

        // Fetch categories
        const categoriesRes = await fetch('/api/admin/categories');
        if (categoriesRes.ok) setCategories(await categoriesRes.json());

        // Fetch companies (initial load)
        const companiesRes = await fetch('/api/admin/companies');
        if (companiesRes.ok) setCompanies(await companiesRes.json());

        // Fetch parents for dependent selection
        const parentsRes = await fetch('/api/members?isDependent=false'); // Assuming API supports filtering non-dependent members
        if (parentsRes.ok) setParents(await parentsRes.json());

      } catch (err: any) {
        setError(err.message || 'Failed to fetch member data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const id = setTimeout(async () => {
      // Refetch companies based on search query
      const compRes = await fetch(`/api/admin/companies?q=${companySearchQuery}`);
      if (compRes.ok) setCompanies(await compRes.json());
    }, 350);
    return () => clearTimeout(id);
  }, [companySearchQuery]);

  useEffect(() => {
    const id = setTimeout(async () => {
      // Refetch parents based on search query
      const parentsRes = await fetch(`/api/members?q=${encodeURIComponent(parentMemberSearchQuery)}&isDependent=false`);
      if (parentsRes.ok) setParents(await parentsRes.json());
    }, 350);
    return () => clearTimeout(id);
  }, [parentMemberSearchQuery]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let updatedPassportPhotoUrl = passportPhotoUrl;
      let updatedDependentProofUrl = dependentProofUrl;

      if (passportFile) {
        const fd = new FormData();
        fd.append('file', passportFile);
        const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Passport photo upload failed');
        const uploadData = await uploadRes.json();
        updatedPassportPhotoUrl = uploadData.url;
      }

      if (isDependent && dependentProof) {
        const fd = new FormData();
        fd.append('file', dependentProof);
        const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Dependent proof upload failed');
        const uploadData = await uploadRes.json();
        updatedDependentProofUrl = uploadData.url;
      }

      // Client-side validation for dependent fields
      if (isDependent) {
        if (!parentMemberId) throw new Error('Parent member is required for dependent members');
        if (!relationship) throw new Error('Relationship is required for dependent members');
        if (!updatedDependentProofUrl) throw new Error('Dependent proof is required for dependent members');
      }

      const payload = {
        ...form,
        dob: form.dob,
        isDependent: isDependent,
        relationship: isDependent ? relationship : null,
        parentMemberId: isDependent ? parentMemberId : null,
        passportPhotoUrl: updatedPassportPhotoUrl,
        dependentProofUrl: updatedDependentProofUrl || null,
        companyId: selectedCompanyId || null,
      };

      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update member');
      }
      router.push('/members'); // Redirect to members list on success
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!form) return <div className="p-6">Not found</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Member</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDependent} onChange={(e) => setIsDependent(e.target.checked)} />
          Is Dependent
        </label>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Parent Member <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="mt-1 w-full border rounded p-2"
                placeholder="Search by ID or name..."
                value={parentMemberSearchQuery}
                onChange={(e) => setParentMemberSearchQuery(e.target.value)}
              />
              <select className="mt-1 w-full border rounded p-2" value={parentMemberId} onChange={(e) => setParentMemberId(e.target.value)} required>
                <option value="">Select...</option>
                {parents.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.memberCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Relationship <span className="text-red-500">*</span></label>
              <select className="mt-1 w-full border rounded p-2" value={relationship} onChange={(e) => setRelationship(e.target.value)} required>
                <option>Child</option>
                <option>Spouse</option>
                <option>Parent</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="mt-1 w-full border rounded p-2" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select className="mt-1 w-full border rounded p-2" value={form.gender ?? 'Male'} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full border rounded p-2" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input type="date" className="mt-1 w-full border rounded p-2" value={form.dob || ''} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
        </div>
        {!isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select className="mt-1 w-full border rounded p-2" value={form.category || ''} onChange={(e) => {
                const v = e.target.value; setForm({ ...form, category: v, coveragePercent: categories.find(c => c.name === v)?.coveragePercent ?? form.coveragePercent });
              }} required>
                {categories.length === 0 && <option value="">Loading...</option>}
                {categories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Coverage %</label>
              <input type="number" className="mt-1 w-full border rounded p-2" value={form.coveragePercent || 0} onChange={(e) => setForm({ ...form, coveragePercent: Number(e.target.value) })} required />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Contact</label>
            <input className="mt-1 w-full border rounded p-2" value={form.contact || ''} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">ID Number</label>
            <input className="mt-1 w-full border rounded p-2" value={form.idNumber || ''} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
          </div>
        </div>
        {!isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input className="mt-1 w-full border rounded p-2" value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium">Company (if employed)</label>
              <input
                type="text"
                className="mt-1 w-full border rounded p-2"
                placeholder="Search or type to add new company..."
                value={companySearchQuery}
                onChange={(e) => setCompanySearchQuery(e.target.value)}
              />
              <select className="mt-1 w-full border rounded p-2" value={selectedCompanyId || ''} onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setForm({ ...form, companyId: e.target.value })
              }}>
                <option value="">Select...</option>
                {companies.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {companySearchQuery && !companies.some(c => c.name.toLowerCase() === companySearchQuery.toLowerCase()) && (
                <button type="button" onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: companySearchQuery }) });
                    if (!res.ok) throw new Error('Failed to create company');
                    const newCompany = await res.json();
                    setCompanies([...companies, newCompany]);
                    setSelectedCompanyId(newCompany.id);
                    setCompanySearchQuery('');
                    alert('New company created and selected!');
                  } catch (err: any) {
                    alert(`Error creating company: ${err.message}`);
                  }
                }} className="text-brand text-sm mt-1">Create new company &quot;{companySearchQuery}&quot;</button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Passport Photo</label>
            {passportPhotoUrl && !passportFile ? (
              <p className="text-xs text-gray-500 mb-1">Current: <a href={passportPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline">View Photo</a></p>
            ) : null}
            <input type="file" accept="image/*" className="mt-1 w-full border rounded p-2" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} />
            {!passportPhotoUrl && !passportFile && <p className="text-sm text-red-600">Passport photo is required</p>}
          </div>
          {isDependent && (
            <div>
              <label className="block text-sm font-medium">Dependent Proof (PDF)</label>
              {dependentProofUrl && !dependentProof ? (
                <p className="text-xs text-gray-500 mb-1">Current: <a href={dependentProofUrl} target="_blank" rel="noopener noreferrer" className="text-brand underline">View Proof</a></p>
              ) : null}
              <input type="file" accept="application/pdf" className="mt-1 w-full border rounded p-2" onChange={(e) => setDependentProof(e.target.files?.[0] ?? null)} />
              {!dependentProofUrl && !dependentProof && <p className="text-sm text-red-600">Dependent proof is required</p>}
              <p className="text-xs text-gray-500 mt-1">Spouse: marriage certificate; Child: birth/adoption certificate.</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Address</label>
          <input className="mt-1 w-full border rounded p-2" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2 justify-end mt-4">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="bg-brand text-white rounded px-4 py-2" disabled={loading}>Save</button>
        </div>
      </form>
    </div>
  );
}


