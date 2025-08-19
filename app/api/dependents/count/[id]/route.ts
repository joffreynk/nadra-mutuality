import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = (session as any).organizationId as string | null;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const parentMemberId = params.id;
  if (!parentMemberId) return NextResponse.json({ error: 'Parent member ID is required' }, { status: 400 });

  const count = await prisma.dependent.count({
    where: {
      parentMemberId,
      parentMember: { organizationId }
    }
  });

  return NextResponse.json({ count });
}
