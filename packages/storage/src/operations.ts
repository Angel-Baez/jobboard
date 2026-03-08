import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { storageClient, BUCKET, CDN_URL } from './client';

export type FileType = 'RESUME' | 'COMPANY_LOGO' | 'COVER_LETTER';

/** Folders per file type — keeps the bucket organized */
const FOLDER: Record<FileType, string> = {
  RESUME: 'resumes',
  COMPANY_LOGO: 'logos',
  COVER_LETTER: 'cover-letters',
};

/** Allowed MIME types per file type */
export const ALLOWED_MIME: Record<FileType, string[]> = {
  RESUME: ['application/pdf'],
  COMPANY_LOGO: ['image/jpeg', 'image/png', 'image/webp'],
  COVER_LETTER: ['application/pdf'],
};

/** Max file sizes in bytes */
export const MAX_SIZE: Record<FileType, number> = {
  RESUME: 5 * 1024 * 1024,       // 5 MB
  COMPANY_LOGO: 2 * 1024 * 1024, // 2 MB
  COVER_LETTER: 5 * 1024 * 1024, // 5 MB
};

/**
 * Generate a presigned PUT URL for direct browser → DO Spaces upload.
 * The file is uploaded by the client — the API never touches the bytes.
 *
 * Flow:
 *  1. Client requests presigned URL from API
 *  2. API returns { uploadUrl, storageKey, cdnUrl }
 *  3. Client PUTs file directly to uploadUrl
 *  4. Client calls API to confirm upload (creates DB record)
 */
export async function createPresignedUploadUrl(params: {
  userId: string;
  fileType: FileType;
  mimeType: string;
  fileName: string;
  expiresIn?: number; // seconds, default 300
}): Promise<{ uploadUrl: string; storageKey: string; cdnUrl: string }> {
  const { userId, fileType, mimeType, fileName, expiresIn = 300 } = params;

  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
  const timestamp = Date.now();
  const storageKey = `${FOLDER[fileType]}/${userId}/${timestamp}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    ACL: 'public-read', // CDN accessible
    Metadata: {
      userId,
      fileType,
      originalName: encodeURIComponent(fileName),
    },
  });

  const uploadUrl = await getSignedUrl(storageClient, command, { expiresIn });
  const cdnUrl = `${CDN_URL}/${storageKey}`;

  return { uploadUrl, storageKey, cdnUrl };
}

/**
 * Verify a file actually exists in the bucket after upload.
 * Called during confirm-upload to prevent ghost DB records.
 */
export async function verifyFileExists(storageKey: string): Promise<boolean> {
  try {
    await storageClient.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: storageKey }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Hard delete from DO Spaces */
export async function deleteFile(storageKey: string): Promise<void> {
  await storageClient.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }),
  );
}
