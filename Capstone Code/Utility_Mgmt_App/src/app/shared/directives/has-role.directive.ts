import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective {
  @Input('hasRole') set role(value: string | string[]) {
    this.viewContainer.clear();
    const roles = Array.isArray(value) ? value : [value];
    if (this.auth.hasRole(roles)) {
      this.viewContainer.createEmbeddedView(this.template);
    }
  }

  constructor(
    private template: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private auth: AuthService
  ) {}
}
