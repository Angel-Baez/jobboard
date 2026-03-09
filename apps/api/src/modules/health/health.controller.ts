import { db } from '@jobboard/db';
import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HttpHealthIndicator
} from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    // Liveness check
    return this.health.check([]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  async ready() {
    // Readiness check: DB, maybe Redis/Inngest in future
    return this.health.check([
      async () => {
        try {
          await db.execute(sql`SELECT 1`);
          return { database: { status: 'up' } };
        } catch (e: any) {
          return { database: { status: 'down', message: e.message } };
        }
      }
    ]);
  }
}
