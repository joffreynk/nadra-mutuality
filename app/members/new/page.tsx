'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

type Category = { id: string; name: string; coveragePercent: number, category: string};
type SimpleMember = { id: string; name: string; memberCode: string, isDependent: boolean, coveragePercent: number, category: string, companyId: string };
type Company = { id: string; name: string; };

export default function NewMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>({
    memberCode: '',
    name: '',
    dob: '',
    gender: 'Male',
    email: '',
    contact: '',
    address: '',
    idNumber: '',
    country: '',
    companyId: '',
    category: 'A',
    coveragePercent: 100,
    isDependent: false,
     familyRelationship: 'Child',
  });
  const [isDependent, setIsDependent] = useState(false);
  const [parentMemberId, setParentMemberId] = useState('');
  const [currentMember, setCurrentMember] = useState<SimpleMember | null>(null);
  const [parentMemberSearchQuery, setParentMemberSearchQuery] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [dependentProof, setDependentProof] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [parents, setParents] = useState<SimpleMember[]>([]);
  const [dependents, setDependents] = useState<SimpleMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const fetchData = async () => {
      const cres = await fetch('/api/admin/categories');
      if (cres.ok) setCategories(await cres.json());
      const q = parentMemberSearchQuery.trim();
      const url = q ? `/api/members?q=${encodeURIComponent(q)}` : '/api/members';
      const mres = await fetch(url);
      if (mres.ok) {
        const newmembers = await mres.json();
        setMembers(newmembers.map((m: any) => ({ id: m.id, name: m.name, memberCode: m.memberCode, isDependent: m.isDependent, category: m.category, coveragePercent: m.coveragePercent, companyId: m.companyId })));
        setParents(newmembers.map((m:any) => ({ id: m.id, name: m.name, memberCode: m.memberCode, isDependent: m.isDependent, category: m.category, coveragePercent: m.coveragePercent, companyId: m.companyId })).filter((m:any) => !m.isDependent));
        setDependents(newmembers.map((m: any) => ({ id: m.id, name: m.name, memberCode: m.memberCode, isDependent: m.isDependent, category: m.category, coveragePercent: m.coveragePercent, companyId: m.companyId })).filter((m:any) => m.isDependent));
        const newcode = `Nadra${String(parents.length + 1).padStart(4, "0")}`;
        setForm((prev: any) => ({ ...prev, memberCode: newcode }));
      }
      const compRes = await fetch(`/api/admin/companies?q=${companySearchQuery}`);
      if (compRes.ok) setCompanies(await compRes.json());
    };

  useEffect(() => {
    const id = setTimeout(() => {
    fetchData(); // your fetch function that calls /api/members
  }, 350);
  return () => clearTimeout(id);
  }, [parentMemberSearchQuery, companySearchQuery]);



