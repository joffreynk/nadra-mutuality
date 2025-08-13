import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HospitalAuthorizationPage() {
  const session = await auth();
  
  if (!session || session.user?.role !== 'HOSPITAL') {
    redirect('/');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Treatment Authorization</h1>
      <p className="text-gray-600">
        Verify member coverage for treatments and procedures.
      </p>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Check Treatment Authorization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Member ID or Card Number</label>
            <input 
              type="text" 
              className="w-full border rounded p-2" 
              placeholder="Enter member ID or card number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Treatment Type</label>
            <select className="w-full border rounded p-2">
              <option value="">Select treatment type</option>
              <option value="consultation">Consultation</option>
              <option value="surgery">Surgery</option>
              <option value="diagnostic">Diagnostic Test</option>
              <option value="emergency">Emergency Care</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Cost</label>
            <input 
              type="number" 
              className="w-full border rounded p-2" 
              placeholder="Enter estimated cost"
            />
          </div>
          <button className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
            Check Authorization
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Authorization Results</h2>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Authorization information will be displayed here</p>
        </div>
      </div>
    </div>
  );
}
