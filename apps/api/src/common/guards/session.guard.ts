import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // Allow @Public() routes through unconditionally
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = this.extractRequest(ctx);
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    // Validate against DB and attach user to request
    request.user = await this.authService.validateSession(token);
    return true;
  }

  /**
   * Extract the raw request regardless of transport (REST or GraphQL).
   */
  private extractRequest(ctx: ExecutionContext): any {
    if (ctx.getType() === 'http') {
      return ctx.switchToHttp().getRequest();
    }
    return GqlExecutionContext.create(ctx).getContext().req;
  }

  /**
   * Auth.js sets the session token in a cookie.
   * Cookie name changes based on environment:
   *   - development:  next-auth.session-token
   *   - production:   __Secure-next-auth.session-token
   *
   * We also support Authorization: Bearer <token> as fallback
   * for programmatic API clients (e.g. mobile apps, Inngest webhooks).
   */
  private extractToken(request: any): string | null {
    // 1. Try Authorization header first (API clients)
    const authHeader = request.headers?.authorization as string;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // 2. Try Auth.js session cookie (Next.js frontend)
    const cookies = request.cookies ?? {};
    return (
      cookies['next-auth.session-token'] ??
      cookies['__Secure-next-auth.session-token'] ??
      null
    );
  }
}
