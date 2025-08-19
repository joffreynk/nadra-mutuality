import Link from 'next/link';
import { Session } from 'next-auth';

interface DashboardProps {
  session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
  const userRole = session?.user?.role;

  if (!userRole) {
    return <div>Loading...</div>;
  }

  const renderHealthOwnerDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Health Owner Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {session.user?.name}! Manage your healthcare organization.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Organization Management"
          description="Manage your healthcare organization"
          link="/admin/organization"
          icon="🏢"
        />
        <DashboardCard
          title="User Management"
          description="Create and manage user accounts"
          link="/admin/users"
          icon="👥"
        />
        <DashboardCard
          title="Member Management"
          description="View and manage insurance members"
          link="/admin/members"
          icon="👤"
        />
        <DashboardCard
          title="Financial Reports"
          description="View revenue and billing reports"
          link="/admin/financials"
          icon="💰"
        />
        <DashboardCard
          title="Partner Network"
          description="Manage your business partners and their services."
          link="/admin/companies"
          icon="🏥"
        />
        <DashboardCard
          title="System Settings"
          description="Configure system parameters"
          link="/admin/settings"
          icon="⚙️"
        />
      </div>
    </div>
  );

  const renderWorkerDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Agency Worker Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {session.user?.name}! Manage member records and insurance cards.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Member Management"
          description="Create and manage member records"
          link="/members"
          icon="👤"
        />
        <DashboardCard
          title="Card Management"
          description="Issue and manage insurance cards"
          link="/cards"
          icon="💳"
        />
        <DashboardCard
          title="Billing"
          description="Generate invoices and track payments"
          link="/billing"
          icon="📄"
        />
        <DashboardCard
          title="Reports"
          description="View member and activity reports"
          link="/reports"
          icon="📊"
        />
      </div>
    </div>
  );

  const renderPharmacyDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {session.user?.name}! Process medicine claims and check coverage.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Coverage Check"
          description="Verify member coverage for medicines"
          link="/pharmacy/coverage"
          icon="🔍"
        />
        <DashboardCard
          title="Claims Processing"
          description="Submit and track medicine claims"
          link="/pharmacy/claims"
          icon="📋"
        />
        <DashboardCard
          title="Medicine Catalog"
          description="Manage approved medicine list"
          link="/pharmacy/medicines"
          icon="💊"
        />
        <DashboardCard
          title="Reports"
          description="View transaction and claim reports"
          link="/pharmacy/reports"
          icon="📊"
        />
      </div>
    </div>
  );

  const renderHospitalDashboard = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome back, {session.user?.name}! Manage treatments and authorizations.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Authorization Check"
          description="Verify member coverage for treatments"
          link="/hospital/authorization"
          icon="✅"
        />
        <DashboardCard
          title="Claims Management"
          description="Submit and track treatment claims"
          link="/hospital/claims"
          icon="🏥"
        />
        <DashboardCard
          title="Treatment Records"
          description="Manage patient treatment details"
          link="/hospital/treatments"
          icon="📋"
        />
        <DashboardCard
          title="Pharmacy Requests"
          description="Request medicines for treatments"
          link="/hospital/pharmacy-requests"
          icon="💊"
        />
        <DashboardCard
          title="Reports"
          description="View treatment and claim reports"
          link="/hospital/reports"
          icon="📊"
        />
      </div>
    </div>
  );

  switch (userRole) {
    case 'HEALTH_OWNER':
      return renderHealthOwnerDashboard();
    case 'WORKER':
      return renderWorkerDashboard();
    case 'PHARMACY':
      return renderPharmacyDashboard();
    case 'HOSPITAL':
      return renderHospitalDashboard();
    default:
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Unknown role: {userRole}</p>
        </div>
      );
  }
}

function DashboardCard({ title, description, link, icon }: {
  title: string;
  description: string;
  link: string;
  icon: string;
}) {
  return (
    <Link href={link} className="block">
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  );
}
