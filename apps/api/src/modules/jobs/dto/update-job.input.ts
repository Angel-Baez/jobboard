import { Field, InputType, Int, PartialType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateJobInput } from './create-job.input';

@InputType()
export class UpdateJobInput extends PartialType(CreateJobInput) {
  // Status can only be changed via dedicated endpoints (publish, expire, fill)
  // but we expose it here for admin use cases
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(['DRAFT', 'ACTIVE', 'EXPIRED', 'FILLED'])
  status?: string;
}
