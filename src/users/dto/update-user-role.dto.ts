import { IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
