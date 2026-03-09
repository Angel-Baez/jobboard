import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@InputType()
export class ApplicationFiltersDto extends PaginationDto {
  @Field(() => String, { nullable: true })
  @IsEnum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'])
  @IsOptional()
  status?: string;
}
