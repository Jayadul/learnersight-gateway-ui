import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

/** Structural directive: *appHasRole="['SuperAdmin']" — removes host if role not allowed. */
@Directive({ selector: '[appHasRole]', standalone: true })
export class HasRoleDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private shown = false;

  @Input() set appHasRole(roles: string[]) {
    const user = this.auth.getCurrentUser();
    const allowed = !!user && roles.includes(user.role);
    if (allowed && !this.shown) {
      this.vcr.createEmbeddedView(this.tpl);
      this.shown = true;
    } else if (!allowed && this.shown) {
      this.vcr.clear();
      this.shown = false;
    }
  }
}
