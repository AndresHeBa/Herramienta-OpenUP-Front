import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../service/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.authService.getCurrentUser();
    
    console.log('[INTERCEPTOR] Request to:', req.url);
    console.log('[INTERCEPTOR] Current user:', user);
    
    if (user?.roles && user.roles.length > 0) {
      // Añadir header con los roles del usuario
      console.log('[INTERCEPTOR] Adding X-User-Roles header:', user.roles.join(','));
      req = req.clone({
        setHeaders: {
          'X-User-Roles': user.roles.join(',')
        },
        withCredentials: true  // Importante para enviar cookies de sesión
      });
    } else {
      console.log('[INTERCEPTOR] No user roles, only adding withCredentials');
      // Aunque no haya usuario, enviar withCredentials para mantener sesión
      req = req.clone({
        withCredentials: true
      });
    }
    
    return next.handle(req);
  }
}
