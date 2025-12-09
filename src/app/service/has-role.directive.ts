import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../service/auth.service';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  @Input() hasRole!: string | string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateView();
    
    // Suscribirse a cambios en el usuario
    this.authService.currentUser$.subscribe(() => {
      this.updateView();
    });
  }

  private updateView() {
    const roles = Array.isArray(this.hasRole) ? this.hasRole : [this.hasRole];
    const hasAccess = this.authService.hasAnyRole(roles);
    
    this.viewContainer.clear();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
