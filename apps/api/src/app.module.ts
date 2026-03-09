import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RolesGuard } from './common/guards/roles.guard';
import { SessionGuard } from './common/guards/session.guard';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { InngestModule } from './modules/inngest/inngest.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      // Pass the raw request into GraphQL context
      // so guards and @CurrentUser() can access cookies/headers
      context: ({ req }: { req: Request }) => ({ req }),
    }),

    AuthModule,
    JobsModule,
    CompaniesModule,
    ApplicationsModule,
    InngestModule,
    FilesModule,
    UsersModule,
    HealthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Global limit: 100 requests per minute
      },
    ]),
  ],

  providers: [
    // SessionGuard runs on EVERY route by default.
    // Use @Public() decorator to opt-out on specific routes.
    {
      provide: APP_GUARD,
      useClass: SessionGuard,
    },
    // RolesGuard runs after SessionGuard (user is already on request).
    // Only enforces when @Roles() decorator is present.
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
