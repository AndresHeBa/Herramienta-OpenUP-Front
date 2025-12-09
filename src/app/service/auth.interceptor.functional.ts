import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const user = authService.getCurrentUser();
  
  if (user?.roles && user.roles.length > 0) {
    req = req.clone({
      setHeaders: {
        'X-User-Roles': user.roles.join(',')
      },
      withCredentials: true
    });
  } else {
    req = req.clone({
      withCredentials: true
    });
  }
  
  return next(req);
};
