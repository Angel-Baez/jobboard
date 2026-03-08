import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route or controller as public — skips SessionGuard.
 *
 * @example
 * @Public()
 * @Get('jobs')
 * listJobs() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
