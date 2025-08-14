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
  // Expected CSV header:
  // mainId,name,dob,gender,email,contact,address,idNumber,country,companyName,category,coveragePercent,passportPhotoId,passportPhotoUrl
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
        category: cols[idx('category')] || 'Basic',
        coveragePercent: Number(cols[idx('coveragepercent')] || 80),
        passportPhotoId: cols[idx('passportphotoid')] || undefined,
        passportPhotoUrl: cols[idx('passportphotourl')] || undefined
      }
    });
    inserted++;
  }
  return NextResponse.json({ inserted });
}


