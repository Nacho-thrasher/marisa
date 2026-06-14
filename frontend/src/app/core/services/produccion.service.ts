import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  pesoGramos: number | null;
  costoPromedio: string | null;
  precioVenta: string | null;
  precioMayorista: string | null;
  precioRevendedor: string | null;
  precioComercio: string | null;
  precioPublico: string | null;
  activo: boolean;
}

export interface InsumoRequerido {
  insumo_id: number;
  nombre: string;
  cantidad: string;
  unidad: string;
  costo_unitario: string;
  stock_disponible: string;
  suficiente: boolean;
}

export interface OrdenListItem {
  orden_id: number;
  numero_orden: string;
  producto: string;
  cantidad_solicitada: string;
  cantidad_producida: string | null;
  fecha_produccion: string;
  estado: 'PLANIFICADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
  responsable: string | null;
}

export interface OrdenDetalle extends OrdenListItem {
  cantidad_defectuosa: string;
  observaciones: string | null;
  consumo_real: {
    insumo: string;
    cantidad_prevista: string;
    cantidad_utilizada: string;
    diferencia: string;
    porcentaje_diferencia: string;
    costo_total: string;
  }[];
  costo_real: string;
}

@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  productos(search?: string): Observable<PaginatedResponse<Producto>> {
    let params = new HttpParams().set('limit', 100);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<Producto>>(`${this.api}/productos`, { params });
  }

  preview(producto_id: number, cantidad_solicitada: number) {
    return this.http.post<ApiResponse<{ insumos_requeridos: InsumoRequerido[]; costo_estimado: string }>>(
      `${this.api}/produccion/preview`,
      { producto_id, cantidad_solicitada },
    );
  }

  crearOrden(body: { producto_id: number; cantidad_solicitada: number; fecha_produccion: string; observaciones?: string }) {
    return this.http.post<ApiResponse<{ orden_id: number }>>(`${this.api}/produccion/ordenes`, body);
  }

  listarOrdenes(page = 1, limit = 10, estado?: string): Observable<PaginatedResponse<OrdenListItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<OrdenListItem>>(`${this.api}/produccion/ordenes`, { params });
  }

  obtenerOrden(id: number) {
    return this.http.get<ApiResponse<OrdenDetalle>>(`${this.api}/produccion/ordenes/${id}`);
  }

  iniciar(id: number) {
    return this.http.patch<ApiResponse<unknown>>(`${this.api}/produccion/ordenes/${id}/iniciar`, {});
  }

  completar(id: number, body: { cantidad_producida: number; cantidad_defectuosa?: number; consumo_real: { insumo_id: number; cantidad_utilizada: number }[]; observaciones_produccion?: string }) {
    return this.http.patch<ApiResponse<unknown>>(`${this.api}/produccion/ordenes/${id}/completar`, body);
  }
}
