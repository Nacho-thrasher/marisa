import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/ui/toast.service';

/**
 * Descarga archivos protegidos por JWT: pide el blob con HttpClient (el
 * authInterceptor agrega el token) y dispara la descarga en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class DescargasService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private api = environment.apiUrl;

  /** True mientras hay una descarga en curso (para feedback en la UI). */
  readonly descargando = signal(false);

  descargar(path: string, filename: string) {
    this.descargando.set(true);
    this.http
      .get(`${this.api}${path}`, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (res) => {
          const blob = res.body;
          if (!blob || blob.size === 0) {
            this.toast.error('El archivo llegó vacío. Intentá de nuevo.');
            this.descargando.set(false);
            return;
          }
          // Usar '||' (no '??') para que un header vacío caiga al filename pasado.
          const nombre = this.filenameDesdeCabecera(res) || filename;
          this.guardar(blob, nombre);
          this.descargando.set(false);
        },
        error: () => {
          this.toast.error('No se pudo descargar el archivo.');
          this.descargando.set(false);
        },
      });
  }

  /** Dispara la descarga de un Blob conservando el nombre indicado. */
  private guardar(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    // El anchor DEBE estar en el DOM para que el atributo download se respete
    // (si no, el navegador usa el UUID del blob como nombre de archivo).
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revocar más tarde: si se revoca de inmediato, la descarga puede abortar
    // o caer al nombre por defecto (el GUID del blob).
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /** Intenta leer el filename del header Content-Disposition (si el server lo expone). */
  private filenameDesdeCabecera(res: HttpResponse<Blob>): string | null {
    const cd = res.headers.get('Content-Disposition');
    if (!cd) return null;
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    if (utf8) return decodeURIComponent(utf8[1]);
    const simple = /filename="?([^";]+)"?/i.exec(cd);
    return simple ? simple[1] : null;
  }
}
