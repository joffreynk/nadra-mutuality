'use client';
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { isWithinExactHours, printReceipt } from '@/lib/helper';
import Link from 'next/link';

function toTwoDp(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export default function RequestDetail({
  request,
  onAction,
  session,
  onSelect,
}: {
  session: any;
  request: any;
  onAction: (itemId: string, currentStatus: string) => void;
  onSelect: (r: any) => void;
}) {
  if (!request) return null;

  // compute totals for APPROVED items (receipts use approved with price)
  const approvedSummary = useMemo(() => {
    const items: any[] = (request.pharmacyRequests || []).filter(
      (it: any) => it.status === 'Approved' && it.unitPrice != null
    );

    const cents = items.reduce((s, it) => {
      const price = Number(it.unitPrice) || 0;
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      return s + Math.round(price * 100) * qty;
    }, 0);

    const totalAmount = cents / 100;
    const coverage = Number(request.member?.coveragePercent ?? 0);
    const insurerShare = Math.round(cents * (coverage / 100)) / 100;
    const memberShare = Math.round((cents - Math.round(cents * (coverage / 100)))) / 100;

    return {
      count: items.length,
      totalAmount,
      insurerShare,
      memberShare,
    };
  }, [request]);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-auto bg-black/40 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-lg">
        <div className="space-y-3 p-4">
          <Card>
            <CardContent>
              <div className="flex justify-between items-start mt-3">
                <div>
                  <h3 className="font-semibold">Member: {request.member?.name ?? request.memberId}</h3>
                  <div className="text-xs text-gray-500">{request.member?.memberCode}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">{new Date(request.createdAt).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">By: {request.user?.name}</div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" className="bg-blue-200 text-white-600" onClick={() => { onSelect(null); }}>Close</Button>
                 <Button className="" onClick={async () => await printReceipt(request.id)}>print Receipt</Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {request.pharmacyRequests?.map((it: any) => (
                  <div key={it.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{it.mdecineName}</div>
                      <div className="text-xs text-gray-500">Qty: {it.quantity} • Unit: {it.unitPrice != null ? toTwoDp(Number(it.unitPrice)) : '—'} • Total: {it.unitPrice != null ? toTwoDp(Number(it.unitPrice) * it.quantity) : '—'}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <div className={`text-sm font-medium ${it.status === 'Approved' ? 'text-green-600' : it.status === 'Pending' ? 'text-orange-600' : 'text-gray-600'}`}>
                        {it.status}
                        {it.status === 'Approved' && (<div className="text-xs text-gray-500">By {it?.user?.name ?? ''}</div>)}
                      </div>
                    </div>

                    {isWithinExactHours(it.updatedAt) && it.status === 'Approved' && session.user.id === it.userAproverId && (
                      <div className="flex justify-end">
                        <Button variant="secondary" onClick={() => onAction(it?.id, it?.status)}>{it.status === 'Approved' ? 'Revert' : 'Approve'}</Button>
                      </div>
                    )}
                  </div>
                ))}

                {(!request.pharmacyRequests || request.pharmacyRequests.length === 0) && (
                  <div className="text-sm text-gray-500">No items.</div>
                )}
              </div>

              {/* Summary for approved items */}
              <div className="mt-4 border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Approved items: <span className="font-medium">{approvedSummary.count}</span></div>
                  <div className="text-sm text-gray-600">Coverage: <span className="font-medium">{request.member?.coveragePercent ?? 0}%</span></div>
                </div>

                {approvedSummary.count === 0 ? (
                  <div className="text-sm text-gray-500 mt-2">No approved items yet — totals will appear here once medicines are approved with prices.</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <div className="text-xs text-gray-600">Total amount</div>
                      <div className="text-lg font-semibold">{toTwoDp(approvedSummary.totalAmount)} FBU</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Insurer share</div>
                      <div className="text-lg font-semibold">{toTwoDp(approvedSummary.insurerShare)} FBU</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Member share</div>
                      <div className="text-lg font-semibold">{toTwoDp(approvedSummary.memberShare)} FBU</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
