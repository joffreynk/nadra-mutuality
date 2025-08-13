import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma';

export default async function AdminPartnersPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HEALTH_OWNER') {
    redirect('/');
  }

  const organizationId = session.user.organizationId;
  const partners = await prisma.partner.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' }
  });

  const hospitals = partners.filter(p => p.type.toLowerCase() === 'hospital').length;
  const pharmacies = partners.filter(p => p.type.toLowerCase() === 'pharmacy').length;
  const clinics = partners.filter(p => p.type.toLowerCase() === 'clinic' || p.type.toLowerCase() === 'clinics').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Partner Network</h1>
        <Link 
          href="/admin/partners/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Add New Partner
        </Link>
      </div>
      
      <p className="text-gray-600">
        Manage hospitals, clinics, pharmacies, and other healthcare partners in your network.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Hospitals</h3>
          <p className="text-3xl font-bold text-blue-600">{hospitals}</p>
          <p className="text-sm text-gray-600">Active partners</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Pharmacies</h3>
          <p className="text-3xl font-bold text-green-600">{pharmacies}</p>
          <p className="text-sm text-gray-600">Active partners</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Clinics</h3>
          <p className="text-3xl font-bold text-purple-600">{clinics}</p>
          <p className="text-sm text-gray-600">Active partners</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Partner List</h2>
        {partners.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">No partners found. Start by adding your first healthcare partner.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Services</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4">{p.type}</td>
                    <td className="py-2 pr-4">{p.contact ?? '-'}</td>
                    <td className="py-2 pr-4">{p.services ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/partners/new" className="block text-brand hover:text-brand-dark">
              Add New Partner
            </Link>
            <Link href="/admin/partners/import" className="block text-brand hover:text-brand-dark">
              Import Partners (CSV)
            </Link>
            <Link href="/admin/partners/export" className="block text-brand hover:text-brand-dark">
              Export Partner Data
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Partner Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Total Partners: <span className="font-semibold">{partners.length}</span></p>
            <p>Active Partners: <span className="font-semibold">{partners.length}</span></p>
            <p>Pending Approval: <span className="font-semibold">0</span></p>
            <p>Suspended: <span className="font-semibold">0</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
