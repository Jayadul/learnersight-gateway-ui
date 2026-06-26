import { AdminRole } from './enums';

export interface AdminUserDto {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly role: AdminRole;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly lastLoginAt?: string;
}
export interface CreateAdminUserRequest {
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly role: AdminRole;
}
export interface UpdateAdminUserRequest {
  readonly email: string;
  readonly role: AdminRole;
  readonly isActive: boolean;
  readonly newPassword?: string | null;
}
