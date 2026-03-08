import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  image: string | null;

  @Field()
  role: string;

  @Field(() => String, { nullable: true })
  phone: string | null;

  @Field(() => String, { nullable: true })
  bio: string | null;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}
