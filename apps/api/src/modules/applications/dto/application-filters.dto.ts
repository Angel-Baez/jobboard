import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field, Int } from '@nestjs/graphql';

const APPLICATION_STATUSES = [
  'PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED',
] as const;

@InputType()
export class ApplicationFiltersDto {
  @Field(() => String, { nullable: true })
  @IsEnum(APPLICATION_STATUSES)
  @IsOptional()
  status?: (typeof APPLICATION_STATUSES)[number];

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
