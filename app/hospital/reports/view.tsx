'use client';
import { useEffect, useState } from 'react';

export default function ReportsClient() {
  const [treatments, setTreatments] = useState<any[]>([]);

  useEffect(() => { (async () => { const r = await fetch('/api/hospital/treatments'); if (r.ok) setTreatments(await r.json()); })(); }, []);

  const totalTreatments = treatments.length;
  const totalItems = treatments.reduce((acc, t) => acc + t.items.length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hospital Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded border shadow">
          <div className="text-sm text-gray-600">Total Treatments</div>
          <div className="text-3xl font-bold">{totalTreatments}</div>
        </div>
        <div className="bg-white p-6 rounded border shadow">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-3xl font-bold">{totalItems}</div>
        </div>
      </div>
    </div>
  );
}


