import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';
import { Producto } from './produccion.service';
import { skipErrorToast } from '../interceptors/error.interceptor';

export interface RecetaInsumo {
  insumo_id: number;
  nombre: string;
  cantidad_requerida: string;
  unidad_medida: string;
  porcentaje_merma: string;
  cantidad_con_merma: string;
  costo_unitario: string;
  costo_total: string;
}

export interface Receta {
  receta_id: number;
  codigo: string;
  producto: string;
  version: number;
  vigente: boolean;
  rendimiento_esperado: string;
  unidad: string;
  costo_total_esperado: string;
  insumos: RecetaInsumo[];
}

export interface CrearRecetaBody {
  codigo: string;
  rendimiento_esperado: number;
  unidad_rendimiento: string;
  insumos: {
    insumo_id: number;
    cantidad_requerida: number;
    unidad_medida: string;
    porcentaje_merma?: number;
  }[];
}

export interface ListarProductosQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  activos_solo?: boolean;
}

export interface CrearProductoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  peso_gramos?: number;
  precio_venta?: number;
  precio_mayorista?: number;
  precio_revendedor?: number;
  precio_comercio?: number;
  precio_publico?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/productos`;

  listar(q: ListarProductosQuery = {}): Observable<PaginatedResponse<Producto>> {
    let params = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PaginatedResponse<Producto>>(this.base, { params });
  }

  crear(input: CrearProductoInput) {
    return this.http.post<ApiResponse<unknown>>(this.base, input);
  }

  actualizar(id: number, input: Partial<CrearProductoInput> & { activo?: boolean }) {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/${id}`, input);
  }

  categorias() {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/categorias`);
  }

  /** Obtiene la receta activa. `silent` evita el toast global si no existe (404). */
  obtenerReceta(productoId: number, silent = false) {
    return this.http.get<ApiResponse<Receta>>(`${this.base}/${productoId}/receta`, {
      context: silent ? skipErrorToast() : undefined,
    });
  }

  crearReceta(productoId: number, body: CrearRecetaBody) {
    return this.http.post<ApiResponse<{ receta_id: number }>>(`${this.base}/${productoId}/receta`, body);
  }
}
