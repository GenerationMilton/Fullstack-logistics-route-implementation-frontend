import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CorrelationIdService } from '../services/correlation-id.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const correlationIdService = inject(CorrelationIdService);

  const token = authService.getToken();
  const correlationId = correlationIdService.id;

  const headers: Record<string, string> = {
    'x-correlation-id': correlationId
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers }));
};
