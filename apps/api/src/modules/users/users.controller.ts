import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, SwitchRoleDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me */
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  /** PATCH /users/me */
  @Patch('me')
  updateMe(@Body() dto: UpdateUserDto, @CurrentUser() user: User) {
    return this.usersService.update(user.id, dto, user);
  }

  /**
   * POST /users/me/role
   * Onboarding endpoint — lets a user choose CANDIDATE or EMPLOYER.
   * Auth.js creates users as CANDIDATE by default (see events.createUser).
   */
  @Post('me/role')
  @HttpCode(HttpStatus.OK)
  switchRole(@Body() dto: SwitchRoleDto, @CurrentUser() user: User) {
    return this.usersService.switchRole(user.id, dto, user);
  }

  // ── Admin endpoints ───────────────────────────────────────

  @Roles('ADMIN')
  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  @Roles('ADMIN')
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Roles('ADMIN')
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivate(id);
  }
}
