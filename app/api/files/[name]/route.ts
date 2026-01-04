// /app/api/files/[name]/route.ts
import { NextResponse } from 'next/server';
import { readFileFromStorage } from '@/lib/storage';

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const pname = await params.name;
  try {
    const name = decodeURIComponent(pname);
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

import { deleteFileByUrl } from '@/lib/storage';

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = body?.url;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 });
    }

    const result = await deleteFileByUrl(url);
    if (result.deleted) {
      return NextResponse.json({ ok: true, filepath: result.filepath });
    }
    return NextResponse.json({ ok: false, message: 'File not found', filepath: result.filepath }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
