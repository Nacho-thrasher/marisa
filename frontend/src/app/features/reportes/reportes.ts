import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService, ReporteMensual } from '../../core/services/venta.service';
import { DescargasService } from '../../core/services/descargas.service';

@Component({
  selector: 'app-reportes',
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Reporte mensual de ventas</h2>
        <p class="text-sm text-slate-500">Cuánto vende cada vendedor y el detalle por producto.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <select class="select w-40" [(ngModel)]="mes" (ngModelChange)="cargar()">
          @for (m of meses; track m.v) { <option [ngValue]="m.v">{{ m.n }}</option> }
        </select>
        <input class="input w-28" type="number" [(ngModel)]="anio" (ngModelChange)="cargar()" />
        <button class="btn btn-outline" (click)="exportar()">
          <span class="material-icons text-[20px]">download</span> Excel
        </button>
      </div>
    </div>

    @if (rep(); as r) {
      <div class="mb-4 grid gap-4 sm:grid-cols-3">
        <div class="card p-4"><div class="text-sm text-slate-500">Período</div><div class="text-2xl font-bold">{{ r.periodo }}</div></div>
        <div class="card p-4"><div class="text-sm text-slate-500">Total facturado</div><div class="text-2xl font-bold">\${{ r.total_monto | number: '1.0-0' }}</div></div>
        <div class="card p-4"><div class="text-sm text-slate-500">Vendedores activos</div><div class="text-2xl font-bold">{{ r.por_vendedor.length }}</div></div>
      </div>

      <!-- Ranking por vendedor -->
      <div class="card mb-6 overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">Ventas por vendedor</div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead><tr><th>Vendedor</th><th class="text-right">Ventas</th><th class="text-right">Unidades</th><th class="text-right">Monto</th></tr></thead>
            <tbody>
              @for (v of r.por_vendedor; track v.vendedor) {
                <tr>
                  <td class="font-medium text-slate-800">{{ v.vendedor }}</td>
                  <td class="text-right">{{ v.ventas }}</td>
                  <td class="text-right tabular-nums">{{ v.unidades | number: '1.0-0' }}</td>
                  <td class="text-right font-semibold tabular-nums">\${{ v.monto | number: '1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (r.por_vendedor.length === 0) {
          <p class="p-10 text-center text-slate-400">Sin ventas en este período.</p>
        }
      </div>

      <!-- Matriz producto × vendedor (planilla MENSUAL) -->
      @if (r.matriz.length) {
        <div class="card overflow-hidden">
          <div class="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">Unidades por producto y vendedor</div>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th class="sticky left-0 bg-slate-50">Producto</th>
                  @for (vd of r.vendedores; track vd) { <th class="text-right">{{ vd }}</th> }
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of r.matriz; track fila.producto) {
                  <tr>
                    <td class="sticky left-0 bg-white font-medium text-slate-800">{{ fila.producto }}</td>
                    @for (vd of r.vendedores; track vd) {
                      <td class="text-right tabular-nums" [class.text-slate-300]="num(fila.por_vendedor[vd]) === 0">
                        {{ fila.por_vendedor[vd] | number: '1.0-0' }}
                      </td>
                    }
                    <td class="text-right font-semibold tabular-nums">{{ fila.total | number: '1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }
  `,
})
export class Reportes implements OnInit {
  private service = inject(VentaService);
  private descargas = inject(DescargasService);

  readonly rep = signal<ReporteMensual | null>(null);
  readonly meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' }, { v: 4, n: 'Abril' },
    { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' }, { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' },
    { v: 9, n: 'Septiembre' }, { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' },
  ];
  mes = new Date().getMonth() + 1;
  anio = new Date().getFullYear();

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.service.reporteMensual(this.mes, this.anio).subscribe((r) => this.rep.set(r.data));
  }

  exportar() {
    this.descargas.descargar(
      `/ventas/reporte-mensual/excel?mes=${this.mes}&ano=${this.anio}`,
      `reporte-mensual-${this.mes}-${this.anio}.xlsx`,
    );
  }

  num(v: string) {
    return Number(v);
  }
}
