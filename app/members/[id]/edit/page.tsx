"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

const validationSchema = z.object({
  memberCode: z.string().min(1).optional(),
  name: z.string().min(2, "Name is required"),
  dob: z.string().optional().nullable(),
  gender: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  categoryID: z.string().min(1, "Category is required"),
  passportPhotoUrl: z.string().optional().nullable(),
});

type Category = { id: string; name: string; coveragePercent?: number };
type Company = { id: string; name: string };

export default function EditMemberClient() {
  const router = useRouter();
  const [member, setMember] = useState<any | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<any>({});

  const params = useParams();
   
  const memberId = params?.id as string;

  useEffect(() => {
    if (!memberId) return;
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [mRes, cRes, compRes] = await Promise.all([
          fetch(`/api/members/${memberId}`, { credentials: "include" }),
          fetch(`/api/admin/categories?memberFor=${memberId}`, { credentials: "include" }),
          fetch(`/api/admin/companies?memberFor=${memberId}`, { credentials: "include" }),
        ]);

        if (!mRes.ok) throw new Error("Failed to load member");
        const mJson = await mRes.json();

        const catJson = cRes.ok ? await cRes.json() : [];
        const compJson = compRes.ok ? await compRes.json() : [];

        if (!mounted) return;
        
        setMember(mJson);
        setCategories(Array.isArray(catJson) ? catJson : []);
        setCompanies(Array.isArray(compJson) ? compJson : []);

        // initialize form state with member values
        setFormState({
          name: mJson.name ?? "",
          gender: mJson.gender ?? "Male",
          email: mJson.email ?? "",
          contact: mJson.contact ?? "",
          address: mJson.address ?? "",
          idNumber: mJson.idNumber ?? "",
          country: mJson.country ?? "",
          companyId: mJson.companyId ?? "",
          categoryID: mJson.categoryID ?? "",
          dob: mJson.dob ? new Date(mJson.dob).toISOString().slice(0, 10) : "",
        });
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [memberId]);

  if (!memberId) return <div>Member ID is required</div>;
  if (loading) return <div>Loading...</div>;
  if (!member) return <div>Member not found</div>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Build payload from formState and file input
      const form = new FormData(e.currentTarget);

      // Handle passport photo upload first (if any)
      const passportFile = form.get("passportPhoto") as File | null;
      let passportPhotoUrl = member.passportPhotoUrl ?? null;
      if (passportFile && passportFile.size > 0) {
        const fd = new FormData();
        fd.append("file", passportFile);
        const up = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "include" });
        if (!up.ok) {
          const text = await up.text();
          throw new Error(`Upload failed: ${text}`);
        }
        const upj = await up.json();
        passportPhotoUrl = upj.url;
      }

      // Merge values (form entries fallback to existing member fields)
      const payload = {
        ...member,
        name: (form.get("name") as string) || member.name,
        dob: (form.get("dob") as string) || (member.dob ? new Date(member.dob).toISOString().slice(0, 10) : null),
        gender: (form.get("gender") as string) || member.gender,
        email: (form.get("email") as string) || member.email,
        contact: (form.get("contact") as string) || member.contact,
        address: (form.get("address") as string) || member.address,
        idNumber: (form.get("idNumber") as string) || member.idNumber,
        country: (form.get("country") as string) || member.country,
        companyId: (form.get("companyId") as string) || member.companyId,
        categoryID: (form.get("categoryID") as string) || member.categoryID,
        passportPhotoUrl,
      };

      // Client-side validation using zod
      validationSchema.parse(payload);

      // Send update to server
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || `Update failed (status ${res.status}: ${j.error})`);
      }

      // Optionally revalidate on server via API or rely on Next's caching strategies
      router.push("/members");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormState((s: any) => ({ ...s, [name]: value }));
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Existing Member</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={formState.name}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select name="gender" value={formState.gender} onChange={onChange} className="mt-1 w-full border rounded p-2">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" name="email" value={formState.email} onChange={onChange} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>

        {!member.isDependent && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select name="categoryID" value={formState.categoryID} onChange={onChange} className="mt-1 w-full border rounded p-2">
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.coveragePercent ? `- ${c.coveragePercent}%` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Contact</label>
            <input name="contact" value={formState.contact} onChange={onChange} className="mt-1 w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">ID Number</label>
            <input name="idNumber" value={formState.idNumber} onChange={onChange} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input name="country" value={formState.country} onChange={onChange} className="mt-1 w-full border rounded p-2" />
          </div>

          {!member.isDependent && (
            <div>
              <label className="block text-sm font-medium">Company</label>
              <select name="companyId" value={formState.companyId} onChange={onChange} className="mt-1 w-full border rounded p-2">
                <option value="">Select...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Passport Photo</label>
            <input type="file" name="passportPhoto" accept="image/*" className="mt-1 w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Address</label>
            <input name="address" value={formState.address} onChange={onChange} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Link className="px-4 py-2 bg-brand text-white rounded" href="/members"> Back </Link>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-brand text-white rounded">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
