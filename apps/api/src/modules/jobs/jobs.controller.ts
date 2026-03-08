import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobInput } from './dto/create-job.input';
import { UpdateJobInput } from './dto/update-job.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { User } from '@jobboard/db';

/**
 * REST endpoints for employer job management.
 * All routes require EMPLOYER role (enforced by RolesGuard via @Roles).
 *
 * POST   /jobs                     → create (DRAFT)
 * PUT    /jobs/:id                 → update
 * PATCH  /jobs/:id/publish         → DRAFT → ACTIVE
 * PATCH  /jobs/:id/close           → ACTIVE → FILLED
 * DELETE /jobs/:id                 → delete (only DRAFT/EXPIRED)
 */
@Controller('jobs')
@Roles('EMPLOYER')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: { input: CreateJobInput; companyId: number },
    @CurrentUser() user: User,
  ) {
    return this.jobsService.create(body.input, body.companyId, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateJobInput,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, input, user);
  }

  @Patch(':id/publish')
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.publish(id, user);
  }

  @Patch(':id/close')
  close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.close(id, user, 'FILLED');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.remove(id, user);
  }
}
