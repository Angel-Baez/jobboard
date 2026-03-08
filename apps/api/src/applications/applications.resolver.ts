import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ApplicationsService } from './applications.service';
import { ApplicationType, PaginatedApplicationsType } from './dto/application.type';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApplicationFiltersDto } from './dto/application-filters.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Resolver(() => ApplicationType)
export class ApplicationsResolver {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // ── Candidate queries ──────────────────────────────────────

  /**
   * query { myApplications(filters: { status: PENDING }) { items { id status job { title } } } }
   */
  @Roles('CANDIDATE')
  @Query(() => PaginatedApplicationsType, { name: 'myApplications' })
  findMine(
    @Args('filters', { nullable: true }) filters: ApplicationFiltersDto = {},
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findByCandidate(user.id, filters);
  }

  // ── Employer queries ───────────────────────────────────────

  /**
   * query { jobApplications(jobId: 1, filters: { status: SHORTLISTED }) { items { id candidateId } } }
   */
  @Roles('EMPLOYER')
  @Query(() => PaginatedApplicationsType, { name: 'jobApplications' })
  findByJob(
    @Args('jobId', { type: () => Int }) jobId: number,
    @Args('filters', { nullable: true }) filters: ApplicationFiltersDto = {},
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findByJob(jobId, filters, user);
  }

  // ── Candidate mutations ────────────────────────────────────

  @Roles('CANDIDATE')
  @Mutation(() => ApplicationType)
  apply(
    @Args('input') input: CreateApplicationDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.apply(input, user);
  }

  @Roles('CANDIDATE')
  @Mutation(() => Boolean)
  async withdrawApplication(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() user: User,
  ) {
    await this.applicationsService.withdraw(id, user);
    return true;
  }

  // ── Employer mutations ─────────────────────────────────────

  @Roles('EMPLOYER')
  @Mutation(() => ApplicationType)
  updateApplicationStatus(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.updateStatus(id, input, user);
  }
}
