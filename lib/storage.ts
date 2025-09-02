// lib/storage.ts
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.env.UPLOADS_ROOT || '/uploads';

export async function saveBufferToStorage(filename: string, data: Uint8Array | Buffer) {
  // ensure target dir exists
  await fs.mkdir(ROOT, { recursive: true });

  // sanitize: use only basename to avoid directory traversal
  const base = path.basename(filename);
  // replace spaces with underscores to be safe in URLs
  const safeName = base.replace(/\s+/g, '_');
  const fp = path.join(ROOT, safeName);

  // write file
  await fs.writeFile(fp, Buffer.from(data));

  // return same shape as your existing code
  return { filepath: fp, url: `/api/files/${encodeURIComponent(safeName)}` };
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
