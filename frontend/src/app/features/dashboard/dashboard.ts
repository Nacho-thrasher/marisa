import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InsumoService } from '../../core/services/insumo.service';
import { ResumenStock } from '../../core/models/insumo.model';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink],
  template: `
    <h2 class="page-title">Hola, {{ user()?.username }} 👋</h2>
    <p class="page-subtitle">Este es el panorama general de tu operación.</p>

    @if (loading()) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="card h-28 animate-pulse bg-slate-50"></div>
        }
      </div>
    } @else if (resumen(); as r) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-5">
          <div class="flex items-center justify-between">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <span class="material-icons">inventory_2</span>
            </span>
          </div>
          <div class="mt-4 text-3xl font-bold text-slate-900">{{ r.total_insumos }}</div>
          <div class="text-sm text-slate-500">Insumos activos</div>
        </div>

        <div class="card p-5">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <span class="material-icons">payments</span>
          </span>
          <div class="mt-4 text-3xl font-bold text-slate-900">\${{ r.valor_total_stock | number: '1.0-0' }}</div>
          <div class="text-sm text-slate-500">Valor del stock</div>
        </div>

        <div class="card p-5">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <span class="material-icons">warning</span>
          </span>
          <div class="mt-4 text-3xl font-bold text-slate-900">{{ r.insumos_alerta }}</div>
          <div class="text-sm text-slate-500">Stock bajo</div>
        </div>

        <div class="card p-5">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-700">
            <span class="material-icons">error</span>
          </span>
          <div class="mt-4 text-3xl font-bold text-slate-900">{{ r.insumos_criticos }}</div>
          <div class="text-sm text-slate-500">Stock crítico</div>
        </div>
      </div>

      <!-- Insumos con alerta -->
      @if (alertas().length) {
        <div class="card mt-6 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4">
            <h3 class="font-semibold text-slate-900">Insumos que requieren atención</h3>
            <a routerLink="/inventario" class="btn btn-soft">Ver inventario</a>
          </div>
          <table class="table">
            <thead>
              <tr><th>Insumo</th><th>Cantidad</th><th>Valor</th><th>Estado</th></tr>
            </thead>
            <tbody>
              @for (d of alertas(); track d.insumo_id) {
                <tr>
                  <td class="font-medium text-slate-800">{{ d.nombre }}</td>
                  <td>{{ d.cantidad | number: '1.0-2' }}</td>
                  <td>\${{ d.valor | number: '1.0-0' }}</td>
                  <td><span class="badge badge-{{ d.estado === 'CRITICO' ? 'critico' : 'bajo' }}">{{ d.estado }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="card p-8 text-center text-slate-500">
        Bienvenido al sistema. Usá el menú lateral para navegar a tu módulo.
      </div>
    }
  `,
})
export class Dashboard implements OnInit {
  private insumos = inject(InsumoService);
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly resumen = signal<ResumenStock | null>(null);
  readonly loading = signal(true);
  readonly alertas = signal<ResumenStock['detalles']>([]);

  ngOnInit() {
    if (this.auth.hasRole('GERENTE', 'OPERARIO')) {
      this.insumos.resumenStock().subscribe({
        next: (res) => {
          this.resumen.set(res.data);
          this.alertas.set(res.data.detalles.filter((d) => d.estado !== 'OK').slice(0, 8));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }
}
