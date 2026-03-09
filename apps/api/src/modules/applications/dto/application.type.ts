import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class ApplicationType {
  @Field(() => ID)
  id!: number;

  @Field(() => Int)
  jobId!: number;

  @Field()
  candidateId!: string;

  @Field(() => Int, { nullable: true })
  resumeFileId!: number | null;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  coverLetter!: string | null;

  @Field(() => String, { nullable: true })
  employerNotes!: string | null;

  @Field(() => Date, { nullable: true })
  statusChangedAt!: Date | null;

  @Field(() => Date, { nullable: true })
  autoExpireAt!: Date | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class PaginatedApplicationsType {
  @Field(() => [ApplicationType])
  items!: ApplicationType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field()
  hasMore!: boolean;
}
