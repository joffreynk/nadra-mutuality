import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default async function handleSession (){
    const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = session.user.organizationId
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  return organizationId;
};
