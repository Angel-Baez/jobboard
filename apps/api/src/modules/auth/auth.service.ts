import { Injectable, UnauthorizedException } from '@nestjs/common';
import { db, sessions, users } from '@jobboard/db';
import { eq } from 'drizzle-orm';
import type { User } from '@jobboard/db';

@Injectable()
export class AuthService {
  /**
   * Validate an Auth.js session token against the DB.
   * Called by SessionGuard on every protected request.
   *
   * Auth.js stores sessions in the `sessions` table.
   * The cookie `next-auth.session-token` holds the token value.
   */
  async validateSession(sessionToken: string): Promise<User> {
    if (!sessionToken) {
      throw new UnauthorizedException('No session token provided');
    }

    // Join sessions → users in one query
    const result = await db
      .select({
        // Session fields we need
        expires: sessions.expires,
        // User fields we expose
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        phone: users.phone,
        bio: users.bio,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Required by User type but not used in session context
        emailVerified: users.emailVerified,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);

    const row = result[0];

    if (!row) {
      throw new UnauthorizedException('Session not found');
    }

    if (row.expires < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (!row.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Return just the user shape (drop the `expires` field)
    const { expires: _expires, ...user } = row;
    return user as User;
  }

  /**
   * Get the full user record by ID.
   * Used in auth.controller / auth.resolver for /me endpoints.
   */
  async getMe(userId: string): Promise<User> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]) {
      throw new UnauthorizedException('User not found');
    }

    return user[0];
  }
}
