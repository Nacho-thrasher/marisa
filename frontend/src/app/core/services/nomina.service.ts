import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models/api.model';

export interface EmpleadoListItem {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  puesto: string;
  departamento: string | null;
  fecha_ingreso: string;
  antiguedad_anos: number;
  estado: string;
  email: string | null;
  estructura_salarial_actual: { sueldo_basico: string; tarifa_horaria: string | null; bono_fijo: string } | null;
}

export interface Aporte {
  id: number;
  nombre: string;
  tipo: string;
  porcentaje: string;
  vigente_desde: string;
  activo: boolean;
}

export interface NominaListItem {
  nomina_id: number;
  numero_nomina: string;
  periodo: string;
  estado: string;
  cantidad_empleados: number;
  total_neto: string;
  fecha_procesamiento: string | null;
}

export interface Recibo {
  recibo_id: number;
  numero_recibo: string;
  empleado: string;
  periodo: string;
  sueldo_basico: string;
  bono_fijo: string;
  antiguedad_monto: string;
  total_haberes: string;
  total_descuentos: string;
  neto_a_pagar: string;
  aporte_patronal: string;
  costo_total_empleado: string;
}

@Injectable({ providedIn: 'root' })
export class NominaService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  empleados(page = 1, limit = 10, buscar?: string): Observable<PaginatedResponse<EmpleadoListItem>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (buscar) params = params.set('buscar', buscar);
    return this.http.get<PaginatedResponse<EmpleadoListItem>>(`${this.api}/empleados`, { params });
  }

  crearEmpleado(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/empleados`, body);
  }

  configurarEstructura(id: number, body: Record<string, unknown>) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/empleados/${id}/estructura-salarial`, body);
  }

  aportes() {
    return this.http.get<ApiResponse<Aporte[]>>(`${this.api}/aportes-configuracion`);
  }

  actualizarAporte(id: number, porcentaje: number) {
    return this.http.patch<ApiResponse<unknown>>(`${this.api}/aportes-configuracion/${id}`, { porcentaje });
  }

  listarNominas(page = 1, limit = 10): Observable<PaginatedResponse<NominaListItem>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<NominaListItem>>(`${this.api}/nomina`, { params });
  }

  procesar(mes: number, ano: number) {
    return this.http.post<ApiResponse<{ nomina_id: number }>>(`${this.api}/nomina/procesar`, { mes, ano });
  }

  recibos(nominaId: number) {
    return this.http.get<ApiResponse<Recibo[]>>(`${this.api}/nomina/${nominaId}/recibos`);
  }
}
