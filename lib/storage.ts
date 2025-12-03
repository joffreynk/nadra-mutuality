// lib/storage.ts
import fs from 'node:fs/promises';
import path from 'node:path';


const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.join(process.cwd(), 'public', 'uploads');

const ROOT = path.resolve(UPLOADS_ROOT);


export async function saveBufferToStorage(filename: string, data: Uint8Array | Buffer) {
  await fs.mkdir(ROOT, { recursive: true });

  const safeName = path.basename(filename).replace(/\s+/g, '_');
  const fp = path.join(ROOT, safeName);

  await fs.writeFile(fp, Buffer.from(data));

  return {
    filepath: fp,
    url: `/uploads/${encodeURIComponent(safeName)}`, // direct public URL
  };
}


export async function readFileFromStorage(name: string) {
  if (!name) throw new Error('Filename required');

  // decode URI components (in case route param was encoded)
  const decoded = decodeURIComponent(name);

  // if the param is a path fragment like "files/<name>", strip it
  const withoutPrefix = decoded.startsWith('files/') ? decoded.slice('files/'.length) : decoded;

  // use basename to guard against malicious paths
  const safeName = path.basename(withoutPrefix);

  const fp = path.join(ROOT, safeName);
  return fs.readFile(fp);
}



function extractPathnameFromUrl(urlOrPath: string): string {
  // Accepts absolute URLs or path-only strings like "/uploads/foo.jpg"
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      return new URL(urlOrPath).pathname;
    }
  } catch (e) {
    // Fall through to treat as path-only
  }
  // strip query/hash if present
  return urlOrPath.split('?')[0].split('#')[0];
}

function getUploadFilenameFromUrl(urlOrPath: string): string {
  const pathname = extractPathnameFromUrl(urlOrPath);

  // Support both "public" direct URLs and API-file-serving URLs:
  // e.g. /uploads/filename.jpg  OR  /api/files/filename.jpg
  const uploadPrefix = '/uploads/';
  const apiPrefix = '/api/files/';

  let idx = pathname.indexOf(uploadPrefix);
  if (idx !== -1) {
    return pathname.slice(idx + uploadPrefix.length);
  }
  idx = pathname.indexOf(apiPrefix);
  if (idx !== -1) {
    return pathname.slice(idx + apiPrefix.length);
  }

  // fallback: take basename (user might pass just filename or another pattern)
  return path.basename(pathname);
}

export async function deleteFileByUrl(urlOrPath: string): Promise<{ deleted: boolean; filepath?: string }> {
  const rawName = getUploadFilenameFromUrl(urlOrPath);
  const safeName = path.basename(decodeURIComponent(rawName)); // prevents traversal
  const resolved = path.resolve(ROOT, safeName);

  // Ensure file is inside the configured uploads directory
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
    throw new Error('Refusing to delete: path is outside uploads root');
  }

  try {
    await fs.unlink(resolved);
    return { deleted: true, filepath: resolved };
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      // file already missing
      return { deleted: false, filepath: resolved };
    }
    // rethrow other errors
    throw err;
  }
}
