'use client';
import { useEffect, useState } from 'react';

type Medicine = { id: string; code: string; name: string; price: string };

export default function MedicinesClient() {
  const [rows, setRows] = useState<Medicine[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  async function refresh() {
    const r = await fetch('/api/pharmacy/medicines');
    if (r.ok) setRows(await r.json());
  }

  useEffect(() => { refresh(); }, []);

  async function create() {
    const res = await fetch('/api/pharmacy/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name, price: Number(price) }) });
    if (res.ok) { setCode(''); setName(''); setPrice(''); refresh(); }
  }

  async function update(id: string, data: Partial<Medicine>) {
    const res = await fetch('/api/pharmacy/medicines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...data }) });
    if (res.ok) refresh();
  }

  async function del(id: string) {
    const res = await fetch(`/api/pharmacy/medicines?id=${id}`, { method: 'DELETE' });
    if (res.ok) refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Medicines</h1>
      <div className="bg-white p-6 rounded border shadow space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <input placeholder="Code" className="border rounded p-2" value={code} onChange={(e) => setCode(e.target.value)} />
          <input placeholder="Name" className="border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Price" type="number" className="border rounded p-2" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button className="px-4 py-2 bg-brand text-white rounded" onClick={create}>Add</button>
        </div>
      </div>
      <div className="bg-white p-6 rounded border shadow">
        <h2 className="text-xl font-semibold mb-4">List</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4"><input className="border rounded p-1" defaultValue={r.code} onBlur={(e) => update(r.id, { code: e.target.value } as any)} /></td>
                  <td className="py-2 pr-4"><input className="border rounded p-1" defaultValue={r.name} onBlur={(e) => update(r.id, { name: e.target.value } as any)} /></td>
                  <td className="py-2 pr-4"><input className="border rounded p-1 w-24" defaultValue={r.price as any} onBlur={(e) => update(r.id, { price: e.target.value as any } as any)} /></td>
                  <td className="py-2 pr-4"><button className="px-3 py-1 border rounded text-red-600" onClick={() => del(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


