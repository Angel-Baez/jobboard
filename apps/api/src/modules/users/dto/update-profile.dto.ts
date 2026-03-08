import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateProfileDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  bio?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
