import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = (session as any).user?.organizationId;
    if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
    const year = new Date().getFullYear();

  // find latest code for this year
  const last = await prisma.treatment.findFirst({
    where: { code: { endsWith: `/${year}` } },
    orderBy: { createdAt: 'desc' },
  });

  let nextNumber = 1;
  if (last?.code) {
    // extract the numeric part (Nadra0001 -> 1)
    const match = last.code.match(/Nadra(\d+)\/\d{4}$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // format with 4 digits, e.g. 0001
  const padded = String(nextNumber).padStart(4, '0');
  console.log(`Generated code: Nadra${padded}/${year}`);

  return NextResponse.json(`Nadra${padded}/${year}`);
}