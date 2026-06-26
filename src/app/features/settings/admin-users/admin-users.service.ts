import { Injectable } from '@angular/core';
import { BaseCrudService } from '../../../core/api/base-crud.service';
import { AdminUserDto, CreateAdminUserRequest, UpdateAdminUserRequest } from '../../../core/models/admin-user.model';
import { ApiEndpoints } from '../../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AdminUsersService extends BaseCrudService<AdminUserDto, CreateAdminUserRequest, UpdateAdminUserRequest> {
  protected readonly resourcePath = ApiEndpoints.adminUsers;
}
