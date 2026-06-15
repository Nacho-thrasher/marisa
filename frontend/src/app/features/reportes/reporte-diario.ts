import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService, ReportePeriodo } from '../../core/services/venta.service';
import { DescargasService } from '../../core/services/descargas.service';

@Component({
  selector: 'app-reporte-diario',
  imports: [DecimalPipe, FormsModule],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Reporte diario / semanal</h2>
        <p class="text-sm text-slate-500">Ventas, compras de insumos y costo de producción, día por día.</p>
      </div>
      <button class="btn btn-outline" (click)="exportar()">
        <span class="material-icons text-[20px]">download</span> Excel
      </button>
    </div>

    <div class="card mb-4 flex flex-wrap items-end gap-3 p-3">
      <div>
        <label class="label">Desde</label>
        <input class="input" type="date" [(ngModel)]="desde" (ngModelChange)="cargar()" />
      </div>
      <div>
        <label class="label">Hasta</label>
        <input class="input" type="date" [(ngModel)]="hasta" (ngModelChange)="cargar()" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="hoy()">Hoy</button>
        <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="ayer()">Ayer</button>
        <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="estaSemana()">Esta semana</button>
        <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="semanaPasada()">Semana pasada</button>
        <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="esteMes()">Este mes</button>
      </div>
    </div>

    @if (rep(); as r) {
      <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card p-4">
          <div class="text-sm text-slate-500">Ventas ({{ r.totales.ventas_cantidad }})</div>
          <div class="text-2xl font-bold">\${{ num(r.totales.ventas_total) | number: '1.0-0' }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-slate-500">Ganancia bruta</div>
          <div class="text-2xl font-bold text-emerald-600">\${{ num(r.totales.ganancia_bruta) | number: '1.0-0' }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-slate-500">Egresos: compras de insumos</div>
          <div class="text-2xl font-bold text-rose-600">\${{ num(r.totales.compras_insumos) | number: '1.0-0' }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-slate-500">Costo de producción</div>
          <div class="text-2xl font-bold text-amber-600">\${{ num(r.totales.costo_produccion) | number: '1.0-0' }}</div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">Detalle por día</div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th class="text-right">Ventas</th>
                <th class="text-right">Total ventas</th>
                <th class="text-right">Ganancia bruta</th>
                <th class="text-right">Compras insumos</th>
                <th class="text-right">Costo producción</th>
                <th class="text-right">Órdenes completadas</th>
                <th class="text-right">Unidades producidas</th>
              </tr>
            </thead>
            <tbody>
              @for (d of r.dias; track d.fecha) {
                <tr>
                  <td class="font-medium text-slate-800">{{ formatFecha(d.fecha) }} · <span class="capitalize text-slate-400">{{ diaSemana(d.fecha) }}</span></td>
                  <td class="text-right tabular-nums">{{ d.ventas_cantidad }}</td>
                  <td class="text-right tabular-nums">\${{ num(d.ventas_total) | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums text-emerald-600">\${{ num(d.ganancia_bruta) | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums text-rose-600">\${{ num(d.compras_insumos) | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums text-amber-600">\${{ num(d.costo_produccion) | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums">{{ d.ordenes_completadas }}</td>
                  <td class="text-right tabular-nums">{{ num(d.unidades_producidas) | number: '1.0-2' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="font-semibold">
                <td>Total</td>
                <td class="text-right tabular-nums">{{ r.totales.ventas_cantidad }}</td>
                <td class="text-right tabular-nums">\${{ num(r.totales.ventas_total) | number: '1.0-2' }}</td>
                <td class="text-right tabular-nums text-emerald-600">\${{ num(r.totales.ganancia_bruta) | number: '1.0-2' }}</td>
                <td class="text-right tabular-nums text-rose-600">\${{ num(r.totales.compras_insumos) | number: '1.0-2' }}</td>
                <td class="text-right tabular-nums text-amber-600">\${{ num(r.totales.costo_produccion) | number: '1.0-2' }}</td>
                <td class="text-right tabular-nums">{{ r.totales.ordenes_completadas }}</td>
                <td class="text-right tabular-nums">{{ num(r.totales.unidades_producidas) | number: '1.0-2' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    }
  `,
})
export class ReporteDiario implements OnInit {
  private service = inject(VentaService);
  private descargas = inject(DescargasService);

  readonly rep = signal<ReportePeriodo | null>(null);
  readonly loading = signal(false);

  desde = this.toISO(new Date());
  hasta = this.toISO(new Date());

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    if (!this.desde || !this.hasta || this.desde > this.hasta) return;
    this.loading.set(true);
    this.service.reportePeriodo(this.desde, this.hasta).subscribe({
      next: (res) => {
        this.rep.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  hoy() {
    const t = new Date();
    this.desde = this.hasta = this.toISO(t);
    this.cargar();
  }

  ayer() {
    const t = new Date();
    t.setDate(t.getDate() - 1);
    this.desde = this.hasta = this.toISO(t);
    this.cargar();
  }

  estaSemana() {
    const t = new Date();
    const lunes = new Date(t);
    lunes.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    this.desde = this.toISO(lunes);
    this.hasta = this.toISO(t);
    this.cargar();
  }

  semanaPasada() {
    const t = new Date();
    const lunes = new Date(t);
    lunes.setDate(t.getDate() - ((t.getDay() + 6) % 7) - 7);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    this.desde = this.toISO(lunes);
    this.hasta = this.toISO(domingo);
    this.cargar();
  }

  esteMes() {
    const t = new Date();
    this.desde = this.toISO(new Date(t.getFullYear(), t.getMonth(), 1));
    this.hasta = this.toISO(t);
    this.cargar();
  }

  exportar() {
    this.descargas.descargar(
      `/ventas/reporte-periodo/excel?desde=${this.desde}&hasta=${this.hasta}`,
      `reporte-diario-${this.desde}-a-${this.hasta}.xlsx`,
    );
  }

  num(v: string) {
    return Number(v);
  }

  formatFecha(f: string) {
    const [y, m, d] = f.split('-');
    return `${d}/${m}/${y}`;
  }

  diaSemana(f: string) {
    return new Date(`${f}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'short' });
  }

  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
