import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

registerEnumType(
  { DRAFT: 'DRAFT', ACTIVE: 'ACTIVE', EXPIRED: 'EXPIRED', FILLED: 'FILLED' },
  { name: 'JobStatus' },
);
registerEnumType(
  {
    FULL_TIME: 'FULL_TIME',
    PART_TIME: 'PART_TIME',
    CONTRACT: 'CONTRACT',
    FREELANCE: 'FREELANCE',
    INTERNSHIP: 'INTERNSHIP',
  },
  { name: 'EmploymentType' },
);
registerEnumType(
  { REMOTE: 'REMOTE', ONSITE: 'ONSITE', HYBRID: 'HYBRID' },
  { name: 'WorkMode' },
);

@ObjectType()
export class JobType {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  slug: string;

  @Field()
  description: string;

  @Field(() => String, { nullable: true })
  requirements: string | null;

  @Field(() => String, { nullable: true })
  benefits: string | null;

  @Field(() => String, { nullable: true })
  location: string | null;

  @Field()
  employmentType: string;

  @Field()
  workMode: string;

  @Field()
  status: string;

  @Field(() => Int, { nullable: true })
  salaryMin: number | null;

  @Field(() => Int, { nullable: true })
  salaryMax: number | null;

  @Field(() => String, { nullable: true })
  salaryCurrency: string | null;

  @Field(() => [String], { nullable: true })
  tags: string[] | null;

  @Field(() => Boolean)
  isFeatured: boolean;

  @Field(() => Int)
  viewCount: number;

  @Field(() => Int)
  applicationCount: number;

  @Field(() => Date, { nullable: true })
  publishedAt: Date | null;

  @Field(() => Date, { nullable: true })
  expiresAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Populated via relation when needed
  @Field(() => Int)
  companyId: number;
}
