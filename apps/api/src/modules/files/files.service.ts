import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db, files, companies, type File } from '@jobboard/db';
import { eq, and } from 'drizzle-orm';
import {
  getPresignedUploadUrl,
  deleteObject,
} from '@jobboard/storage';
import { PresignRequestDto } from './dto/presign-request.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import type { User } from '@jobboard/db';

@Injectable()
export class FilesService {
  /**
   * Step 1 of the upload flow.
   * Generates a presigned PUT URL — the browser uploads directly to DO Spaces.
   * Nothing is saved to DB yet.
   *
   * Flow:
   *   client → POST /files/presign → { uploadUrl, storageKey, publicUrl }
   *   client → PUT uploadUrl (direct to DO Spaces, no server involved)
   *   client → POST /files/confirm → file record created in DB
   */
  async presign(dto: PresignRequestDto, user: User) {
    return getPresignedUploadUrl(
      dto.fileType,
      dto.mimeType,
      user.id,
      dto.originalName,
    );
  }

  /**
   * Step 2 of the upload flow.
   * Called after the browser PUT succeeds.
   * Creates the DB record — now the file is "registered".
   */
  async confirmUpload(dto: ConfirmUploadDto, user: User): Promise<File> {
    const [file] = await db
      .insert(files)
      .values({
        uploadedById: user.id,
        type: dto.fileType,
        storageKey: dto.storageKey,
        url: dto.publicUrl,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
      })
      .returning();

    return file;
  }

  async findByUser(userId: string): Promise<File[]> {
    return db
      .select()
      .from(files)
      .where(eq(files.uploadedById, userId));
  }

  async findOne(id: number): Promise<File> {
    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file[0]) throw new NotFoundException(`File #${id} not found`);
    return file[0];
  }

  /**
   * Delete file from DB and from DO Spaces.
   * Only the uploader or ADMIN can delete.
   */
  async remove(id: number, user: User): Promise<void> {
    const file = await this.findOne(id);

    if (user.role !== 'ADMIN' && file.uploadedById !== user.id) {
      throw new ForbiddenException('You did not upload this file');
    }

    // Delete from storage first — if this fails, DB record stays (safe)
    await deleteObject(file.storageKey);

    // Then remove DB record
    await db.delete(files).where(eq(files.id, id));
  }

  /**
   * Used by CompaniesService after updating logo.
   * Deletes the old logo file if it exists.
   */
  async deleteCompanyLogo(companyId: number): Promise<void> {
    const company = await db
      .select({ logoFileId: companies.logoFileId })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const logoFileId = company[0]?.logoFileId;
    if (!logoFileId) return;

    const file = await db
      .select()
      .from(files)
      .where(and(eq(files.id, logoFileId)))
      .limit(1);

    if (file[0]) {
      await deleteObject(file[0].storageKey);
      await db.delete(files).where(eq(files.id, logoFileId));
    }
  }
}
