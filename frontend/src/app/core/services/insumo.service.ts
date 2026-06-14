import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';
import {
  CrearInsumoInput,
  InsumoDetalle,
  InsumoListItem,
  Movimiento,
  ResumenStock,
} from '../models/insumo.model';

export interface ListarInsumosQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  stock_bajo?: boolean;
  activos_solo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InsumoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/insumos`;

  listar(q: ListarInsumosQuery = {}): Observable<PaginatedResponse<InsumoListItem>> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<InsumoListItem>>(this.base, { params });
  }

  obtener(id: number): Observable<ApiResponse<InsumoDetalle>> {
    return this.http.get<ApiResponse<InsumoDetalle>>(`${this.base}/${id}`);
  }

  crear(input: CrearInsumoInput): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(this.base, input);
  }

  actualizar(id: number, input: Partial<CrearInsumoInput> & { razon_cambio_precio?: string; activo?: boolean }) {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/${id}`, input);
  }

  ingreso(id: number, body: { cantidad: number; precio_unitario?: number; proveedor?: string; numero_lote?: string; observaciones?: string }) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/ingreso`, body);
  }

  egreso(id: number, body: { cantidad: number; motivo?: string; observaciones?: string }) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/egreso`, body);
  }

  movimientos(id: number, page = 1, limit = 20): Observable<PaginatedResponse<Movimiento>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<Movimiento>>(`${this.base}/${id}/movimientos`, { params });
  }

  resumenStock(): Observable<ApiResponse<ResumenStock>> {
    return this.http.get<ApiResponse<ResumenStock>>(`${this.base}/stock/resumen`);
  }

  categorias(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/categorias`);
  }
}
