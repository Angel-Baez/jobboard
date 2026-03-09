import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;

@InputType()
export class CreateCompanyDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsUrl()
  @IsOptional()
  website?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @Field(() => String, { nullable: true })
  @IsEnum(COMPANY_SIZES)
  @IsOptional()
  size?: (typeof COMPANY_SIZES)[number];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;
}
