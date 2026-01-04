"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Sidebar({ isOpen = true, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  return (
    <aside
      className={`fixed z-40 top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-lg border-r shadow-lg transition-transform duration-300 ease-in-out transform 
        md:static md:w-52 md:shadow-none md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      tabIndex={isOpen ? 0 : -1}
      aria-modal={isOpen}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="px-3 sm:px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold text-sm sm:text-base">Navigation</div>
        {/* Close button for mobile */}
        <button
          className="md:hidden p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <span className="block w-5 h-0.5 bg-gray-700 rotate-45 translate-y-0.5" />
          <span className="block w-5 h-0.5 bg-gray-700 -rotate-45 -translate-y-0.5" />
        </button>
      </div>
      <nav className="p-2 space-y-1 text-sm sm:text-base overflow-y-auto max-h-[calc(100vh-4rem)]">
        <SidebarLink href="/" label="Dashboard" onClick={onClose} />
        {(role === 'WORKER' || role === 'HEALTH_OWNER') && (
          <>
            <Section label="Operations" />
            <SidebarLink href="/members" label="Members" onClick={onClose} />
            <SidebarLink href="/members/new" label="Add Member" onClick={onClose} />
            <SidebarLink href="/cards" label="Cards" onClick={onClose} />
            <SidebarLink href="/billing" label="Billing" onClick={onClose} />
          </>
        )}
        {role === 'HEALTH_OWNER' && (
          <>
            <Section label="Administration" />
            <SidebarLink href="/admin/users" label="Users" onClick={onClose} />
            <SidebarLink href="/admin/companies" label="Companies" onClick={onClose} />
            <SidebarLink href="/admin/categories" label="Categories" onClick={onClose} />
            <SidebarLink href="/admin/services" label="Services" onClick={onClose} />
            <SidebarLink href="/admin/settings" label="Settings" onClick={onClose} />
          </>
        )}
        {role === 'PHARMACY' && (
          <>
            <Section label="Pharmacy" />
            <SidebarLink href="/pharmacy/coverage" label="Coverage Check" onClick={onClose} />
            <SidebarLink href="/pharmacy/claims" label="Claims" onClick={onClose} />
            <SidebarLink href="/pharmacy/claims/new" label="New Claim" onClick={onClose} />
            <SidebarLink href="/pharmacy/medicines" label="Medicines" onClick={onClose} />
            <SidebarLink href="/pharmacy/medicines/new" label="New Medicine" onClick={onClose} />
            <SidebarLink href="/pharmacy/requests" label="Requests" onClick={onClose} />
            <SidebarLink href="/pharmacy/receipts" label="Receipts" onClick={onClose} />
            <SidebarLink href="/pharmacy/reports" label="Reports" onClick={onClose} />
          </>
        )}
        {role === 'HOSPITAL' && (
          <>
            <Section label="Hospital" />
            <SidebarLink href="/hospital/authorization" label="Authorization" onClick={onClose} />
            <SidebarLink href="/hospital/claims" label="Claims" onClick={onClose} />
            <SidebarLink href="/hospital/claims/new" label="New Claim" onClick={onClose} />
            <SidebarLink href="/hospital/treatments" label="Treatments" onClick={onClose} />
            <SidebarLink href="/hospital/treatments/new" label="New Treatment" onClick={onClose} />
            <SidebarLink href="/hospital/medicines" label="Medicines" onClick={onClose} />
            <SidebarLink href="/hospital/medicines/new" label="New Medicine" onClick={onClose} />
            <SidebarLink href="/hospital/requests" label="Requests" onClick={onClose} />
            <SidebarLink href="/hospital/receipts" label="Receipts" onClick={onClose} />
            <SidebarLink href="/hospital/reports" label="Reports" onClick={onClose} />
          </>
        )}
        <Section label="Account" />
        <SidebarLink href="/settings/change-password" label="Change Password" onClick={onClose} />
      </nav>
    </aside>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="px-2 pt-4 pb-1 text-gray-400 uppercase tracking-wide text-[11px] font-medium">
      {label}
    </div>
  );
}

function SidebarLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 sm:px-4 py-2 rounded hover:bg-gray-100 text-gray-800 transition-colors"
    >
      {label}
    </Link>
  );
}
