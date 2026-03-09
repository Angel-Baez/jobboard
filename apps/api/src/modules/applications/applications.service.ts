import type { User } from '@jobboard/db';
import {
    applications,
    applicationStatusHistory,
    companies,
    db,
    jobs,
    users,
    type Application,
    type NewApplication
} from '@jobboard/db';
import { inngest } from '@jobboard/inngest';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { ApplicationFiltersDto } from './dto/application-filters.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

// Valid status transitions — employer can't jump from PENDING to HIRED
const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:     ['REVIEWING', 'REJECTED'],
  REVIEWING:   ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['HIRED', 'REJECTED'],
  REJECTED:    [], // terminal
  HIRED:       [], // terminal
};

@Injectable()
export class ApplicationsService {

  // ── Candidate mutations ────────────────────────────────────

  async apply(dto: CreateApplicationDto, candidate: User): Promise<Application> {
    // Verify job exists and is ACTIVE
    const job = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, dto.jobId), eq(jobs.status, 'ACTIVE')))
      .limit(1);

    if (!job[0]) {
      throw new NotFoundException('Job not found or no longer accepting applications');
    }

    // Prevent duplicate applications
    const existing = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, dto.jobId),
          eq(applications.candidateId, candidate.id),
        ),
      )
      .limit(1);

    if (existing[0]) {
      throw new ConflictException('You have already applied to this job');
    }

    // Auto-expire 30 days from now (Inngest will handle the actual expiry)
    const autoExpireAt = new Date();
    autoExpireAt.setDate(autoExpireAt.getDate() + 30);

    const [application] = await db
      .insert(applications)
      .values({
        jobId: dto.jobId,
        candidateId: candidate.id,
        coverLetter: dto.coverLetter,
        resumeFileId: dto.resumeFileId,
        status: 'PENDING',
        autoExpireAt,
      } satisfies Omit<NewApplication, 'id' | 'createdAt' | 'updatedAt' | 'statusChangedAt' | 'employerNotes'>)
      .returning();

    // Record initial status event
    await db.insert(applicationStatusHistory).values({
      applicationId: application.id,
      fromStatus: null,
      toStatus: 'PENDING',
      changedBy: candidate.id,
      reason: 'Initial application submission',
    });

    // Increment denormalized counter on job
    await db
      .update(jobs)
      .set({ applicationCount: (job[0].applicationCount ?? 0) + 1 })
      .where(eq(jobs.id, dto.jobId));

    // Fetch related data for Inngest event payload
    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, job[0].companyId));

    const [employer] = await db
      .select({ email: users.email })
      .from(users)
      .innerJoin(companies, eq(companies.ownerId, users.id))
      .where(eq(companies.id, job[0].companyId));

    // Fire Inngest event — non-blocking
    await inngest.send({
      name: 'application/submitted',
      data: {
        applicationId: application.id,
        candidateEmail: candidate.email,
        candidateName: candidate.name ?? 'Candidate',
        jobTitle: job[0].title,
        companyName: company?.name ?? '',
        employerEmail: employer?.email ?? '',
      },
    });

    return application;
  }

  async withdraw(applicationId: number, candidate: User): Promise<void> {
    const application = await this.findOneAsCandidate(applicationId, candidate.id);

    if (['HIRED', 'REJECTED'].includes(application.status)) {
      throw new BadRequestException(
        `Cannot withdraw an application with status: ${application.status}`,
      );
    }

    await db.delete(applications).where(eq(applications.id, applicationId));
  }

  // ── Employer mutations ─────────────────────────────────────

  async updateStatus(
    applicationId: number,
    dto: UpdateStatusDto,
    employer: User,
  ): Promise<Application> {
    const application = await this.findOneAsEmployer(applicationId, employer);

    // Enforce valid transitions
    const allowed = STATUS_TRANSITIONS[application.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${application.status} to ${dto.status}. ` +
        `Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const [updated] = await db
      .update(applications)
      .set({
        status: dto.status,
        employerNotes: dto.employerNotes,
        statusChangedAt: new Date(),
      })
      .where(eq(applications.id, applicationId))
      .returning();

    // Record status history event
    await db.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: application.status,
      toStatus: dto.status,
      changedBy: employer.id,
      reason: dto.reason,
    });

    // Fetch candidate info for notification
    const [candidate] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, application.candidateId));

    const [jobData] = await db
      .select({ title: jobs.title, companyId: jobs.companyId })
      .from(jobs)
      .where(eq(jobs.id, application.jobId));

    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, jobData.companyId));

    // Fire Inngest event
    await inngest.send({
      name: 'application/status-changed',
      data: {
        applicationId,
        candidateEmail: candidate.email,
        candidateName: candidate.name ?? 'Candidate',
        jobTitle: jobData.title,
        companyName: company.name,
        newStatus: dto.status,
      },
    });

    return updated;
  }

  // ── Auto-expire (called by Inngest function) ───────────────

  async autoExpire(applicationId: number): Promise<void> {
    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application[0] || application[0].status !== 'PENDING') return;

    await db
      .update(applications)
      .set({ status: 'REJECTED', statusChangedAt: new Date() })
      .where(eq(applications.id, applicationId));

    // Record auto-expire event
    // Note: Since changedBy is a FK to users.id, we might need a system user or use the employer ID if available. 
    // For now, using null is not allowed. I will use the job owner ID as a fallback if possible.
    const [job] = await db.select({ companyId: jobs.companyId }).from(jobs).where(eq(jobs.id, application[0].jobId));
    const [company] = await db.select({ ownerId: companies.ownerId }).from(companies).where(eq(companies.id, job.companyId));

    await db.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: 'PENDING',
      toStatus: 'REJECTED',
      changedBy: company.ownerId, // Attribution to company owner for system-automated rejection
      reason: 'Automatically expired after 30 days',
    });
  }

  // ── Queries ────────────────────────────────────────────────

  /** Candidate: their own applications across all jobs */
  async findByCandidate(
    candidateId: string,
    filters: ApplicationFiltersDto,
  ) {
    const { status, page = 1, limit = 20, offset } = filters;

    const where = and(
      eq(applications.candidateId, candidateId),
      status ? eq(applications.status, status as any) : undefined,
    );

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(applications)
        .where(where)
        .orderBy(desc(applications.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(applications).where(where),
    ]);

    return { items, total: Number(total), page, limit, hasMore: offset + items.length < Number(total) };
  }

  /** Employer: all applications for a specific job with basic ranking */
  async findByJob(
    jobId: number,
    filters: ApplicationFiltersDto,
    employer: User,
  ) {
    // Verify employer owns the job
    await this.assertJobOwnership(jobId, employer);

    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const where = and(
      eq(applications.jobId, jobId),
      status ? eq(applications.status, status as any) : undefined,
    );

    // Basic Ranking Logic:
    // 1. Join with candidate (users)
    // 2. We could join with tags if we had candidate skills, 
    //    for now we'll rank by: status (SHORTLISTED > PENDING) and recency.
    
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(applications)
        .where(where)
        .orderBy(
          sql`CASE 
            WHEN ${applications.status} = 'SHORTLISTED' THEN 1 
            WHEN ${applications.status} = 'PENDING' THEN 2 
            WHEN ${applications.status} = 'REVIEWING' THEN 3
            ELSE 4 END`,
          desc(applications.createdAt)
        )
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(applications).where(where),
    ]);

    return { 
      items, 
      total: Number(total), 
      page, 
      limit, 
      hasMore: offset + items.length < Number(total) 
    };
  }

  // ── Private helpers ────────────────────────────────────────

  private async findOneAsCandidate(
    applicationId: number,
    candidateId: string,
  ): Promise<Application> {
    const application = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.candidateId, candidateId),
        ),
      )
      .limit(1);

    if (!application[0]) {
      throw new NotFoundException('Application not found');
    }

    return application[0];
  }

  private async findOneAsEmployer(
    applicationId: number,
    employer: User,
  ): Promise<Application> {
    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application[0]) throw new NotFoundException('Application not found');

    if (employer.role === 'ADMIN') return application[0];

    // Verify employer owns the job this application belongs to
    await this.assertJobOwnership(application[0].jobId, employer);

    return application[0];
  }

  private async assertJobOwnership(jobId: number, employer: User): Promise<void> {
    const job = await db
      .select({ companyId: jobs.companyId })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) throw new NotFoundException(`Job #${jobId} not found`);

    const company = await db
      .select({ ownerId: companies.ownerId })
      .from(companies)
      .where(eq(companies.id, job[0].companyId))
      .limit(1);

    if (company[0]?.ownerId !== employer.id) {
      throw new ForbiddenException('You do not own this job');
    }
  }
}
