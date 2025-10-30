import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function MembersPage() {
  const session = await auth();
  if (!session || (session.user?.role !== 'WORKER' && session.user?.role !== 'HEALTH_OWNER')) {
    redirect('/');
  }

  const organizationId = session.user.organizationId;
  const members = await prisma.member.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      category: true, company: true
    }
  });

  return (
    <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/members/new" className="block text-brand hover:text-brand-dark">
              Create New Member
            </Link>
            <Link href="/cards" className="block text-brand hover:text-brand-dark">
              Manage Cards
            </Link>
            <Link href="/billing" className="block text-brand hover:text-brand-dark">
              Billing & Invoices
            </Link>
            <Link href="/members/bulk" className="block text-brand hover:text-brand-dark">
              Bulk Import/Update
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-2">Statistics</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Total Members: <span className="font-semibold">{members.length}</span></p>
            <p>Active Members: <span className="font-semibold">{members.filter(m => m.status === 'Active').length}</span></p>
            <p>Pending Members: <span className="font-semibold">{members.filter(m => m.status === 'Pending').length}</span></p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Member Management</h1>
        <Link 
          href="/members/new" 
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          Add New Member
        </Link>
      </div>
      
      <p className="text-gray-600">
        Manage insurance member records and information.
      </p>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Member List</h2>
        <form action="/members" method="get" className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="q" placeholder="Type name, Main ID or Company" className="border rounded p-2" />
          <input name="company" placeholder="Filter by Company" className="border rounded p-2" />
          <button className="border rounded p-2">Search</button>
        </form>
        {members.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">No members found. Create your first member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Coverage</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{m.name}</td>
                    <td className="py-2 pr-4">{m.memberCode}</td>
                    <td className="py-2 pr-4">{m.company?.name ?? '-'}</td>
                    <td className="py-2 pr-4">{m.category?.name ?? '-'}</td>
                    <td className="py-2 pr-4">{m.category?.coveragePercent ?? 0}%</td>
                    <td className="py-2 pr-4">{m.status}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/members/${m.id}/edit`} className="text-brand underline mr-2">Edit</Link>
                      <Link href={`/members/${m.id}/delete`} className="text-red-600 underline">Delete</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


    </div>
  );
}
