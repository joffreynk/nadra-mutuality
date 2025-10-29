'use client';
import { useState } from 'react';

export interface SystemSettingFormState {
  systemName: string;
  phoneNumber: string;
  email: string;
  location: string;
  logo: string;
}

export default function SettingsForm({ initial }: { initial: SystemSettingFormState }) {
  const [form, setForm] = useState<SystemSettingFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadTheLogo, setuploadTheLogo] = useState<File | null>(null);

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const up = await fetch('/api/uploads', { method: 'POST', body: fd });
    if (!up.ok) throw new Error('Logo upload failed');
    const upj = await up.json();
    setForm({ ...form, logo: upj.url });


  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed');
      setMessage('Settings saved');
    } catch (err) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">System Name</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={form.systemName}
              onChange={(e) => setForm({ ...form, systemName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded p-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full border rounded p-2"
              min={5}
              max={50}
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Logo Picture</label>
            <input
              type="file"
              className="w-full border rounded p-2"
              onChange={(e) => uploadLogo(e.target.files?.[0]!)}
            />
          </div>
        </div>
      </div>
      {message && <div className="text-sm text-gray-600">{message}</div>}

      <div className="flex justify-end gap-2">
        <button type="submit" className="px-4 py-2 bg-brand text-white rounded disabled:opacity-50" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}


