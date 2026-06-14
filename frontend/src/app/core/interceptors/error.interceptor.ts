import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

/** Muestra errores en un snackbar y cierra sesión ante un 401. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snack = inject(MatSnackBar);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // No notificar el 401 del propio login (lo maneja el formulario).
      const esLogin = req.url.endsWith('/auth/login');

      if (err.status === 401 && !esLogin) {
        auth.clearSession();
      } else if (!esLogin) {
        const msg = err.error?.message ?? 'Ocurrió un error inesperado';
        const detalle = err.error?.errors?.[0]?.message;
        snack.open(detalle ? `${msg}: ${detalle}` : msg, 'Cerrar', { duration: 5000 });
      }

      return throwError(() => err);
    }),
  );
};
