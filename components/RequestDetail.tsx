'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function RequestDetail({ request, onAction }: { request: any; onAction: (itemId:string, currentStatus:string) => void }) {
  if (!request) return null;
  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">Member: {request.member?.name ?? request.memberId}</h3>
              <div className="text-xs text-gray-500">{request.member?.memberCode}</div>
            </div>
            <div className="text-sm text-gray-600">{new Date(request.createdAt).toLocaleString()}</div>
          </div>

          <div className="mt-4 space-y-2">
            {request.pharmacyRequests?.map((it:any) => (
              <div key={it.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{it.mdecineName}</div>
                  <div className="text-xs text-gray-500">Qty: {it.quantity} • Unit: {Number(it.unitPrice).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <div className={`text-sm font-medium ${it.status==='Approved'?'text-green-600': it.status==='Reverted'?'text-orange-600':'text-gray-600'}`}>{it.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
