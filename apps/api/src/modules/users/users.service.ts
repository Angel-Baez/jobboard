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

  async switchRole(id: string, dto: SwitchRoleDto, requestingUser: User): Promise<User> {
    if (requestingUser.id !== id && requestingUser.role !== 'ADMIN') {
      throw new ForbiddenException('You can only change your own role');
    }

    const user = await this.findOne(id);

    if (user.role === dto.role) {
      throw new BadRequestException(`User is already a ${dto.role}`);
    }

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

  async getStats() {
    // Renamed destructured variable to avoid clash with 'applications' table import
    const [totalRes, candidatesRes, employersRes, adminsRes, appsRes] =
      await Promise.all([
        db.select({ c: count() }).from(users),
        db.select({ c: count() }).from(users).where(eq(users.role, 'CANDIDATE')),
        db.select({ c: count() }).from(users).where(eq(users.role, 'EMPLOYER')),
        db.select({ c: count() }).from(users).where(eq(users.role, 'ADMIN')),
        db.select({ c: count() }).from(applications),
      ]);

    return {
      totalUsers: Number(totalRes[0].c),
      candidates: Number(candidatesRes[0].c),
      employers: Number(employersRes[0].c),
      admins: Number(adminsRes[0].c),
      totalApplications: Number(appsRes[0].c),
    };
  }
}
