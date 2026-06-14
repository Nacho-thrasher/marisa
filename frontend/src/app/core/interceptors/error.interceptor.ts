import { HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast.service';
import { AuthService } from '../services/auth.service';

/**
 * Pasá `{ context: skipErrorToast() }` a una request para que el interceptor
 * NO muestre el toast de error: la pantalla lo maneja inline (ej. CTA a crear receta).
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const skipErrorToast = () => new HttpContext().set(SKIP_ERROR_TOAST, true);

/** Muestra errores en un toast y cierra sesión ante un 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const esLogin = req.url.endsWith('/auth/login');
      const silenciar = req.context.get(SKIP_ERROR_TOAST);

      if (err.status === 401 && !esLogin) {
        auth.clearSession();
      } else if (!esLogin && !silenciar) {
        const msg = err.error?.message ?? 'Ocurrió un error inesperado';
        const detalle = err.error?.errors?.[0]?.message;
        toast.error(detalle ? `${msg}: ${detalle}` : msg);
      }

      return throwError(() => err);
    }),
  );
};
