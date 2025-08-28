import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from "next/navigation";
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import Link from 'next/link';

const validationSchema = z.object({
  memberCode: z.string().min(5, 'Member code is required'),
  name: z.string().min(2, 'Name is required'),
  dob: z.string().optional().nullable(),
  gender: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  coveragePercent: z.coerce.number().min(20).max(100),
  passportPhotoUrl: z.string().optional().nullable(),
})

async function updateMember(memberId: string, formData: FormData, member: any) {
  try {
    // Handle file upload if present
    let passportPhotoUrl = null
    const passportPhoto = formData.get('passportPhoto') as File
    if (passportPhoto.size > 0) {
      const fd = new FormData()
      fd.append('file', passportPhoto)
      const up = await fetch('/api/uploads', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('Passport photo upload failed')
      const upj = await up.json()
      passportPhotoUrl = upj.url
    }

    const payload = {
      memberCode: formData.get('memberCode') as string || member.memberCode,
      name: formData.get('name') as string || member.name,
      dob: formData.get('dob') as string || `${new Date(member.dob.toString()).getFullYear()}-${new Date(member.dob.toString()).getMonth() + 1}-${new Date(member.dob.toString()).getDate()}`,
      gender: formData.get('gender') as string || member.gender,
      email: formData.get('email') as string || member.email,
      contact: formData.get('contact') as string || member.contact,
      address: formData.get('address') as string || member.address,
      idNumber: formData.get('idNumber') as string || member.idNumber,
      country: formData.get('country') as string || member.country,
      companyId: formData.get('companyId') as string || member.companyId,
      category: formData.get('category') as string || member.category,
      coveragePercent: Number(formData.get('coveragePercent')) || member.coveragePercent,
      passportPhotoUrl: passportPhotoUrl || member.passportPhotoUrl,
    }
    
    const validated = validationSchema.parse(payload)
    console.log('MEMBER UPDATE VALIDATED', memberId);
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/members/${memberId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validated)
    })
    
    if (!res.ok) {
      console.log('GETTING DATA READY', res);
      const error = await res.json()
      throw new Error(error.message)
    } 
    revalidatePath('/members');
    console.log('GETTING DATA READY222');

    return { success: true }

  } catch (error: any) {
    return { error: error.message }
  }
}

export default async function EditMemberPage({ params }: { params: any }) {
    const session = await auth();
    if (!session) return <div>Unauthorized</div>
    const organizationId = session.user.organizationId;
    if (!organizationId) return <div>No organization</div>;
    const myparams = await params;

    if (!myparams?.id) return <div>Member ID is required</div>

  const member = await prisma.member.findUnique({
    where: { id: myparams?.id },
  });

  if (!member) redirect('/members');
  const categories = await prisma.category.findMany({
    where: { organizationId },
  });

  const companies = await prisma.company.findMany({
    where: { organizationId },
  });

  async function handleSubmit(formData: FormData) {
    'use server'
    if (!member?.id) redirect('/members');
    const result = await updateMember(member.id, formData, member);
    
    if (result.error) {
      // Show error message
      return;
    }

    redirect('/members');
  }


  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Edit Existing Member</h1>
      
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input 
            name="name"
            defaultValue={member?.name}
            className="mt-1 w-full border rounded p-2" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select 
              name="gender"
              defaultValue={member.gender ?? 'Male'} 
              className="mt-1 w-full border rounded p-2"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input 
              type="email"
              name="email" 
              defaultValue={member.email ?? ''} 
              className="mt-1 w-full border rounded p-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select 
              name="category"
              defaultValue={member.category ?? ''} 
              className="mt-1 w-full border rounded p-2"
            >
              {categories.length === 0 && <option>A</option>}
              {categories.map((c:any) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Coverage %</label>
            <input 
              type="number"
              name="coveragePercent"
              defaultValue={member.coveragePercent ?? 100}
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Contact</label>
            <input 
              name="contact"
              defaultValue={member.contact ?? ''}
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium">ID Number</label>
            <input 
              name="idNumber"
              defaultValue={member.idNumber ?? ''}
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Country</label>
            <input 
              name="country"
              defaultValue={member.country ?? ''}
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium">Company</label>
            <select 
              name="companyId"
              defaultValue={member.companyId ?? ''}
              className="mt-1 w-full border rounded p-2"
            >
              <option value="">Select...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Passport Photo</label>
            <input 
              type="file"
              name="passportPhoto"
              accept="image/*" 
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium">Address</label>
            <input 
              name="address"
              defaultValue={member.address ?? ''}
              className="mt-1 w-full border rounded p-2" 
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
         <Link className="px-4 py-2 bg-brand text-white rounded" href="/members"> Back </Link>
          <button 
            type="submit"
            className="px-4 py-2 bg-brand text-white rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );

}
