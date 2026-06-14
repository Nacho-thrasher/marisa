import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InsumoService } from '../../core/services/insumo.service';
import { VentaService, ReporteMensual } from '../../core/services/venta.service';
import { ProduccionService, OrdenListItem } from '../../core/services/produccion.service';
import { ResumenStock } from '../../core/models/insumo.model';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, DatePipe, RouterLink],
  template: `
    <h2 class="page-title">Hola, {{ user()?.username }} 👋</h2>
    <p class="page-subtitle">Panorama general de la operación.</p>

    <!-- Accesos rápidos -->
    <div class="mb-6 flex flex-wrap gap-2">
      @if (gerente()) {
        <a routerLink="/ventas" class="btn btn-soft"><span class="material-icons text-[18px]">point_of_sale</span> Nueva venta</a>
      }
      @if (esOperacion()) {
        <a routerLink="/pedidos" class="btn btn-outline"><span class="material-icons text-[18px]">edit_note</span> Pedido diario</a>
        <a routerLink="/produccion" class="btn btn-outline"><span class="material-icons text-[18px]">precision_manufacturing</span> Nueva orden</a>
        <a routerLink="/inventario" class="btn btn-outline"><span class="material-icons text-[18px]">inventory_2</span> Inventario</a>
      }
      @if (esComercial()) {
        <a routerLink="/reportes" class="btn btn-outline"><span class="material-icons text-[18px]">bar_chart</span> Reporte mensual</a>
      }
    </div>

    <!-- KPIs -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @if (esOperacion()) {
        <div class="card p-5 transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-sm font-medium text-slate-500">Valor de stock</div>
              <div class="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">\${{ (stock()?.valor_total_stock ?? 0) | number: '1.0-0' }}</div>
              <div class="mt-1.5 text-xs text-slate-400">{{ stock()?.total_insumos ?? 0 }} insumos activos</div>
            </div>
            <div class="icon-chip chip-blue"><span class="material-icons">inventory_2</span></div>
          </div>
        </div>
        <div class="card p-5 transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-sm font-medium text-slate-500">Alertas de stock</div>
              <div class="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{{ (stock()?.insumos_alerta ?? 0) + (stock()?.insumos_criticos ?? 0) }}</div>
              <div class="mt-1.5 text-xs font-medium text-rose-600">{{ stock()?.insumos_criticos ?? 0 }} críticos</div>
            </div>
            <div class="icon-chip chip-amber"><span class="material-icons">warning</span></div>
          </div>
        </div>
        <div class="card p-5 transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-sm font-medium text-slate-500">Órdenes activas</div>
              <div class="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{{ ordenesActivas() }}</div>
              <div class="mt-1.5 text-xs text-slate-400">producción en curso</div>
            </div>
            <div class="icon-chip chip-green"><span class="material-icons">precision_manufacturing</span></div>
          </div>
        </div>
      }
      @if (esComercial()) {
        <div class="card p-5 transition-shadow hover:shadow-md">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-sm font-medium text-slate-500">Ventas (vigentes)</div>
              <div class="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">\${{ (ventas()?.total_vendido ?? 0) | number: '1.0-0' }}</div>
              <div class="mt-1.5 text-xs font-medium text-emerald-600">ganancia \${{ (ventas()?.ganancia_total ?? 0) | number: '1.0-0' }}</div>
            </div>
            <div class="icon-chip chip-violet"><span class="material-icons">payments</span></div>
          </div>
        </div>
      }
    </div>

    <!-- Alertas de stock -->
    @if (esOperacion() && alertas().length) {
      <div class="card mt-6 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-semibold text-slate-900">Alertas de stock</h3>
          <a routerLink="/inventario" class="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">Ver inventario <span class="material-icons text-[16px]">arrow_forward</span></a>
        </div>
        <div class="space-y-2.5">
          @for (a of alertas(); track a.insumo_id) {
            <div
              class="flex items-center justify-between rounded-xl border-l-[3px] px-4 py-3"
              [class]="a.estado === 'CRITICO' ? 'border-rose-500 bg-rose-50/60' : 'border-amber-500 bg-amber-50/60'"
            >
              <div class="flex items-center gap-3">
                <span class="h-2 w-2 rounded-full" [class]="a.estado === 'CRITICO' ? 'bg-rose-500' : 'bg-amber-500'"></span>
                <div>
                  <div class="font-medium text-slate-800">{{ a.nombre }}</div>
                  <div class="text-xs text-slate-500">Stock: {{ a.cantidad | number: '1.0-2' }}</div>
                </div>
              </div>
              <span class="badge" [class]="a.estado === 'CRITICO' ? 'badge-critico' : 'badge-bajo'">
                {{ a.estado === 'CRITICO' ? 'Crítico' : 'Bajo' }}
              </span>
            </div>
          }
        </div>
      </div>
    }

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <!-- Top vendedores del mes -->
      @if (esComercial() && reporte()) {
        <div class="card p-5">
          <h3 class="mb-3 font-semibold text-slate-900">Top vendedores · {{ reporte()!.periodo }}</h3>
          @if (reporte()!.por_vendedor.length) {
            <div class="space-y-2">
              @for (v of reporte()!.por_vendedor.slice(0, 6); track v.vendedor) {
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div class="flex items-center gap-3">
                    <span class="grid h-8 w-8 place-items-center rounded-md bg-brand-100 text-xs font-bold text-brand-700">{{ v.vendedor.charAt(0) }}</span>
                    <div>
                      <div class="text-sm font-medium text-slate-800">{{ v.vendedor }}</div>
                      <div class="text-xs text-slate-400">{{ v.unidades | number: '1.0-0' }} u · {{ v.ventas }} ventas</div>
                    </div>
                  </div>
                  <div class="font-semibold tabular-nums">\${{ v.monto | number: '1.0-0' }}</div>
                </div>
              }
            </div>
          } @else {
            <p class="py-6 text-center text-sm text-slate-400">Sin ventas este mes.</p>
          }
        </div>
      }

      <!-- Órdenes recientes -->
      @if (esOperacion()) {
        <div class="card p-5">
          <h3 class="mb-3 font-semibold text-slate-900">Órdenes de producción recientes</h3>
          @if (ordenes().length) {
            <div class="space-y-2">
              @for (o of ordenes().slice(0, 6); track o.orden_id) {
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <div class="text-sm font-medium text-slate-800">{{ o.producto }}</div>
                    <div class="text-xs text-slate-400">{{ o.numero_orden }} · {{ o.fecha_produccion | date: 'dd/MM' }}</div>
                  </div>
                  <span class="badge" [class]="estadoClase(o.estado)">{{ o.estado }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="py-6 text-center text-sm text-slate-400">Sin órdenes registradas.</p>
          }
        </div>
      }
    </div>

    @if (!esOperacion() && !esComercial()) {
      <div class="card mt-6 p-8 text-center text-slate-500">
        Usá el menú lateral para navegar a tu módulo.
      </div>
    }
  `,
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private insumos = inject(InsumoService);
  private ventasSvc = inject(VentaService);
  private prod = inject(ProduccionService);

  readonly user = this.auth.user;
  readonly stock = signal<ResumenStock | null>(null);
  readonly alertas = signal<ResumenStock['detalles']>([]);
  readonly ventas = signal<{ total_vendido: string; ganancia_total: string } | null>(null);
  readonly ordenes = signal<OrdenListItem[]>([]);
  readonly reporte = signal<ReporteMensual | null>(null);

  esOperacion() {
    return this.auth.hasRole('GERENTE', 'OPERARIO');
  }
  esComercial() {
    return this.auth.hasRole('GERENTE', 'CONTADOR');
  }
  gerente() {
    return this.auth.hasRole('GERENTE');
  }

  ordenesActivas() {
    return this.ordenes().filter((o) => o.estado === 'PLANIFICADA' || o.estado === 'EN_PROCESO').length;
  }

  ngOnInit() {
    if (this.esOperacion()) {
      this.insumos.resumenStock().subscribe((r) => {
        this.stock.set(r.data);
        this.alertas.set(r.data.detalles.filter((d) => d.estado !== 'OK').slice(0, 6));
      });
      this.prod.listarOrdenes(1, 20).subscribe((r) => this.ordenes.set(r.data));
    }
    if (this.esComercial()) {
      this.ventasSvc.resumen().subscribe((r) => this.ventas.set(r.data));
      const now = new Date();
      this.ventasSvc.reporteMensual(now.getMonth() + 1, now.getFullYear()).subscribe((r) => this.reporte.set(r.data));
    }
  }

  estadoClase(estado: string) {
    return {
      PLANIFICADA: 'badge-info',
      EN_PROCESO: 'badge-bajo',
      COMPLETADA: 'badge-ok',
      CANCELADA: 'badge-critico',
    }[estado] ?? 'badge-neutral';
  }
}
