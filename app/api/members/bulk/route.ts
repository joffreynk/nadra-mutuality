import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId;
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 });
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  let inserted = 0;

// const createMemberSchema = z.object({
//   memberCode: z.string().min(5), // Changed from mainId
//   name: z.string().min(2),
//   dob: z.string(),
//   gender: z.string().min(1),
//   email: z.string().email().optional(),
//   contact: z.string().optional(),
//   address: z.string().min(3, 'Address is required'),
//   idNumber: z.string().optional(),
//   country: z.string().optional(),
//   companyId: z.string().optional().nullable(),
//   categoryID: z.string(),
//   passportPhotoUrl: z.string().min(5, 'Passport photo URL is required'),
//   dependentProofUrl: z.string().optional().nullable(),
//   isDependent: z.boolean().default(false),
//   familyRelationship: z.string().optional().nullable(),
// });


  const header = lines[0]?.split(',').map(h => h.trim().toLowerCase()) ?? [];
  const idx = (k: string) => header.indexOf(k);
  for (const line of lines.slice(1)) {
    const cols = line.split(',');
    const mainId = cols[idx('mainid')] ?? '';
    const name = cols[idx('name')] ?? '';
    if (!mainId || !name) continue;
    const dob = cols[idx('dob')] ?? '';
    await prisma.member.create({
      data: {
        organizationId,
        mainId,
        name,
        dob: dob ? new Date(dob) : new Date(),
        gender: cols[idx('gender')] || undefined,
        email: cols[idx('email')] || undefined,
        contact: cols[idx('contact')] || undefined,
        address: cols[idx('address')] || undefined,
        idNumber: cols[idx('idnumber')] || undefined,
        country: cols[idx('country')] || undefined,
        companyName: cols[idx('companyname')] || undefined,
        categoryID: cols[idx('category')] || 'Basic',
        passportPhotoId: cols[idx('passportphotoid')] || undefined,
        passportPhotoUrl: cols[idx('passportphotourl')] || undefined
      }
    });
    inserted++;
  }
  return NextResponse.json({ inserted });
}


