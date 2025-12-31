"use client";
import { useEffect, useState } from "react";

export default function AdminServicesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      setUsers(res.ok ? await res.json() : []);
    } catch (e: any) {
      setError(e.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedUserId) {
      setRecords([]);
      return;
    }
    loadUserRecords();
  }, [selectedUserId, from, to]);

  async function loadUserRecords() {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch treatments for user
      const tRes = await fetch(`/api/hospital/treatments?userId=${selectedUserId}&from=${from}&to=${to}`);
      if (tRes.ok) {
        const data = await tRes.json();
        if (data.length > 0) {
          setRecords(data);
          setLoading(false);
          return;
        }
      }
      // Try to fetch medicines for user (pharmacy)
      const mRes = await fetch(`/api/pharmacy/requests?userId=${selectedUserId}&from=${from}&to=${to}`);
      setRecords(mRes.ok ? await mRes.json() : []);
    } catch (e: any) {
      setError(e.message || "Loading error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-semibold">User Services</h1>
      {/* User Dropdown and Date Range */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <select
          className="w-full sm:w-auto sm:min-w-[200px] border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Select a user</option>
          {users.map((u) => (
            <option value={u.id} key={u.id}>
              {u.name ?? u.username ?? u.email} ({u.role})
            </option>
          ))}
        </select>
        <input
          type="date"
          className="w-full sm:w-auto border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="w-full sm:w-auto border rounded px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      {/* Table of user records */}
      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading…</div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-xs sm:text-sm border rounded shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left font-semibold">Record ID</th>
                <th className="px-2 sm:px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-2 sm:px-4 py-2 text-left font-semibold">Member</th>
                <th className="px-2 sm:px-4 py-2 text-left font-semibold">Date</th>
                <th className="px-2 sm:px-4 py-2 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-gray-500 text-center" colSpan={5}>
                    {selectedUserId ? "No records found for this user." : "Select a user to view records."}
                  </td>
                </tr>
              )}
              {records.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 py-2">{r.id?.slice(0, 8)}</td>
                  <td className="px-2 sm:px-4 py-2">{r.treatments ? "Treatment" : "Medicine"}</td>
                  <td className="px-2 sm:px-4 py-2">{r.member?.name || "—"}</td>
                  <td className="px-2 sm:px-4 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs truncate max-w-[100px] sm:max-w-xs">
                    {r.treatments ? `${r.treatments.length} items` : r.items ? `${r.items.length} meds` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}
    </div>
  );
}
