'use client';
import React from 'react';

type Props = { onResolve: (choice: 'server' | 'client' | 'merge') => void; onCancel: () => void };

export default function ResolutionModal({ onResolve, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow w-full max-w-md space-y-3">
        <h3 className="text-lg font-semibold">Resolve Conflict</h3>
        <div className="flex gap-2">
          <button className="bg-gray-200 px-3 py-2 rounded" onClick={() => onResolve('server')}>Accept Server</button>
          <button className="bg-gray-200 px-3 py-2 rounded" onClick={() => onResolve('client')}>Accept Client</button>
          <button className="bg-brand text-white px-3 py-2 rounded" onClick={() => onResolve('merge')}>Manual Merge</button>
        </div>
        <button className="text-sm text-gray-500" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}


