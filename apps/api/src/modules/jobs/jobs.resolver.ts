import type { User } from '@jobboard/db';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { JobFiltersDto } from './dto/job-filters.dto';
import { JobType, PaginatedJobsType } from './dto/job.type';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Resolver(() => JobType)
export class JobsResolver {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Query(() => PaginatedJobsType, { name: 'jobs' })
  findAll(
    @Args('filters', { nullable: true })
    filters: JobFiltersDto = new JobFiltersDto(),
  ) {
    return this.jobsService.findAll(filters);
  }

  @Public()
  @Query(() => JobType, { name: 'job' })
  findBySlug(@Args('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Roles('EMPLOYER')
  @Query(() => [JobType], { name: 'companyJobs' })
  findByCompany(@Args('companyId', { type: () => Int }) companyId: number) {
    return this.jobsService.findByCompany(companyId);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  createJob(@Args('input') input: CreateJobDto, @CurrentUser() user: User) {
    return this.jobsService.create(input, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  updateJob(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, input, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  publishJob(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User) {
    return this.jobsService.publish(id, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  unpublishJob(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User) {
    return this.jobsService.unpublish(id, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => Boolean)
  async removeJob(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User) {
    await this.jobsService.remove(id, user);
    return true;
  }
}
