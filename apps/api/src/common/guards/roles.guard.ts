import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@jobboard/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // No @Roles() decorator → route only requires auth, not a specific role
    if (!requiredRoles?.length) return true;

    const request =
      ctx.getType() === 'http'
        ? ctx.switchToHttp().getRequest()
        : GqlExecutionContext.create(ctx).getContext().req;

    const user = request.user;

    // SessionGuard should have run first and set request.user
    if (!user) {
      throw new ForbiddenException('User not found on request');
    }

    // ADMIN bypasses all role restrictions
    if (user.role === 'ADMIN') return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
