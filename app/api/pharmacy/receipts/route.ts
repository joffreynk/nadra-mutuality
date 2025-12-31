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
  const mode = url.searchParams.get('mode') || 'approved';

  try {
    let receipts;
    if (mode === 'approved') {
      // Receipts for items approved by this user
      receipts = await prisma.pharmacyRequestReceipt.findMany({
        where: {
          organizationId,
          pharmacyRequest: {
            pharmacyRequests: {
              some: {
                userAproverId: session.user.id,
                status: 'Approved',
              },
            },
          },
        },
        include: {
          pharmacyRequest: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  memberCode: true,
                },
              },
              pharmacyRequests: {
                where: {
                  userAproverId: session.user.id,
                  status: 'Approved',
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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
      receipts = await prisma.pharmacyRequestReceipt.findMany({
        where: {
          organizationId,
          userId: session.user.id,
        },
        include: {
          pharmacyRequest: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  memberCode: true,
                },
              },
              pharmacyRequests: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
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
      pharmacyRequestId: r.pharmacyRequestId,
      request: {
        id: r.pharmacyRequest.id,
        member: r.pharmacyRequest.member,
        creator: r.pharmacyRequest.user,
        items: r.pharmacyRequest.pharmacyRequests.map((item: any) => ({
          id: item.id,
          mdecineName: item.mdecineName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          status: item.status,
          approver: item.user,
        })),
      },
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching pharmacy receipts:', err);
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

