'use client';
import { useState } from 'react';

export default function BulkImportMembersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [templateUrl] = useState<string>('/api/openapi.json');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/members/bulk', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(`Imported ${data.inserted} records`);
    } catch (e: any) {
      setResult(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Bulk Import/Update Members</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button disabled={!file || loading} className="px-4 py-2 bg-brand text-white rounded">{loading ? 'Importing…' : 'Import'}</button>
      </form>
      {result && <p className="mt-4 text-sm">{result}</p>}
      <div className="mt-6 text-sm text-gray-600">
        CSV headers: mainId,name,dob(YYYY-MM-DD),gender,email,contact,address,idNumber,country,companyName,category,coveragePercent,passportPhotoId,passportPhotoUrl
      </div>
      <div className="mt-2 text-sm text-gray-600">Note: Existing rows with same mainId will be inserted as new member; update-by-ID not yet supported.</div>
    </div>
  );
}


