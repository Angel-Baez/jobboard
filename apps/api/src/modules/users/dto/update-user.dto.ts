import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

// Candidates can become employers via onboarding — not the reverse
const SWITCHABLE_ROLES = ['CANDIDATE', 'EMPLOYER'] as const;

@InputType()
export class UpdateUserDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[\d\s\-().]{7,20}$/, { message: 'Invalid phone number' })
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}

@InputType()
export class SwitchRoleDto {
  @Field()
  @IsEnum(SWITCHABLE_ROLES)
  role!: (typeof SWITCHABLE_ROLES)[number];
}
