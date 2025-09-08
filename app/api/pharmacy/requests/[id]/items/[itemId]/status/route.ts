// app/api/pharmacy/requests/[id]/items/[itemId]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { ItemStatusAction } from '@/lib/validations';

export async function POST(req: Request, { params }: { params: { id: string; itemId: string } }) {
  const {id, itemId} = await params;
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
    if (e?.issues) {
      return NextResponse.json({ error: 'Validation error', details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: e?.message ?? 'Invalid JSON' }, { status: 400 });
  }

  try {
    const item = await prisma.pharmacyRequestItem.findUnique({
      where: { id: itemId },
      include: { pharmacyRequest: true },
    });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const pr = item.pharmacyRequest;
    if (!pr || pr.id !== id) {
      return NextResponse.json({ error: 'Item not in this request' }, { status: 400 });
    }
    if (pr.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // allowed transitions
    const allowed = (current: string, action: string) => {
      if (action === 'Approved') return current !== 'Approved';
      if (action === 'Pending') return current === 'Approved';
      return false;
    };
    if (!allowed(item.status, body.action)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 });
    }

    let updateData: any = { status: body.action, unitPrice: body?.unitPrice || null };

    if (body.action === 'Approved') {
      if (!body.unitPrice || Number(body.unitPrice) <= 0) {
        return NextResponse.json({ error: 'Unit Price is required when approving' }, { status: 400 });
      }
      updateData.unitPrice = body.unitPrice;
      updateData.userAproverId = approverId;
    } else {
      // For Reverted or other states
      updateData.unitPrice = null;
      updateData.userAproverId = null;
    }

    await prisma.pharmacyRequestItem.update({
      where: { id: item.id },
      data: updateData,
    });
    return NextResponse.json({
      ok: true,
      item: await prisma.pharmacyRequestItem.findUnique({ where: { id: item.id } }),
    });
  } catch (err: any) {
    console.error('POST status change error', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}


export async function DELETE(_req: Request, { params }: { params: { itemId: string } }) {
  const { itemId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const organizationId = (session as any).user?.organizationId;
  if (!organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  try {
    const existing = await prisma.pharmacyRequestItem.findFirst({ where: { id: itemId } });
    if (!existing) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    await prisma.pharmacyRequestItem.deleteMany({ where: { id: itemId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE medicine error', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
