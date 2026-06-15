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
        <input class="input" type="date" [(ngModel)]="desde" (ngModelChange)="onFechaManual()" />
      </div>
      <div>
        <label class="label">Hasta</label>
        <input class="input" type="date" [(ngModel)]="hasta" (ngModelChange)="onFechaManual()" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn px-3 py-1.5 text-xs" [class]="rango() === 'hoy' ? 'btn-primary' : 'btn-soft'" (click)="hoy()">Hoy</button>
        <button class="btn px-3 py-1.5 text-xs" [class]="rango() === 'ayer' ? 'btn-primary' : 'btn-soft'" (click)="ayer()">Ayer</button>
        <button class="btn px-3 py-1.5 text-xs" [class]="rango() === 'semana' ? 'btn-primary' : 'btn-soft'" (click)="estaSemana()">Esta semana</button>
        <button class="btn px-3 py-1.5 text-xs" [class]="rango() === 'semanaPasada' ? 'btn-primary' : 'btn-soft'" (click)="semanaPasada()">Semana pasada</button>
        <button class="btn px-3 py-1.5 text-xs" [class]="rango() === 'mes' ? 'btn-primary' : 'btn-soft'" (click)="esteMes()">Este mes</button>
      </div>
    </div>

    @if (rep(); as r) {
      <div class="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="card flex items-center gap-3 p-4">
          <div class="icon-chip chip-brand"><span class="material-icons">point_of_sale</span></div>
          <div>
            <div class="text-xs text-slate-500">Total vendido</div>
            <div class="text-2xl font-bold text-slate-900">\${{ num(r.totales.ventas_total) | number: '1.0-0' }}</div>
            <div class="text-xs text-slate-400">{{ r.totales.ventas_cantidad }} {{ r.totales.ventas_cantidad === 1 ? 'venta' : 'ventas' }}</div>
          </div>
        </div>
        <div class="card flex items-center gap-3 p-4">
          <div class="icon-chip chip-green"><span class="material-icons">trending_up</span></div>
          <div>
            <div class="text-xs text-slate-500">Ganancia bruta</div>
            <div class="text-2xl font-bold text-emerald-600">\${{ num(r.totales.ganancia_bruta) | number: '1.0-0' }}</div>
            <div class="text-xs text-slate-400">ventas − costo de productos</div>
          </div>
        </div>
        <div class="card flex items-center gap-3 p-4">
          <div class="icon-chip chip-rose"><span class="material-icons">shopping_cart</span></div>
          <div>
            <div class="text-xs text-slate-500">Compras de insumos</div>
            <div class="text-2xl font-bold text-rose-600">\${{ num(r.totales.compras_insumos) | number: '1.0-0' }}</div>
            <div class="text-xs text-slate-400">egresos del período</div>
          </div>
        </div>
        <div class="card flex items-center gap-3 p-4">
          <div class="icon-chip chip-amber"><span class="material-icons">precision_manufacturing</span></div>
          <div>
            <div class="text-xs text-slate-500">Costo de producción</div>
            <div class="text-2xl font-bold text-amber-600">\${{ num(r.totales.costo_produccion) | number: '1.0-0' }}</div>
            <div class="text-xs text-slate-400">{{ r.totales.ordenes_completadas }} {{ r.totales.ordenes_completadas === 1 ? 'orden' : 'órdenes' }} · {{ num(r.totales.unidades_producidas) | number: '1.0-0' }} u.</div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <span class="font-semibold text-slate-900">Detalle por día</span>
          <span class="text-xs text-slate-400">{{ formatFecha(r.desde) }} → {{ formatFecha(r.hasta) }} · {{ r.dias.length }} {{ r.dias.length === 1 ? 'día' : 'días' }}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm whitespace-nowrap">
            <thead>
              <!-- Encabezados de grupo -->
              <tr class="text-[10px] font-bold tracking-wider uppercase">
                <th class="bg-slate-50/60 px-4 pt-3 pb-1"></th>
                <th colspan="3" class="border-l border-slate-200/70 bg-brand-50/30 px-4 pt-3 pb-1 text-center text-brand-600">Ventas</th>
                <th class="border-l border-slate-200/70 bg-rose-50/30 px-4 pt-3 pb-1 text-center text-rose-600">Egresos</th>
                <th colspan="3" class="border-l border-slate-200/70 bg-amber-50/30 px-4 pt-3 pb-1 text-center text-amber-600">Producción</th>
              </tr>
              <!-- Encabezados de columna -->
              <tr class="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th class="bg-slate-50/60 px-4 pb-2.5 text-left">Fecha</th>
                <th class="border-l border-slate-200/70 px-4 pb-2.5 text-right">Cant.</th>
                <th class="px-4 pb-2.5 text-right">Total</th>
                <th class="px-4 pb-2.5 text-right">Ganancia</th>
                <th class="border-l border-slate-200/70 px-4 pb-2.5 text-right">Compras</th>
                <th class="border-l border-slate-200/70 px-4 pb-2.5 text-right">Costo</th>
                <th class="px-4 pb-2.5 text-right">Órdenes</th>
                <th class="px-4 pb-2.5 text-right">Unidades</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (d of r.dias; track d.fecha) {
                <tr class="transition-colors hover:bg-slate-50/70" [class.opacity-40]="sinActividad(d)">
                  <td class="px-4 py-2.5 font-medium text-slate-800">
                    {{ formatFecha(d.fecha) }} <span class="ml-1 capitalize text-slate-400">{{ diaSemana(d.fecha) }}</span>
                  </td>
                  <td class="border-l border-slate-100 px-4 py-2.5 text-right text-slate-600 tabular-nums">{{ d.ventas_cantidad || '—' }}</td>
                  <td class="px-4 py-2.5 text-right tabular-nums">{{ num(d.ventas_total) ? '$' + (num(d.ventas_total) | number: '1.0-2') : '—' }}</td>
                  <td class="px-4 py-2.5 text-right tabular-nums" [class.text-emerald-600]="num(d.ganancia_bruta)">{{ num(d.ganancia_bruta) ? '$' + (num(d.ganancia_bruta) | number: '1.0-2') : '—' }}</td>
                  <td class="border-l border-slate-100 px-4 py-2.5 text-right tabular-nums" [class.text-rose-600]="num(d.compras_insumos)">{{ num(d.compras_insumos) ? '$' + (num(d.compras_insumos) | number: '1.0-2') : '—' }}</td>
                  <td class="border-l border-slate-100 px-4 py-2.5 text-right tabular-nums" [class.text-amber-600]="num(d.costo_produccion)">{{ num(d.costo_produccion) ? '$' + (num(d.costo_produccion) | number: '1.0-2') : '—' }}</td>
                  <td class="px-4 py-2.5 text-right text-slate-600 tabular-nums">{{ d.ordenes_completadas || '—' }}</td>
                  <td class="px-4 py-2.5 text-right text-slate-600 tabular-nums">{{ num(d.unidades_producidas) ? (num(d.unidades_producidas) | number: '1.0-2') : '—' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td class="px-4 py-3">Total</td>
                <td class="border-l border-slate-200/70 px-4 py-3 text-right tabular-nums">{{ r.totales.ventas_cantidad }}</td>
                <td class="px-4 py-3 text-right tabular-nums">\${{ num(r.totales.ventas_total) | number: '1.0-2' }}</td>
                <td class="px-4 py-3 text-right text-emerald-600 tabular-nums">\${{ num(r.totales.ganancia_bruta) | number: '1.0-2' }}</td>
                <td class="border-l border-slate-200/70 px-4 py-3 text-right text-rose-600 tabular-nums">\${{ num(r.totales.compras_insumos) | number: '1.0-2' }}</td>
                <td class="border-l border-slate-200/70 px-4 py-3 text-right text-amber-600 tabular-nums">\${{ num(r.totales.costo_produccion) | number: '1.0-2' }}</td>
                <td class="px-4 py-3 text-right tabular-nums">{{ r.totales.ordenes_completadas }}</td>
                <td class="px-4 py-3 text-right tabular-nums">{{ num(r.totales.unidades_producidas) | number: '1.0-2' }}</td>
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
  readonly rango = signal<'hoy' | 'ayer' | 'semana' | 'semanaPasada' | 'mes' | ''>('hoy');

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

  /** Cuando el usuario edita las fechas a mano, se deselecciona el botón de rango rápido. */
  onFechaManual() {
    this.rango.set('');
    this.cargar();
  }

  hoy() {
    const t = new Date();
    this.desde = this.hasta = this.toISO(t);
    this.rango.set('hoy');
    this.cargar();
  }

  ayer() {
    const t = new Date();
    t.setDate(t.getDate() - 1);
    this.desde = this.hasta = this.toISO(t);
    this.rango.set('ayer');
    this.cargar();
  }

  estaSemana() {
    const t = new Date();
    const lunes = new Date(t);
    lunes.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    this.desde = this.toISO(lunes);
    this.hasta = this.toISO(t);
    this.rango.set('semana');
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
    this.rango.set('semanaPasada');
    this.cargar();
  }

  esteMes() {
    const t = new Date();
    this.desde = this.toISO(new Date(t.getFullYear(), t.getMonth(), 1));
    this.hasta = this.toISO(t);
    this.rango.set('mes');
    this.cargar();
  }

  sinActividad(d: ReportePeriodo['dias'][number]) {
    return (
      !d.ventas_cantidad &&
      !this.num(d.compras_insumos) &&
      !this.num(d.costo_produccion)
    );
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
