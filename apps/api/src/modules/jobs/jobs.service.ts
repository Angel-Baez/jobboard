import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { db, jobs, companies, type Job, type NewJob } from '@jobboard/db';
import { eq, and, ilike, gte, desc, count, sql } from 'drizzle-orm';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobFiltersDto } from './dto/job-filters.dto';
import type { User } from '@jobboard/db';

@Injectable()
export class JobsService {
  private generateSlug(title: string, id?: number): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return id ? `${base}-${id}` : base;
  }

  private async assertOwnership(jobId: number, user: User): Promise<Job> {
    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) throw new NotFoundException(`Job #${jobId} not found`);
    if (user.role === 'ADMIN') return job[0];

    const company = await db
      .select({ ownerId: companies.ownerId })
      .from(companies)
      .where(eq(companies.id, job[0].companyId))
      .limit(1);

    if (company[0]?.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this job listing');
    }

    return job[0];
  }

  /**
   * Resolve the employer's companyId from their userId.
   * Called before create() to avoid hardcoded placeholder.
   */
  private async resolveCompanyId(userId: string): Promise<number> {
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.ownerId, userId))
      .limit(1);

    if (!company[0]) {
      throw new BadRequestException(
        'You must create a company profile before posting jobs.',
      );
    }

    return company[0].id;
  }

  // ── Public queries ─────────────────────────────────────────

  async findAll(filters: JobFiltersDto) {
    const {
      search, location, workMode, employmentType,
      tags, salaryMin, page = 1, limit = 20,
    } = filters;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(jobs.status, 'ACTIVE'),
      search ? ilike(jobs.title, `%${search}%`) : undefined,
      location ? ilike(jobs.location, `%${location}%`) : undefined,
      workMode ? eq(jobs.workMode, workMode) : undefined,
      employmentType ? eq(jobs.employmentType, employmentType) : undefined,
      salaryMin ? gte(jobs.salaryMin, salaryMin) : undefined,
      tags?.length
        ? sql`${jobs.tags} @> ARRAY[${sql.join(tags.map((t) => sql`${t}`), sql`, `)}]::varchar[]`
        : undefined,
    ].filter(Boolean);

    const where = and(...(conditions as any[]));

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(where)
        .orderBy(desc(jobs.isFeatured), desc(jobs.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(jobs).where(where),
    ]);

    return { items, total: Number(total), page, limit, hasMore: offset + items.length < Number(total) };
  }

  async findBySlug(slug: string): Promise<Job> {
    const job = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.slug, slug), eq(jobs.status, 'ACTIVE')))
      .limit(1);

    if (!job[0]) throw new NotFoundException(`Job "${slug}" not found`);

    void db
      .update(jobs)
      .set({ viewCount: sql`${jobs.viewCount} + 1` })
      .where(eq(jobs.id, job[0].id));

    return job[0];
  }

  async findByCompany(companyId: number): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.companyId, companyId))
      .orderBy(desc(jobs.createdAt));
  }

  async findOne(id: number): Promise<Job> {
    const job = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!job[0]) throw new NotFoundException(`Job #${id} not found`);
    return job[0];
  }

  // ── Mutations ──────────────────────────────────────────────

  async create(dto: CreateJobDto, user: User): Promise<Job> {
    if (dto.salaryMin && dto.salaryMax && dto.salaryMin > dto.salaryMax) {
      throw new BadRequestException('salaryMin cannot be greater than salaryMax');
    }

    // Resolved from DB — no more placeholder
    const companyId = await this.resolveCompanyId(user.id);
    const slug = this.generateSlug(dto.title);

    const [job] = await db
      .insert(jobs)
      .values({
        ...dto,
        companyId,
        slug,
        status: 'DRAFT',
        employmentType: dto.employmentType ?? 'FULL_TIME',
        workMode: dto.workMode ?? 'ONSITE',
      } satisfies Omit<NewJob, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'applicationCount' | 'isFeatured'>)
      .returning();

    const finalSlug = this.generateSlug(dto.title, job.id);
    await db.update(jobs).set({ slug: finalSlug }).where(eq(jobs.id, job.id));

    return { ...job, slug: finalSlug };
  }

  async update(id: number, dto: UpdateJobDto, user: User): Promise<Job> {
    await this.assertOwnership(id, user);
    const [updated] = await db.update(jobs).set(dto).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async publish(id: number, user: User): Promise<Job> {
    const job = await this.assertOwnership(id, user);
    if (job.status === 'ACTIVE') throw new BadRequestException('Job is already published');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [updated] = await db
      .update(jobs)
      .set({ status: 'ACTIVE', publishedAt: now, expiresAt })
      .where(eq(jobs.id, id))
      .returning();

    return updated;
  }

  async unpublish(id: number, user: User): Promise<Job> {
    await this.assertOwnership(id, user);
    const [updated] = await db.update(jobs).set({ status: 'DRAFT' }).where(eq(jobs.id, id)).returning();
    return updated;
  }

  async remove(id: number, user: User): Promise<void> {
    await this.assertOwnership(id, user);
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // ── Inngest / cron helpers ─────────────────────────────────

  async expireStaleJobs(): Promise<number> {
    const result = await db
      .update(jobs)
      .set({ status: 'EXPIRED' })
      .where(and(eq(jobs.status, 'ACTIVE'), sql`${jobs.expiresAt} < NOW()`))
      .returning({ id: jobs.id });
    return result.length;
  }

  async findExpiringJobs(daysAhead: number): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'ACTIVE'),
          sql`${jobs.expiresAt} BETWEEN NOW() AND NOW() + INTERVAL '${sql.raw(String(daysAhead))} days'`,
        ),
      );
  }
}
