import { InputType, PartialType } from '@nestjs/graphql';
import { CreateCompanyDto } from './create-company.dto';

@InputType()
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
