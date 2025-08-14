'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const memberSchema = z.object({
  mainId: z.string().min(3),
  name: z.string().min(2),
  dob: z.string(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  idNumber: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
  category: z.string().min(2),
  coveragePercent: z.coerce.number().min(0).max(100),
  passportPhotoId: z.string().optional(),
  passportPhotoUrl: z.string().url().optional()
});

type Category = { id: string; name: string; coveragePercent: number };
type SimpleMember = { id: string; name: string };

export default function NewMemberPage() {
  const [form, setForm] = useState<any>({
    mainId: '',
    name: '',
    dob: '',
    gender: '',
    email: '',
    contact: '',
    address: '',
    idNumber: '',
    country: '',
    companyName: '',
    category: 'A',
    coveragePercent: 100
  });
  const [isDependent, setIsDependent] = useState(false);
  const [relationship, setRelationship] = useState('Child');
  const [parentMemberId, setParentMemberId] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [dependentProof, setDependentProof] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cres = await fetch('/api/admin/categories');
      if (cres.ok) setCategories(await cres.json());
      const mres = await fetch('/api/members');
      if (mres.ok) setMembers((await mres.json()).map((m: any) => ({ id: m.id, name: `${m.name} (${m.mainId})` })));
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (isDependent) {
        if (!parentMemberId) throw new Error('Select parent member');
        if (!passportFile) throw new Error('Passport photo is required');
        // Upload passport photo
        const fdPhoto = new FormData();
        fdPhoto.append('file', passportFile);
        const upPhoto = await fetch('/api/uploads', { method: 'POST', body: fdPhoto });
        if (!upPhoto.ok) throw new Error('Upload failed');
        const upPhotoJ = await upPhoto.json();
        // Upload proof if provided
        let documentPayload: any = null;
        if (dependentProof) {
          const fd = new FormData();
          fd.append('file', dependentProof);
          const up = await fetch('/api/uploads', { method: 'POST', body: fd });
          if (!up.ok) throw new Error('Upload failed');
          const upj = await up.json();
          documentPayload = { filename: dependentProof.name, mimeType: dependentProof.type, size: dependentProof.size, cloudinaryId: upj.public_id };
        }
        const res = await fetch('/api/dependents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentMemberId, name: form.name, relationship, dob: form.dob, passportPhotoId: upPhotoJ.public_id, passportPhotoUrl: upPhotoJ.url, document: documentPayload })
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        const parsed = memberSchema.safeParse(form);
        if (!parsed.success) {
          setError('Please check the form');
          return;
        }
        // Handle passport photo
        if (!passportFile) throw new Error('Passport photo is required');
        const fd = new FormData();
        fd.append('file', passportFile);
        const up = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (!up.ok) throw new Error('Upload failed');
        const upj = await up.json();
        parsed.data.passportPhotoId = upj.public_id;
        parsed.data.passportPhotoUrl = upj.url;
        const res = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data)
        });
        if (!res.ok) throw new Error('Failed');
      }
      setSuccess('Member created');
      setForm({ mainId: '', name: '', dob: '', contact: '', address: '', idNumber: '', category: 'Basic', coveragePercent: 100 });
      setParentMemberId('');
      setPassportFile(null);
      setDependentProof(null);
    } catch (err) {
      setError('Failed to create member');
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Member or Dependent</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDependent} onChange={(e) => setIsDependent(e.target.checked)} />
          Create as Dependent
        </label>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Parent Member</label>
              <select className="mt-1 w-full border rounded p-2" value={parentMemberId} onChange={(e) => setParentMemberId(e.target.value)}>
                <option value="">Select...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Relationship</label>
              <select className="mt-1 w-full border rounded p-2" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                <option>Child</option>
                <option>Spouse</option>
                <option>Parent</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Main ID</label>
          <input className="mt-1 w-full border rounded p-2" value={form.mainId} onChange={(e) => setForm({ ...form, mainId: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="mt-1 w-full border rounded p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select className="mt-1 w-full border rounded p-2" value={form.gender ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select...</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
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
            <input type="number" className="mt-1 w-full border rounded p-2" value={form.coveragePercent} onChange={(e) => setForm({ ...form, coveragePercent: Number(e.target.value) })} />
          </div>
        </div>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input className="mt-1 w-full border rounded p-2" value={form.country ?? ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Company Name (if employed)</label>
            <input className="mt-1 w-full border rounded p-2" value={form.companyName ?? ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Passport Photo</label>
            <input type="file" accept="image/*" className="mt-1 w-full border rounded p-2" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} />
          </div>
          {isDependent && (
            <div>
              <label className="block text-sm font-medium">Dependent Proof (PDF)</label>
              <input type="file" accept="application/pdf" className="mt-1 w-full border rounded p-2" onChange={(e) => setDependentProof(e.target.files?.[0] ?? null)} />
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
        <button type="submit" className="bg-brand text-white px-4 py-2 rounded">Save</button>
      </form>
      <div className="mt-8">
        <a className="text-brand underline" href="/members/bulk">Bulk import members</a>
      </div>
    </div>
  );
}


