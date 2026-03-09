import { Field, InputType, Int } from '@nestjs/graphql';
import {
    ArrayMaxSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSalaryRangeValid', async: false })
export class IsSalaryRangeValidConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as any;
    const salaryMin = dto.salaryMin;
    const salaryMax = dto.salaryMax;
    if (salaryMin !== undefined && salaryMax !== undefined) {
      return salaryMin <= salaryMax;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'salaryMin must be less than or equal to salaryMax';
  }
}

export function IsSalaryRangeValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSalaryRangeValidConstraint,
    });
  };
}

const EmploymentType = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'] as const;
const WorkMode = ['REMOTE', 'ONSITE', 'HYBRID'] as const;

@InputType()
export class CreateJobDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  requirements?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  benefits?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @Field(() => String, { defaultValue: 'FULL_TIME' })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: (typeof EmploymentType)[number];

  @Field(() => String, { defaultValue: 'ONSITE' })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: (typeof WorkMode)[number];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  @IsSalaryRangeValid()
  salaryMax?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  salaryCurrency?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(15)
  @IsOptional()
  tags?: string[];
}
