'use client';
import { useState } from 'react';

export interface SystemSettingFormState {
  systemName: string;
  defaultCoveragePercent: number;
  sessionTimeoutMinutes: number;
  enableTwoFactor: boolean;
  requireStrongPasswords: boolean;
  enableAccountLockout: boolean;
  failedLoginThreshold: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  systemAlerts: boolean;
}

export default function SettingsForm({ initial }: { initial: SystemSettingFormState }) {
  const [form, setForm] = useState<SystemSettingFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
            <label className="block text-sm font-medium mb-1">Default Coverage Percentage</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              min={0}
              max={100}
              value={form.defaultCoveragePercent}
              onChange={(e) => setForm({ ...form, defaultCoveragePercent: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Session Timeout (minutes)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              min={5}
              max={480}
              value={form.sessionTimeoutMinutes}
              onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.enableTwoFactor} onChange={(e) => setForm({ ...form, enableTwoFactor: e.target.checked })} />
            <span className="text-sm font-medium">Enable Two-Factor Authentication</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.requireStrongPasswords} onChange={(e) => setForm({ ...form, requireStrongPasswords: e.target.checked })} />
            <span className="text-sm font-medium">Require Strong Passwords</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.enableAccountLockout} onChange={(e) => setForm({ ...form, enableAccountLockout: e.target.checked })} />
            <span className="text-sm font-medium">Enable Account Lockout</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">Failed Login Attempts Before Lockout</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              min={3}
              max={10}
              value={form.failedLoginThreshold}
              onChange={(e) => setForm({ ...form, failedLoginThreshold: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.emailNotifications} onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })} />
            <span className="text-sm font-medium">Email Notifications</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.smsNotifications} onChange={(e) => setForm({ ...form, smsNotifications: e.target.checked })} />
            <span className="text-sm font-medium">SMS Notifications</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" checked={form.systemAlerts} onChange={(e) => setForm({ ...form, systemAlerts: e.target.checked })} />
            <span className="text-sm font-medium">System Alerts</span>
          </label>
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


