import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Since we can't await upload_stream directly, use promise wrapper
  const uploaded = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'nadra' }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });

  return NextResponse.json({ public_id: uploaded.public_id, url: uploaded.secure_url });
}


