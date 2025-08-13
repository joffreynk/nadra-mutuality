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
  for (const line of lines.slice(1)) {
    const [mainId,name,dob,contact,address,idNumber,category,coverage] = line.split(',');
    if (!mainId || !name) continue;
    await prisma.member.create({
      data: {
        organizationId,
        mainId,
        name,
        dob: new Date(dob),
        contact: contact || undefined,
        address: address || undefined,
        idNumber: idNumber || undefined,
        category: category || 'Basic',
        coveragePercent: Number(coverage) || 80
      }
    });
    inserted++;
  }
  return NextResponse.json({ inserted });
}


