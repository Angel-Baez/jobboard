import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

const APPLICATION_STATUSES = [
  'PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED',
] as const;

@InputType()
export class UpdateStatusDto {
  @Field()
  @IsEnum(APPLICATION_STATUSES)
  status: (typeof APPLICATION_STATUSES)[number];

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  employerNotes?: string;
}
