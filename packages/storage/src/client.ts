import { S3Client } from '@aws-sdk/client-s3';

export const storageClient = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION ?? 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

export const BUCKET = process.env.DO_SPACES_BUCKET ?? 'jobboard-files';
export const CDN_URL = process.env.DO_SPACES_CDN_URL ?? '';
