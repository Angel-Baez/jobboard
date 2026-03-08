import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';

const FILE_TYPES = ['RESUME', 'COMPANY_LOGO', 'COVER_LETTER'] as const;
const MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'text/plain',
] as const;

export class PresignRequestDto {
  @IsEnum(FILE_TYPES)
  fileType: (typeof FILE_TYPES)[number];

  @IsEnum(MIME_TYPES)
  mimeType: (typeof MIME_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalName: string;
}
