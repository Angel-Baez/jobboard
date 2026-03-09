import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

const WorkMode = ['REMOTE', 'ONSITE', 'HYBRID'] as const;
const EmploymentType = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const;

@InputType()
export class JobFiltersDto extends PaginationDto {
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
}
