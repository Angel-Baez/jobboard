import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { User } from '@jobboard/db';

/**
 * Extracts the authenticated user from request (REST) or GQL context.
 * Set by SessionGuard after validating the session token.
 *
 * @example REST
 * @Get('me')
 * getMe(@CurrentUser() user: User) { return user; }
 *
 * @example GraphQL
 * @Query(() => UserType)
 * me(@CurrentUser() user: User) { return user; }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    // Handle both REST and GraphQL contexts
    if (ctx.getType() === 'http') {
      return ctx.switchToHttp().getRequest().user;
    }

    const gqlCtx = GqlExecutionContext.create(ctx);
    return gqlCtx.getContext().req.user;
  },
);
