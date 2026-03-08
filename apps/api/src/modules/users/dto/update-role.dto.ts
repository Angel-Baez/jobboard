import { IsEnum } from 'class-validator';

const ASSIGNABLE_ROLES = ['CANDIDATE', 'EMPLOYER'] as const;

export class UpdateRoleDto {
  @IsEnum(ASSIGNABLE_ROLES)
  role: (typeof ASSIGNABLE_ROLES)[number];
}
