// /lib/storage.ts
import fs from 'node:fs/promises';
import path from 'node:path';
const ROOT =  '/uploads';

export async function saveBufferToStorage(filename: string, data: Uint8Array) {
  await fs.mkdir(ROOT, { recursive: true });
  const fp = path.join(ROOT, filename);
  await fs.writeFile(fp, Buffer.from(data));
  return { filepath: fp, url: `/api/files/${encodeURIComponent(filename)}` };
}

export async function readFileFromStorage(filename: string) {
  const fp = path.join(ROOT, filename);
  return fs.readFile(fp);
}
