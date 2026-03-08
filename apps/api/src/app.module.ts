import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { InngestModule } from './modules/inngest/inngest.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { FilesModule } from './modules/files/files.module';
import { UsersModule } from './modules/users/users.module';
import { SessionGuard } from './common/guards/session.guard';
import { RolesGuard } from './common/guards/roles.guard';

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
  ],
})
export class AppModule {}
