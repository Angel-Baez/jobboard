import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageClient, BUCKET, CDN_URL } from './client';

export type PresignedUploadResult = {
  uploadUrl: string;   // PUT to this URL directly from browser
  storageKey: string;  // Save this in DB after upload confirms
  publicUrl: string;   // CDN URL — available after upload completes
};

const ALLOWED_MIME_TYPES = {
  RESUME: ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  COMPANY_LOGO: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  COVER_LETTER: ['application/pdf', 'text/plain'],
} as const;

const MAX_SIZE_BYTES = {
  RESUME: 5 * 1024 * 1024,       // 5 MB
  COMPANY_LOGO: 2 * 1024 * 1024, // 2 MB
  COVER_LETTER: 2 * 1024 * 1024, // 2 MB
} as const;

type FileType = keyof typeof ALLOWED_MIME_TYPES;

export async function getPresignedUploadUrl(
  fileType: FileType,
  mimeType: string,
  userId: string,
  originalName: string,
): Promise<PresignedUploadResult> {
  // Validate mime type
  if (!(ALLOWED_MIME_TYPES[fileType] as readonly string[]).includes(mimeType)) {
    throw new Error(
      `Invalid file type for ${fileType}. Allowed: ${ALLOWED_MIME_TYPES[fileType].join(', ')}`,
    );
  }

  // Build a unique, organized storage key
  const ext = originalName.split('.').pop() ?? 'bin';
  const timestamp = Date.now();
  const storageKey = `${fileType.toLowerCase()}/${userId}/${timestamp}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: MAX_SIZE_BYTES[fileType],
    // Make uploaded files publicly readable via CDN
    ACL: 'public-read',
    Metadata: {
      uploadedBy: userId,
      fileType,
      originalName: encodeURIComponent(originalName),
    },
  });

  // Presigned URL expires in 10 minutes — enough time for the browser upload
  const uploadUrl = await getSignedUrl(storageClient, command, { expiresIn: 600 });
  const publicUrl = `${CDN_URL}/${storageKey}`;

  return { uploadUrl, storageKey, publicUrl };
}

export async function deleteObject(storageKey: string): Promise<void> {
  await storageClient.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }),
  );
}

export function getPublicUrl(storageKey: string): string {
  return `${CDN_URL}/${storageKey}`;
}
