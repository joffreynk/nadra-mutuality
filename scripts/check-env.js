/* eslint-disable no-console */
const required = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn('Missing env vars:', missing.join(', '));
  process.exitCode = 0; // warn only in local
}

