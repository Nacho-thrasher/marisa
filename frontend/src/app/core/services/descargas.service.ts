import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Descarga archivos protegidos por JWT: pide el blob con HttpClient (el
 * authInterceptor agrega el token) y dispara la descarga en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class DescargasService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  descargar(path: string, filename: string) {
    this.http.get(`${this.api}${path}`, { responseType: 'blob' }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
