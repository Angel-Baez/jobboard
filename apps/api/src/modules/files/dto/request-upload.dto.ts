import { IsEnum, IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

const FILE_TYPES = ['RESUME', 'COMPANY_LOGO', 'COVER_LETTER'] as const;

export class RequestUploadDto {
  @IsEnum(FILE_TYPES)
  fileType!: (typeof FILE_TYPES)[number];

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(10 * 1024 * 1024) // 10 MB hard cap
  sizeBytes!: number;

  @IsString()
  @IsNotEmpty()
  originalName!: string;
}
