'use client';
import React from 'react';

type Props = { server: any; client: any; previous: any };

export default function DiffView({ server, client, previous }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <div className="text-xs text-gray-500 mb-1">Server</div>
        <pre className="p-2 border rounded overflow-auto">{JSON.stringify(server, null, 2)}</pre>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Client</div>
        <pre className="p-2 border rounded overflow-auto">{JSON.stringify(client, null, 2)}</pre>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Previous</div>
        <pre className="p-2 border rounded overflow-auto">{JSON.stringify(previous, null, 2)}</pre>
      </div>
    </div>
  );
}


