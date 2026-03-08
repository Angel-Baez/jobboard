import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/me
   * Returns the currently authenticated user.
   * SessionGuard runs globally — no @UseGuards() needed here.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: User) {
    // SessionGuard already fetched and validated the user
    // We expose only safe fields (no internal DB fields like emailVerified)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
    };
  }
}
