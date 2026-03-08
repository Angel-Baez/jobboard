import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JobsService } from './jobs.service';
import { JobType } from './dto/job.type';
import { PaginatedJobsType } from './dto/paginated-jobs.type';
import { CreateJobInput } from './dto/create-job.input';
import { UpdateJobInput } from './dto/update-job.input';
import { JobsFilterInput } from './dto/jobs-filter.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { User } from '@jobboard/db';

@Resolver(() => JobType)
export class JobsResolver {
  constructor(private readonly jobsService: JobsService) {}

  // ── Public queries ─────────────────────────────────────────

  @Public()
  @Query(() => PaginatedJobsType, { name: 'jobs' })
  async findAll(
    @Args('filters', { type: () => JobsFilterInput, nullable: true })
    filters?: JobsFilterInput,
  ): Promise<PaginatedJobsType> {
    const input = filters ?? new JobsFilterInput();
    const { data, total } = await this.jobsService.findAll(input);
    return {
      data: data as any,
      total,
      page: input.page,
      limit: input.limit,
      hasMore: input.page * input.limit < total,
    };
  }

  @Public()
  @Query(() => JobType, { name: 'job', nullable: true })
  findOne(@Args('slug') slug: string) {
    return this.jobsService.findOne(slug);
  }

  // ── Employer queries ───────────────────────────────────────

  @Roles('EMPLOYER')
  @Query(() => [JobType], { name: 'companyJobs' })
  findByCompany(
    @Args('companyId', { type: () => Int }) companyId: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.findByCompany(companyId, user);
  }

  // ── Employer mutations ─────────────────────────────────────

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  createJob(
    @Args('input') input: CreateJobInput,
    @Args('companyId', { type: () => Int }) companyId: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.create(input, companyId, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  updateJob(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateJobInput,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, input, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  publishJob(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.publish(id, user);
  }

  @Roles('EMPLOYER')
  @Mutation(() => JobType)
  closeJob(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.close(id, user, 'FILLED');
  }
}
