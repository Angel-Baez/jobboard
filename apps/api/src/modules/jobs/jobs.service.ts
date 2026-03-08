import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  db,
  jobs,
  companies,
  type Job,
  type NewJob,
} from '@jobboard/db';
import {
  eq,
  and,
  or,
  ilike,
  gte,
  lte,
  arrayOverlaps,
  desc,
  count,
  sql,
} from 'drizzle-orm';
import type { User } from '@jobboard/db';
import type { CreateJobInput } from './dto/create-job.input';
import type { UpdateJobInput } from './dto/update-job.input';
import type { JobsFilterInput } from './dto/jobs-filter.input';

@Injectable()
export class JobsService {
  // ── Helpers ─────────────────────────────────────────────────

  /** Generate a URL-safe slug from title + random suffix to avoid collisions */
  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${base}-${suffix}`;
  }

  /** Verify the requesting user owns the company that owns the job */
  private async assertJobOwnership(jobId: number, userId: string): Promise<Job> {
    const result = await db
      .select({ job: jobs, companyOwnerId: companies.ownerId })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!result[0]) throw new NotFoundException(`Job #${jobId} not found`);

    if (result[0].companyOwnerId !== userId) {
      throw new ForbiddenException('You do not own this job listing');
    }

    return result[0].job;
  }

  // ── Public queries ───────────────────────────────────────────

  async findAll(filters: JobsFilterInput): Promise<{ data: Job[]; total: number }> {
    const { search, workMode, employmentType, location, tags, salaryMin, page, limit } = filters;
    const offset = (page - 1) * limit;

    const conditions = [
      // Only active jobs in public listing
      eq(jobs.status, 'ACTIVE'),
      // Exclude expired jobs (belt + suspenders — cron sets status, but just in case)
      or(sql`${jobs.expiresAt} IS NULL`, gte(jobs.expiresAt, new Date())),
      // Optional filters
      search ? or(ilike(jobs.title, `%${search}%`), ilike(jobs.description, `%${search}%`)) : undefined,
      workMode ? eq(jobs.workMode, workMode as any) : undefined,
      employmentType ? eq(jobs.employmentType, employmentType as any) : undefined,
      location ? ilike(jobs.location, `%${location}%`) : undefined,
      tags?.length ? arrayOverlaps(jobs.tags, tags) : undefined,
      salaryMin ? gte(jobs.salaryMin, salaryMin) : undefined,
    ].filter(Boolean);

    const where = and(...(conditions as any[]));

    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(desc(jobs.isFeatured), desc(jobs.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(jobs).where(where),
    ]);

    return { data, total };
  }

  async findOne(slug: string): Promise<Job> {
    const result = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.slug, slug), eq(jobs.status, 'ACTIVE')))
      .limit(1);

    if (!result[0]) throw new NotFoundException(`Job not found`);

    // Fire-and-forget view count increment
    db.update(jobs)
      .set({ viewCount: sql`${jobs.viewCount} + 1` })
      .where(eq(jobs.id, result[0].id))
      .execute()
      .catch(() => {}); // non-critical

    return result[0];
  }

  // ── Employer queries ─────────────────────────────────────────

  async findByCompany(companyId: number, user: User): Promise<Job[]> {
    // Verify user owns this company
    const company = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.ownerId, user.id)))
      .limit(1);

    if (!company[0]) {
      throw new ForbiddenException('Company not found or access denied');
    }

    return db
      .select()
      .from(jobs)
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobs.createdAt));
  }

  // ── Mutations ────────────────────────────────────────────────

  async create(input: CreateJobInput, companyId: number, user: User): Promise<Job> {
    // Verify user owns the company
    const company = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.ownerId, user.id)))
      .limit(1);

    if (!company[0]) {
      throw new ForbiddenException('Company not found or access denied');
    }

    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    const newJob: NewJob = {
      ...input,
      companyId,
      slug: this.generateSlug(input.title),
      status: 'DRAFT',
      employmentType: (input.employmentType ?? 'FULL_TIME') as any,
      workMode: (input.workMode ?? 'ONSITE') as any,
    };

    const result = await db.insert(jobs).values(newJob).returning();
    return result[0];
  }

  async update(jobId: number, input: UpdateJobInput, user: User): Promise<Job> {
    await this.assertJobOwnership(jobId, user.id);

    if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    const result = await db
      .update(jobs)
      .set({ ...input } as any)
      .where(eq(jobs.id, jobId))
      .returning();

    return result[0];
  }

  async publish(jobId: number, user: User): Promise<Job> {
    const job = await this.assertJobOwnership(jobId, user.id);

    if (job.status === 'ACTIVE') {
      throw new BadRequestException('Job is already published');
    }

    // Default expiry: 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const result = await db
      .update(jobs)
      .set({
        status: 'ACTIVE',
        publishedAt: new Date(),
        expiresAt,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return result[0];
  }

  async close(jobId: number, user: User, status: 'EXPIRED' | 'FILLED' = 'FILLED'): Promise<Job> {
    await this.assertJobOwnership(jobId, user.id);

    const result = await db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, jobId))
      .returning();

    return result[0];
  }

  async remove(jobId: number, user: User): Promise<{ success: boolean }> {
    const job = await this.assertJobOwnership(jobId, user.id);

    if (job.status === 'ACTIVE') {
      throw new BadRequestException(
        'Cannot delete an active job. Close it first.',
      );
    }

    await db.delete(jobs).where(eq(jobs.id, jobId));
    return { success: true };
  }
}
