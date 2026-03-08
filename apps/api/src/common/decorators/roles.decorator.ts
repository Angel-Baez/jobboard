import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@jobboard/types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles. Combine with @UseGuards(RolesGuard).
 * ADMIN always passes regardless of roles specified.
 *
 * @example
 * @Roles('EMPLOYER', 'ADMIN')
 * @Post('jobs')
 * createJob() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
