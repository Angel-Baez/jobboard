import { InputType, PartialType } from '@nestjs/graphql';
import { CreateJobDto } from './create-job.dto';

@InputType()
export class UpdateJobDto extends PartialType(CreateJobDto) {}
