// /app/api/files/[name]/route.ts
import { NextResponse } from 'next/server';
import { readFileFromStorage } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  try {
    const name = decodeURIComponent(params.name);
    const data = await readFileFromStorage(name);
    const isPdf = name.toLowerCase().endsWith('.pdf');
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': isPdf ? 'application/pdf' : 'application/octet-stream',
        'Content-Disposition': `inline; filename="${name}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Not found' }, { status: 404 });
  }
}
