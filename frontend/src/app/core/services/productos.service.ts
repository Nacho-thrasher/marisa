import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
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

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/productos`;

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
