import { Field, Int, ObjectType } from '@nestjs/graphql';
import { JobType } from './job.type';

@ObjectType()
export class PaginatedJobsType {
  @Field(() => [JobType])
  data: JobType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
