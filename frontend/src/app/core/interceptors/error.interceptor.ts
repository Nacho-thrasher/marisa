import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast.service';
import { AuthService } from '../services/auth.service';

/** Muestra errores en un toast y cierra sesión ante un 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const esLogin = req.url.endsWith('/auth/login');

      if (err.status === 401 && !esLogin) {
        auth.clearSession();
      } else if (!esLogin) {
        const msg = err.error?.message ?? 'Ocurrió un error inesperado';
        const detalle = err.error?.errors?.[0]?.message;
        toast.error(detalle ? `${msg}: ${detalle}` : msg);
      }

      return throwError(() => err);
    }),
  );
};
