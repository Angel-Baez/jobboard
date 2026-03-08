import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  MaxLength,
  MinLength,
  Min,
  ArrayMaxSize,
} from 'class-validator';

@InputType()
export class CreateJobInput {
  @Field()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @Field()
  @IsString()
  @MinLength(50)
  description: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  requirements?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  benefits?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @Field(() => String, { defaultValue: 'FULL_TIME' })
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'])
  employmentType: string;

  @Field(() => String, { defaultValue: 'ONSITE' })
  @IsEnum(['REMOTE', 'ONSITE', 'HYBRID'])
  workMode: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @Field(() => String, { nullable: true, defaultValue: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  salaryCurrency?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];
}
