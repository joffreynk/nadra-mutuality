'use client';
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { isWithinExactHours, printReceipt } from '@/lib/helper';

export default function RequestDetailModal({
  request,
  onAction,
  session,
  onClose,
}: {
  request: any;
  session: any;
  onAction: (itemId: string, currentStatus: string) => void;
  onClose?: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!request) return null;

  return (
    // backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={() => onClose?.()}
    >
      <div className="absolute inset-0 bg-black/40" />

      {/* modal panel */}
      <div
        className="relative z-10 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">Member: {request.member?.name ?? request.memberId}</h3>
              <div className="text-xs text-gray-500">{request.member?.memberCode}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">{new Date(request.createdAt).toLocaleString()}</div>
              <div className="text-sm text-gray-600">By: {request.user?.name}</div>
            </div>

            <div className="flex items-start gap-2">
              <Button onClick={async () => await printReceipt(request.id)}>Print</Button>
              <Button variant="ghost" onClick={() => onClose?.()}>Close</Button>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {request.pharmacyRequests?.map((it: any) => (
                  <div key={it.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{it.mdecineName}</div>
                      <div className="text-xs text-gray-500">
                        Qty: {it.quantity} • Unit: {it.unitPrice != null ? Number(it.unitPrice).toFixed(2) : '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 sm:mt-0">
                      <div className={`text-sm font-medium ${it.status === 'Approved' ? 'text-green-600' : it.status === 'Pending' ? 'text-orange-600' : 'text-gray-600'}`}>
                        {it.status}
                        {it.status === 'Approved' && (<div className="text-xs text-gray-500">By {it?.user?.name ?? ''}</div>)}
                      </div>

                      {isWithinExactHours(it.updatedAt) && it.status === 'Approved' && session?.user?.id === it.userAproverId && (
                        <div>
                          <Button variant="secondary" onClick={() => onAction(it?.id, it?.status)}>
                            Revert
                          </Button>
                        </div>
                      )}

                      {isWithinExactHours(it.updatedAt) && it.status !== 'Approved' && session?.user?.id !== it.userAproverId && (
                        // If you want to show approve to certain users; adjust condition as needed
                        <div>
                          <Button variant="secondary" onClick={() => onAction(it?.id, it?.status)}>
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!request.pharmacyRequests || request.pharmacyRequests.length === 0) && (
                  <div className="text-sm text-gray-500">No items.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
