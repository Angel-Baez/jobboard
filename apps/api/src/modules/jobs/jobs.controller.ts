import type { User } from '@jobboard/db';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { JobFiltersDto } from './dto/job-filters.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  findAll(@Query() filters: JobFiltersDto) {
    return this.jobsService.findAll(filters);
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('EMPLOYER')
  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: User) {
    return this.jobsService.create(dto, user);
  }

  @Roles('EMPLOYER')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, dto, user);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('EMPLOYER')
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.jobsService.publish(id, user);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('EMPLOYER')
  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.jobsService.unpublish(id, user);
  }

  @Roles('EMPLOYER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.jobsService.remove(id, user);
  }
}
