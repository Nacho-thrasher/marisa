import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

export interface LogItem {
  id: number;
  fecha: string;
  usuario: string | null;
  accion: string;
  modulo: string;
  tabla: string | null;
  registro_id: number | null;
  ip_origen: string | null;
}

export interface LogDetalle extends LogItem {
  valores_anteriores: unknown;
  valores_nuevos: unknown;
  user_agent: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  logs(page = 1, limit = 15, filtros: { accion?: string; modulo?: string } = {}): Observable<PaginatedResponse<LogItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filtros.accion) params = params.set('accion', filtros.accion);
    if (filtros.modulo) params = params.set('modulo', filtros.modulo);
    return this.http.get<PaginatedResponse<LogItem>>(`${this.api}/auditoria/logs`, { params });
  }

  obtener(id: number) {
    return this.http.get<ApiResponse<LogDetalle>>(`${this.api}/auditoria/logs/${id}`);
  }
}
