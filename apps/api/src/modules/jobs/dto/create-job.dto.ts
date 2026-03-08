import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';

const EmploymentType = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const;
const WorkMode = ['REMOTE', 'ONSITE', 'HYBRID'] as const;

@InputType()
export class CreateJobDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  requirements?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  benefits?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @Field(() => String, { defaultValue: 'FULL_TIME' })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: (typeof EmploymentType)[number];

  @Field(() => String, { defaultValue: 'ONSITE' })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: (typeof WorkMode)[number];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMax?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  salaryCurrency?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(15)
  @IsOptional()
  tags?: string[];
}
