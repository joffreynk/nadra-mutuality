import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/components/SettingsForm';

export default async function AdminSettingsPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  const organizationId = session.user.organizationId;
  let settings = await (prisma as any).systemSetting.findUnique({ where: { organizationId } });
  if (!settings) {
    settings = await (prisma as any).systemSetting.create({ data: { organizationId } });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>
      <p className="text-gray-600">Configure system parameters and organization settings.</p>

      <SettingsForm initial={{
        systemName: settings.systemName,
        defaultCoveragePercent: settings.defaultCoveragePercent,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        enableTwoFactor: settings.enableTwoFactor,
        requireStrongPasswords: settings.requireStrongPasswords,
        enableAccountLockout: settings.enableAccountLockout,
        failedLoginThreshold: settings.failedLoginThreshold,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        systemAlerts: settings.systemAlerts
      }} />
    </div>
  );
}
