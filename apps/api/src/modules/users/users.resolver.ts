import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserType } from '../auth/dto/user.type';
import { UpdateUserDto, SwitchRoleDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserType, { name: 'profile' })
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Mutation(() => UserType)
  updateProfile(
    @Args('input') input: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.update(user.id, input, user);
  }

  /**
   * mutation { switchRole(input: { role: EMPLOYER }) { id role } }
   * Used in /onboarding page after first sign-in.
   */
  @Mutation(() => UserType)
  switchRole(
    @Args('input') input: SwitchRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.switchRole(user.id, input, user);
  }
}
