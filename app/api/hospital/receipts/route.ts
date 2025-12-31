import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'created';

  try {
    let receipts;
    if (mode === 'approved') {
      // Receipts for treatments approved by this user (if applicable)
      receipts = await prisma.treatmentReceipt.findMany({
        where: {
          organizationId,
          treatment: {
            usercreator: session.user.id,
          },
        },
        include: {
          treatment: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  memberCode: true,
                },
              },
              treatments: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    } else {
      // Receipts created by this user
      receipts = await prisma.treatmentReceipt.findMany({
        where: {
          organizationId,
          userId: session.user.id,
        },
        include: {
          treatment: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  memberCode: true,
                },
              },
              treatments: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    }

    const formatted = receipts.map(r => ({
      id: r.id,
      url: r.url,
      createdAt: r.createdAt.toISOString(),
      treatmentId: r.treatmentId,
      request: {
        id: r.treatment.id,
        member: r.treatment.member,
        creator: r.treatment.user,
        items: (r.treatment.treatments || []).map((item: any) => ({
          id: item.id,
          mdecineName: item.treatmentName || 'Treatment',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          status: 'Approved',
          approver: r.treatment.user,
        })),
      },
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching hospital receipts:', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

