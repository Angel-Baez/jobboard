import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateApplicationDto {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  jobId: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  coverLetter?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  resumeFileId?: number;
}
