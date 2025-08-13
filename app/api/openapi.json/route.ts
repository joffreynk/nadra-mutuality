import { NextResponse } from 'next/server';

export function GET() {
  const spec = {
    openapi: '3.0.0',
    info: { title: 'nadra API', version: '1.0.0' },
    paths: {
      '/api/health': { get: { summary: 'Health check', responses: { '200': { description: 'OK' } } } },
      '/api/members': { get: { summary: 'List members' }, post: { summary: 'Create member' } },
      '/api/members/bulk': { post: { summary: 'Bulk import members (CSV)' } },
      '/api/dependents': { get: { summary: 'List dependents' }, post: { summary: 'Create dependent' } },
      '/api/cards': { post: { summary: 'Issue card' } },
      '/api/admin/categories': { get: { summary: 'List categories' }, post: { summary: 'Create' }, put: { summary: 'Update' }, delete: { summary: 'Delete' } },
      '/api/admin/users': { get: { summary: 'List users' }, post: { summary: 'Create user' } },
      '/api/admin/partners': { post: { summary: 'Create partner' } },
      '/api/admin/settings': { get: { summary: 'Get settings' }, post: { summary: 'Upsert settings' } },
      '/api/hospital/services': { get: { summary: 'List hospital services' }, post: { summary: 'Create' }, put: { summary: 'Update' }, delete: { summary: 'Delete' } },
      '/api/hospital/treatments': { get: { summary: 'List treatments' }, post: { summary: 'Create treatment' } },
      '/api/pharmacy/medicines': { get: { summary: 'List medicines' }, post: { summary: 'Create' }, put: { summary: 'Update' }, delete: { summary: 'Delete' } },
      '/api/pharmacy/coverage': { post: { summary: 'Check coverage' } },
      '/api/pharmacy/requests': { get: { summary: 'List requests' }, post: { summary: 'Create request' } },
      '/api/pharmacy/claims': { get: { summary: 'List claims' }, post: { summary: 'Create claim' } },
      '/api/billing/invoices': { post: { summary: 'Create invoice' } }
    }
  };
  return NextResponse.json(spec);
}


