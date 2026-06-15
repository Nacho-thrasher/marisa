import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

export interface VentaListItem {
  venta_id: number;
  numero_comprobante: string;
  cliente: string | null;
  fecha: string;
  total: string;
  productos_cantidad: number;
  medio_pago: string | null;
  estado: 'VIGENTE' | 'ANULADA';
}

export interface VentaDetalle {
  venta_id: number;
  numero_comprobante: string;
  cliente: string | null;
  cuit: string | null;
  fecha: string;
  estado: string;
  detalles: { producto: string; cantidad: string; precio_unitario: string; subtotal: string; ganancia_unitaria: string }[];
  total_bruto: string;
  descuento: string;
  total_neto: string;
  medio_pago: string | null;
  registrado_por: string;
  anulada: boolean;
  motivo_anulacion: string | null;
}

export interface CrearVentaBody {
  cliente_nombre?: string;
  cliente_cuit?: string;
  cliente_id?: number;
  vendedor_id?: number;
  lista_precio?: 'MAYORISTA' | 'REVENDEDOR' | 'COMERCIO' | 'PUBLICO';
  medio_pago?: string;
  descuento_porcentaje?: number;
  observaciones?: string;
  detalles: { producto_id: number; cantidad: number; precio_unitario: number }[];
}

export interface ReporteMensual {
  periodo: string;
  total_monto: string;
  por_vendedor: { vendedor: string; ventas: number; unidades: string; monto: string }[];
  vendedores: string[];
  matriz: { producto: string; por_vendedor: Record<string, string>; total: string }[];
}

export interface ReportePeriodoDia {
  fecha: string;
  ventas_cantidad: number;
  ventas_total: string;
  ganancia_bruta: string;
  compras_insumos: string;
  costo_produccion: string;
  ordenes_completadas: number;
  unidades_producidas: string;
}

export interface ReportePeriodo {
  desde: string;
  hasta: string;
  dias: ReportePeriodoDia[];
  totales: Omit<ReportePeriodoDia, 'fecha'>;
}

@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(page = 1, limit = 10, cliente?: string): Observable<PaginatedResponse<VentaListItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (cliente) params = params.set('cliente', cliente);
    return this.http.get<PaginatedResponse<VentaListItem>>(`${this.api}/ventas`, { params });
  }

  obtener(id: number) {
    return this.http.get<ApiResponse<VentaDetalle>>(`${this.api}/ventas/${id}`);
  }

  crear(body: CrearVentaBody) {
    return this.http.post<ApiResponse<{ venta_id: number; numero_comprobante: string }>>(`${this.api}/ventas`, body);
  }

  anular(id: number, motivo_anulacion: string) {
    return this.http.delete<ApiResponse<unknown>>(`${this.api}/ventas/${id}`, { body: { motivo_anulacion } });
  }

  resumen() {
    return this.http.get<ApiResponse<{ cantidad_ventas: number; total_vendido: string; ganancia_total: string }>>(`${this.api}/ventas/resumen`);
  }

  reporteMensual(mes: number, ano: number) {
    const params = new HttpParams().set('mes', mes).set('ano', ano);
    return this.http.get<ApiResponse<ReporteMensual>>(`${this.api}/ventas/reporte-mensual`, { params });
  }

  reportePeriodo(desde: string, hasta: string) {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<ApiResponse<ReportePeriodo>>(`${this.api}/ventas/reporte-periodo`, { params });
  }
}
