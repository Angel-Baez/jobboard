import type { UserRole } from '@jobboard/types';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

// Register enum so GraphQL schema knows about it
registerEnumType(
  Object.fromEntries(
    (['CANDIDATE', 'EMPLOYER', 'ADMIN'] as UserRole[]).map((r) => [r, r]),
  ) as Record<UserRole, UserRole>,
  { name: 'UserRole' },
);

@ObjectType()
export class UserType {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  image!: string | null;

  @Field()
  role!: string;

  @Field(() => String, { nullable: true })
  phone!: string | null;

  @Field(() => String, { nullable: true })
  bio!: string | null;
}
