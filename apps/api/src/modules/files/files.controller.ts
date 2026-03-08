import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { PresignRequestDto } from './dto/presign-request.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /files/presign
   * Returns { uploadUrl, storageKey, publicUrl }
   * Client uses uploadUrl to PUT directly to DO Spaces.
   */
  @Post('presign')
  presign(@Body() dto: PresignRequestDto, @CurrentUser() user: User) {
    return this.filesService.presign(dto, user);
  }

  /**
   * POST /files/confirm
   * Called after browser PUT to DO Spaces succeeds.
   * Creates DB record and returns the file entity.
   */
  @Post('confirm')
  confirmUpload(@Body() dto: ConfirmUploadDto, @CurrentUser() user: User) {
    return this.filesService.confirmUpload(dto, user);
  }

  /** GET /files/my — user's uploaded files */
  @Get('my')
  findMine(@CurrentUser() user: User) {
    return this.filesService.findByUser(user.id);
  }

  /** DELETE /files/:id — delete file from DB + storage */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.filesService.remove(id, user);
  }
}
