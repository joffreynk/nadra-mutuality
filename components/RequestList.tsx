'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RequestList({ requests, onSelect }: { requests: any[]; onSelect: (r:any)=>void }) {
  return (
    <div className="space-y-3">
      {requests.map(r => (
        <Card key={r.id}>
          <CardContent className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div>
              <div className="font-medium">{r.member?.name ?? r.memberId}</div>
              <div className="text-xs text-gray-500">{r.member?.memberCode ?? ''} • {new Date(r.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">{(r.pharmacyRequests || []).length} items</div>
              <Button variant="ghost" onClick={()=>onSelect(r)}>Open</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {requests.length === 0 && <div className="text-sm text-gray-500">No requests.</div>}
    </div>
  );
}