// Replace your second useEffect with this
useEffect(() => {
  if (isDependent) {
    // find parent based on the current parents array (derived from members)
    const parent = parents.find(m => m.memberCode === parentMemberId) || null;
    setCurrentMember(parent);
    // compute dependent index/count using the dependents array (derived from members)
    const code = dependents.filter(me => me.memberCode.includes(parentMemberId)).length + 1;
    const newcode = `${parentMemberId}/${code}`;
    // Use parent directly (not currentMember which hasn't updated yet)
    setForm((prev:any) => ({
      ...prev,
      memberCode: newcode,
      isDependent: true,
      category: parent?.category ?? prev.category,
      coveragePercent: parent?.coveragePercent ?? prev.coveragePercent,
      companyId: parent?.companyId ?? prev.companyId,
    }));
  } else {
    // non-dependent — recompute top-level code from parents count
        const newcode = `Nadra${String(parents.length + 1).padStart(4, '0')}`;
        setForm((prev:any) => ({ ...prev, memberCode: newcode, isDependent: false }));
        setCurrentMember(null);
      }
    }, [parentMemberId, isDependent, currentMember, parents, dependents]);

    console.log(form);
    

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true); // Set loading to true on submission

    try {
      let dependentProofUrl = '';
      let passportPhotoUrl = '';

      // Handle passport photo first to ensure data is available for validation
      if (passportFile) {
        const fd = new FormData();
        fd.append('file', passportFile);
        const up = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!up.ok) throw new Error('Passport photo upload failed');
        const upj = await up.json();
        passportPhotoUrl = upj.url;
      } else {
        throw new Error('Passport photo is required');
      }

      if (isDependent) {
        if (dependentProof) {
          const fd = new FormData();
          fd.append('file', dependentProof);
          const dp = await fetch('/api/uploads', { method: 'POST', body: fd });
          if (!dp.ok) throw new Error('Dependent proof upload failed');
          const dpj = await dp.json();
          dependentProofUrl = dpj.url;
        } else {
          throw new Error('Dependent proof is required for dependent members');
        }
        if (!parentMemberId) throw new Error('Parent member is required for dependent members');
        if (!form.familyRelationship) throw new Error('Family relationship is required for dependent members');
      }

      const payload = {
        memberCode: form.memberCode,
        name: form.name,
        dob: form.dob,
        gender: form.gender,
        email: form.email,
        contact: form.contact,
        address: form.address,
        idNumber: form.idNumber,
        country: form.country,
        companyId: form.companyId || null,
        category: form.category,
        coveragePercent: form.coveragePercent,
        passportPhotoUrl: passportPhotoUrl,
        dependentProofUrl: dependentProofUrl || null,
        isDependent: isDependent,
        familyRelationship: isDependent ? form.familyRelationship : null, // Conditionally include familyRelationship
        parentMemberId: isDependent ? parentMemberId : null, // Conditionally include parentMemberId
      };

      // Basic client-side validation using Zod (optional, but good practice)
      const validationSchema = z.object({
        memberCode: z.string().min(5, 'Member code is required'),
        name: z.string().min(2, 'Name is required'),
        dob: z.string().min(1, 'Date of Birth is required'),
        gender: z.string().min(1, 'Gender is required'),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
        contact: z.string().optional(),
        address: z.string().optional(),
        idNumber: z.string().optional(),
        country: z.string().optional(),
        companyId: z.string().optional().nullable(),
        category: z.string().min(1, 'Category is required'),
        coveragePercent: z.coerce.number().min(20).max(100, 'Coverage percent must be between 20 and 100'),
        passportPhotoUrl: z.string().min(5, 'Passport photo is required'),
        dependentProofUrl: z.string().optional().nullable(),
        isDependent: z.boolean(),
        familyRelationship: z.string().optional().nullable(),
        parentMemberId: z.string().optional().nullable(),
      });

      const parsed = validationSchema.safeParse(payload);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        const errorMessages = Object.entries(fieldErrors)
          .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
          .join('; ');
        setError(`Please check the form: ${errorMessages}`);
        return;
      }

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create member');
      }
      setSuccess('Member created');
      // Reset form after successful submission
      setForm({
        memberCode: '',
        name: '',
        dob: '',
        gender: 'Male',
        email: '',
        contact: '',
        address: '',
        idNumber: '',
        country: '',
        companyId: '',
        category: 'A',
        coveragePercent: 100,
        isDependent: false,
        familyRelationship: '',
      });
      setIsDependent(false);
      setParentMemberId('');
      setPassportFile(null);
      setDependentProof(null);
      setSelectedCompanyId(null);
      setCompanySearchQuery('');
      await fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
      console.log('SBMIT ERROR', err);

    } finally {
      setLoading(false); // Set loading to false after submission attempt
    }
  }
  
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Member or Dependent</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDependent} onChange={(e) =>  setIsDependent(e.target.checked)} />
          Create as Dependent
        </label>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Parent Member</label>
              <input
                type="text"
                className="mt-1 w-full border rounded p-2"
                placeholder="Search by ID or name..."
                value={parentMemberSearchQuery}
                onChange={(e) => setParentMemberSearchQuery(e.target.value)}
              />
              <select className="mt-1 w-full border rounded p-2" value={parentMemberId} onChange={(e) => setParentMemberId(e.target.value)}>
                <option value="">Select...</option>
                {parents.map((m) => (
                  <option key={m.memberCode} value={m.memberCode}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Relationship <span className="text-red-500">*</span></label>
              <select className="mt-1 w-full border rounded p-2" value={form.familyRelationship} onChange={(e) => setForm({ ...form, familyRelationship: e.target.value })} required>
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
          <input className="mt-1 w-full border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select className="mt-1 w-full border rounded p-2" value={form.gender ?? 'Male'} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full border rounded p-2" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input type="date" className="mt-1 w-full border rounded p-2" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        </div>
        {
          !isDependent ? (
            <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select className="mt-1 w-full border rounded p-2" value={form.category} onChange={(e) => {
              const v = e.target.value; setForm({ ...form, category: v, coveragePercent: categories.find(c => c.name === v)?.coveragePercent ?? form.coveragePercent });
            }}>
              {categories.length === 0 && <option>A</option>}
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Coverage %</label>
            <input type="number" className="mt-1 w-full border rounded p-2" value={form.coveragePercent} onChange={(e) => setForm({ ...form, coveragePercent:  Number(e.target.value)})} />
          </div>
        </div>
          ) : null
        }
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Contact</label>
            <input className="mt-1 w-full border rounded p-2" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">ID Number</label>
            <input className="mt-1 w-full border rounded p-2" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
          </div>
        </div>
        {!isDependent && (
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input className="mt-1 w-full border rounded p-2" value={form.country ?? ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
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
            <select className="mt-1 w-full border rounded p-2" value={selectedCompanyId ?? ''} onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setForm({ ...form, companyId: e.target.value })
            }}>
              <option value="">Select...</option>
              {companies.map((c) => (
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
            <input type="file" accept="image/*" className="mt-1 w-full border rounded p-2" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} required />
          </div>
          {isDependent && (
            <div>
              <label className="block text-sm font-medium">Dependent Proof (PDF)</label>
              <input type="file" accept="application/pdf" className="mt-1 w-full border rounded p-2" onChange={(e) => setDependentProof(e.target.files?.[0] ?? null)} required={isDependent && !dependentProof} />
              <p className="text-xs text-gray-500 mt-1">Spouse: marriage certificate; Child: birth/adoption certificate.</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input className="mt-1 w-full border rounded p-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <div className="flex gap-2 justify-end mt-4">
          <button type="button" className="px-4 py-2 border rounded" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-brand text-white rounded" disabled={loading}>Save</button>
        </div>
      </form>
      <div className="mt-8">
        <a className="text-brand underline" href="/members/bulk">Bulk import members</a>
      </div>
    </div>
  );
}


