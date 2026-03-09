import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class CompanyType {
  @Field(() => ID)
  id!: number;

  @Field()
  ownerId!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  website!: string | null;

  @Field(() => String, { nullable: true })
  location!: string | null;

  @Field(() => String, { nullable: true })
  size!: string | null;

  @Field(() => String, { nullable: true })
  industry!: string | null;

  @Field(() => Int, { nullable: true })
  logoFileId!: number | null;

  @Field()
  isVerified!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
