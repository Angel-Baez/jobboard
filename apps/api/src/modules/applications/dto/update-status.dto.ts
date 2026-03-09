import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';

const APPLICATION_STATUSES = [
  'PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED',
] as const;

@InputType()
export class UpdateStatusDto {
  @Field(() => String)
  @IsEnum(APPLICATION_STATUSES)
  status!: (typeof APPLICATION_STATUSES)[number];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  employerNotes?: string;
}
