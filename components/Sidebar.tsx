import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function Sidebar() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <aside className="w-40 shrink-0 border-r bg-white/80 backdrop-blur">
      <div className="px-4 py-3 border-b">
        <div className="font-semibold">Navigation</div>
      </div>
      <nav className="p-2 space-y-1 text-sm">
        <SidebarLink href="/" label="Dashboard" />
        {(role === 'WORKER' || role === 'HEALTH_OWNER') && (
          <>
            <Section label="Operations" />
            <SidebarLink href="/members" label="Members" />
            <SidebarLink href="/members/new" label="Add Member" />
            <SidebarLink href="/cards" label="Cards" />
            <SidebarLink href="/billing" label="Billing" />
          </>
        )}
        {role === 'HEALTH_OWNER' && (
          <>
            <Section label="Administration" />
            <SidebarLink href="/admin/users" label="Users" />
            <SidebarLink href="/admin/companies" label="Companies" />
            <SidebarLink href="/admin/categories" label="Categories" />
            <SidebarLink href="/admin/settings" label="Settings" />
          </>
        )}
        {role === 'PHARMACY' && (
          <>
            <Section label="Pharmacy" />
            <SidebarLink href="/pharmacy/coverage" label="Coverage Check" />
            <SidebarLink href="/pharmacy/claims" label="Claims" />
            <SidebarLink href="/pharmacy/claims/new" label="New Claim" />
            <SidebarLink href="/pharmacy/requests" label="Requests" />
            <SidebarLink href="/pharmacy/receipts" label="Receipts" />
            <SidebarLink href="/pharmacy/reports" label="Reports" />

          </>
        )}
        {role === 'HOSPITAL' && (
          <>
            <Section label="Hospital" />
            <SidebarLink href="/hospital/authorization" label="Authorization" />
            <SidebarLink href="/hospital/claims" label="Claims" />
            <SidebarLink href="/hospital/treatments" label="Treatments" />
            <SidebarLink href="/hospital/medecines" label="Medicines" />
            <SidebarLink href="/hospital/requests" label="Requests" />
            <SidebarLink href="/pharmacy/receipts" label="Receipts" />
            <SidebarLink href="/hospital/reports" label="Reports" />
          </>
        )}
      </nav>
    </aside>
  );
}

function Section({ label }: { label: string }) {
  return <div className="px-2 pt-4 pb-1 text-gray-500 uppercase tracking-wide text-[11px]">{label}</div>;
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-800"
    >
      {label}
    </Link>
  );
}


