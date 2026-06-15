import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';

export interface VendedorItem {
  id: number;
  nombre: string;
  zona: string | null;
  telefono: string | null;
  activo: boolean;
  clientes: number;
}

export interface CrearVendedor {
  nombre: string;
  zona?: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class VendedoresService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  listar(activosSolo = false): Observable<ApiResponse<VendedorItem[]>> {
    const params = new HttpParams().set('activos_solo', String(activosSolo));
    return this.http.get<ApiResponse<VendedorItem[]>>(`${this.api}/vendedores`, { params });
  }

  crear(body: CrearVendedor) {
    return this.http.post<ApiResponse<unknown>>(`${this.api}/vendedores`, body);
  }

  actualizar(id: number, body: Partial<CrearVendedor> & { activo?: boolean }) {
    return this.http.patch<ApiResponse<unknown>>(`${this.api}/vendedores/${id}`, body);
  }
}
