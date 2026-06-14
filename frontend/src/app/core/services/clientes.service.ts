import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

export type TipoLista = 'MAYORISTA' | 'REVENDEDOR' | 'COMERCIO' | 'PUBLICO';

export interface Cliente {
  id: number;
  nombre: string;
  tipo_lista: TipoLista;
  zona: string | null;
  localidad: string | null;
  direccion: string | null;
  telefono: string | null;
  cuit: string | null;
  vendedor: string | null;
  vendedor_id: number | null;
}

export interface Vendedor {
  id: number;
  nombre: string;
  zona: string | null;
  telefono: string | null;
  clientes: number;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(page = 1, limit = 20, filtros: { search?: string; zona?: string } = {}): Observable<PaginatedResponse<Cliente>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.zona) params = params.set('zona', filtros.zona);
    return this.http.get<PaginatedResponse<Cliente>>(`${this.api}/clientes`, { params });
  }

  porZona() {
    return this.http.get<ApiResponse<{ zona: string; clientes: number }[]>>(`${this.api}/clientes/por-zona`);
  }

  zonas() {
    return this.http.get<ApiResponse<string[]>>(`${this.api}/clientes/zonas`);
  }

  crear(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/clientes`, body);
  }

  vendedores() {
    return this.http.get<ApiResponse<Vendedor[]>>(`${this.api}/vendedores`);
  }

  crearVendedor(body: { nombre: string; zona?: string; telefono?: string }) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/vendedores`, body);
  }
}
