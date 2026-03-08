import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApplicationFiltersDto } from './dto/application-filters.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // ── Candidate endpoints ───────────────────────────────────

  /** GET /applications/my — candidate's own applications */
  @Roles('CANDIDATE')
  @Get('my')
  findMine(
    @Query() filters: ApplicationFiltersDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findByCandidate(user.id, filters);
  }

  /** POST /applications — submit application */
  @Roles('CANDIDATE')
  @Post()
  apply(@Body() dto: CreateApplicationDto, @CurrentUser() user: User) {
    return this.applicationsService.apply(dto, user);
  }

  /** DELETE /applications/:id — withdraw application */
  @Roles('CANDIDATE')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.withdraw(id, user);
  }

  // ── Employer endpoints ────────────────────────────────────

  /** GET /applications/job/:jobId — all applications for a job */
  @Roles('EMPLOYER')
  @Get('job/:jobId')
  findByJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Query() filters: ApplicationFiltersDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findByJob(jobId, filters, user);
  }

  /** PATCH /applications/:id/status — move through status workflow */
  @Roles('EMPLOYER')
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.updateStatus(id, dto, user);
  }
}
