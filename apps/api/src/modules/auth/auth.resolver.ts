import { Query, Resolver } from '@nestjs/graphql';
import { UserType } from './dto/user.type';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@jobboard/db';

@Resolver()
export class AuthResolver {
  /**
   * query { me { id name email role } }
   * SessionGuard runs globally via APP_GUARD — no @UseGuards() needed.
   */
  @Query(() => UserType, { name: 'me' })
  getMe(@CurrentUser() user: User): UserType {
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
