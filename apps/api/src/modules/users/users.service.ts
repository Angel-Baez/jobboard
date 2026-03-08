import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { db, users, companies, applications, type User } from '@jobboard/db';
import { eq, count } from 'drizzle-orm';
import { UpdateUserDto, SwitchRoleDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  async findOne(id: string): Promise<User> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user[0]) throw new NotFoundException(`User #${id} not found`);
    return user[0];
  }

  async update(id: string, dto: UpdateUserDto, requestingUser: User): Promise<User> {
    // Users can only update their own profile (admins can update anyone)
    if (requestingUser.role !== 'ADMIN' && requestingUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const [updated] = await db
      .update(users)
      .set(dto)
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`User #${id} not found`);
    return updated;
  }

  /**
   * Onboarding: let a user switch between CANDIDATE and EMPLOYER.
   * Guards:
   *  - ADMIN role cannot be self-assigned
   *  - Employers with active jobs cannot switch back to CANDIDATE
   */
  async switchRole(id: string, dto: SwitchRoleDto, requestingUser: User): Promise<User> {
    if (requestingUser.id !== id && requestingUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only change your own role');
    }

    const user = await this.findOne(id);

    if (user.role === dto.role) {
      throw new BadRequestException(`User is already a ${dto.role}`);
    }

    // Prevent employers from switching to CANDIDATE if they have active jobs
    if (user.role === 'EMPLOYER' && dto.role === 'CANDIDATE') {
      const company = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.ownerId, id))
        .limit(1);

      if (company[0]) {
        throw new BadRequestException(
          'Cannot switch to CANDIDATE while you have a company. Delete or transfer the company first.',
        );
      }
    }

    const [updated] = await db
      .update(users)
      .set({ role: dto.role })
      .where(eq(users.id, id))
      .returning();

    return updated;
  }

  /**
   * Soft-deactivate: disables login without deleting data.
   * Admin only.
   */
  async deactivate(id: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`User #${id} not found`);
    return updated;
  }

  async reactivate(id: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ isActive: true })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`User #${id} not found`);
    return updated;
  }

  /** Stats for the admin dashboard */
  async getStats() {
    const [total, candidates, employers, admins, applications: appCount] = await Promise.all([
      db.select({ c: count() }).from(users),
      db.select({ c: count() }).from(users).where(eq(users.role, 'CANDIDATE')),
      db.select({ c: count() }).from(users).where(eq(users.role, 'EMPLOYER')),
      db.select({ c: count() }).from(users).where(eq(users.role, 'ADMIN')),
      db.select({ c: count() }).from(applications),
    ]);

    return {
      totalUsers: Number(total[0].c),
      candidates: Number(candidates[0].c),
      employers: Number(employers[0].c),
      admins: Number(admins[0].c),
      totalApplications: Number(appCount[0].c),
    };
  }
}
