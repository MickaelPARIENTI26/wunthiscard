/**
 * Object storage abstraction.
 *
 * Production: uploads to Cloudflare R2 via the S3-compatible API.
 * Development: falls back to writing under `public/uploads` so the app runs
 * without R2 credentials.
 *
 * Required env vars for R2 (production):
 *   R2_ACCOUNT_ID         — Cloudflare account id
 *   R2_ACCESS_KEY_ID      — R2 API token access key
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET_NAME        — target bucket
 *   R2_PUBLIC_URL         — public base URL for the bucket (custom domain or
 *                           the r2.dev URL), e.g. https://cdn.winucards.com
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const r2Configured = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL,
);

// Fail fast at module load in production if storage isn't configured — uploads
// must never silently fall back to the ephemeral/read-only serverless FS.
if (IS_PRODUCTION && !r2Configured) {
  throw new Error(
    'R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
  );
}

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return cachedClient;
}

export interface UploadResult {
  /** Public URL the uploaded object can be served from. */
  url: string;
}

/**
 * Upload a binary object and return its public URL.
 *
 * @param key         Object key, e.g. `avatars/<userId>-<rand>.jpg`
 * @param body        File bytes
 * @param contentType MIME type, e.g. `image/jpeg`
 */
export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<UploadResult> {
  if (r2Configured) {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { url: `${(R2_PUBLIC_URL as string).replace(/\/$/, '')}/${key}` };
  }

  // Development fallback: write under public/uploads so Next serves it directly.
  const { writeFile, mkdir } = await import('fs/promises');
  const { join, dirname } = await import('path');
  const localPath = join(process.cwd(), 'public', 'uploads', key);
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, body);
  return { url: `/uploads/${key}` };
}
