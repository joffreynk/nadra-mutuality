// app/api/pharmacy/requests/[id]/items/[itemId]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ItemStatusAction } from '@/lib/validations';

export async function POST(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const organizationId = (session as any).user?.organizationId;
  const approverId = (session as any).user?.id;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
    ItemStatusAction.parse(body);
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Validation error', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: e?.message ?? 'Invalid JSON' }, { status: 400 });
  }

  try {
    const item = await prisma.pharmacyRequestItem.findUnique({ where: { id: params.itemId }, include: { pharmacyRequest: true }});
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const pr = item.pharmacyRequest;
    if (!pr || pr.id !== params.id) return NextResponse.json({ error: 'Item not in this request' }, { status: 400 });
    if (pr.organizationId !== organizationId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // allowed transitions
    const allowed = (current: string, action: string) => {
      if (action === 'Approved') return current !== 'Approved';
      if (action === 'Reverted') return current === 'Approved';
      return false;
    };
    if (!allowed(item.status, body.action)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 });
    }

    const updated = await prisma.pharmacyRequestItem.update({
      where: { id: item.id },
      data: { status: body.action, userAproverId: approverId },
    });

    // recompute shares if possible
    const fullRequest = await prisma.pharmacyRequest.findUnique({ where: { id: pr.id }, include: { member: true } });
    if (fullRequest?.member && updated.unitPrice !== null && updated.quantity !== null) {
      const coverage = fullRequest.member.coveragePercent ?? 0;
      const total = Number(updated.unitPrice) * updated.quantity;
      const insurerShare = +(total * (coverage / 100)).toFixed(2);
      const memberShare = +(total - insurerShare).toFixed(2);
      await prisma.pharmacyRequestItem.update({ where: { id: updated.id }, data: { insurerShare, memberShare } });
    }

    return NextResponse.json({ ok: true, item: await prisma.pharmacyRequestItem.findUnique({ where: { id: updated.id } }) });
  } catch (err: any) {
    console.error('POST status change error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}
