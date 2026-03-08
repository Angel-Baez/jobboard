import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { db, companies, type Company, type NewCompany } from '@jobboard/db';
import { eq, ilike } from 'drizzle-orm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import type { User } from '@jobboard/db';

@Injectable()
export class CompaniesService {
  // ── Helpers ────────────────────────────────────────────────

  private generateSlug(name: string, id?: number): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return id ? `${base}-${id}` : base;
  }

  private async assertOwnership(companyId: number, user: User): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company[0]) {
      throw new NotFoundException(`Company #${companyId} not found`);
    }

    if (user.role !== 'ADMIN' && company[0].ownerId !== user.id) {
      throw new ForbiddenException('You do not own this company');
    }

    return company[0];
  }

  // ── Queries ────────────────────────────────────────────────

  async findAll(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async findOne(id: number): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (!company[0]) throw new NotFoundException(`Company #${id} not found`);
    return company[0];
  }

  async findBySlug(slug: string): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);

    if (!company[0]) throw new NotFoundException(`Company "${slug}" not found`);
    return company[0];
  }

  /**
   * Get the company owned by a user.
   * Used by JobsService to resolve companyId from user.id.
   * An employer can only own one company (enforced here).
   */
  async findByOwner(userId: string): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.ownerId, userId))
      .limit(1);

    if (!company[0]) {
      throw new NotFoundException(
        'No company found for this user. Please create a company first.',
      );
    }

    return company[0];
  }

  async search(query: string): Promise<Company[]> {
    return db
      .select()
      .from(companies)
      .where(ilike(companies.name, `%${query}%`));
  }

  // ── Mutations ──────────────────────────────────────────────

  async create(dto: CreateCompanyDto, user: User): Promise<Company> {
    // One company per employer
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.ownerId, user.id))
      .limit(1);

    if (existing[0]) {
      throw new ConflictException(
        'You already have a company. Update it instead of creating a new one.',
      );
    }

    const slug = this.generateSlug(dto.name);

    const [company] = await db
      .insert(companies)
      .values({
        ...dto,
        ownerId: user.id,
        slug,
      } satisfies Omit<NewCompany, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'logoFileId'>)
      .returning();

    // Append ID to guarantee slug uniqueness
    const finalSlug = this.generateSlug(dto.name, company.id);
    await db
      .update(companies)
      .set({ slug: finalSlug })
      .where(eq(companies.id, company.id));

    return { ...company, slug: finalSlug };
  }

  async update(id: number, dto: UpdateCompanyDto, user: User): Promise<Company> {
    await this.assertOwnership(id, user);

    const [updated] = await db
      .update(companies)
      .set(dto)
      .where(eq(companies.id, id))
      .returning();

    return updated;
  }

  async setLogo(companyId: number, fileId: number, user: User): Promise<Company> {
    await this.assertOwnership(companyId, user);

    const [updated] = await db
      .update(companies)
      .set({ logoFileId: fileId })
      .where(eq(companies.id, companyId))
      .returning();

    return updated;
  }

  /** Called by ADMIN only */
  async verify(companyId: number): Promise<Company> {
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company[0]) throw new NotFoundException(`Company #${companyId} not found`);

    const [updated] = await db
      .update(companies)
      .set({ isVerified: true })
      .where(eq(companies.id, companyId))
      .returning();

    return updated;
  }
}
