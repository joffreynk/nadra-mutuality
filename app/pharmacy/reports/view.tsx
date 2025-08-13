'use client';
import { useEffect, useState } from 'react';

export default function ReportsClient() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/pharmacy/requests');
      if (r.ok) setRequests(await r.json());
    })();
  }, []);

  const totalRequests = requests.length;
  const totalItems = requests.reduce((acc, r) => acc + r.items.length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pharmacy Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded border shadow">
          <div className="text-sm text-gray-600">Total Requests</div>
          <div className="text-3xl font-bold">{totalRequests}</div>
        </div>
        <div className="bg-white p-6 rounded border shadow">
          <div className="text-sm text-gray-600">Total Items Requested</div>
          <div className="text-3xl font-bold">{totalItems}</div>
        </div>
      </div>
      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">Recent</h2>
        <div className="space-y-2 text-sm">
          {requests.slice(0, 10).map((r: any) => (
            <div key={r.id} className="border rounded p-3">
              <div className="font-medium">{r.id.slice(0,8)} • {new Date(r.createdAt).toLocaleString()}</div>
              <div>Items: {r.items.length}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


