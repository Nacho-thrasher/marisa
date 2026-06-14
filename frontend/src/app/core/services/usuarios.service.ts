import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';
import { Rol } from '../models/auth.model';

export interface UsuarioItem {
  id: number;
  username: string;
  email: string;
  rol: Rol;
  activo: boolean;
  ultimo_login: string | null;
  fecha_creacion: string;
}

export interface CrearUsuario {
  username: string;
  email: string;
  password: string;
  rol: Rol;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(page = 1, limit = 20, filtros: { search?: string; rol?: string } = {}): Observable<PaginatedResponse<UsuarioItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.rol) params = params.set('rol', filtros.rol);
    return this.http.get<PaginatedResponse<UsuarioItem>>(`${this.api}/usuarios`, { params });
  }

  crear(body: CrearUsuario) {
    return this.http.post<ApiResponse<UsuarioItem>>(`${this.api}/usuarios`, body);
  }

  actualizar(id: number, body: Partial<{ email: string; rol: Rol; activo: boolean }>) {
    return this.http.patch<ApiResponse<UsuarioItem>>(`${this.api}/usuarios/${id}`, body);
  }

  resetPassword(id: number, password: string) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/usuarios/${id}/reset-password`, { password });
  }
}
