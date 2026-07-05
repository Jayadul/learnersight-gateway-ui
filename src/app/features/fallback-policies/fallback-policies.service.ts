import { Injectable } from '@angular/core';
import { BaseCrudService } from '../../core/api/base-crud.service';
import { CreateFallbackPolicyRequest, FallbackPolicyDto, UpdateFallbackPolicyRequest } from '../../core/models/fallback-policy.model';
import { ApiEndpoints } from '../../core/api/api-endpoints';

@Injectable({ providedIn: 'root' })
export class FallbackPoliciesService extends BaseCrudService<FallbackPolicyDto, CreateFallbackPolicyRequest, UpdateFallbackPolicyRequest> {
  protected readonly resourcePath = ApiEndpoints.fallbackPolicies;
}
