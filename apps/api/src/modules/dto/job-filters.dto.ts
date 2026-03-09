import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field, Int } from '@nestjs/graphql';

const WorkMode = ['REMOTE', 'ONSITE', 'HYBRID'] as const;
const EmploymentType = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const;

@InputType()
export class JobFiltersDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: (typeof WorkMode)[number];

  @Field(() => String, { nullable: true })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: (typeof EmploymentType)[number];

  @Field(() => [String], { nullable: true })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  salaryMin?: number;

  // Pagination
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
