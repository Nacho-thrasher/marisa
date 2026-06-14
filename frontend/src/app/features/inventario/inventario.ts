import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InsumoService } from '../../core/services/insumo.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { InsumoListItem } from '../../core/models/insumo.model';
import { MovimientoDialog } from './movimiento-dialog';
import { InsumoFormDialog } from './insumo-form-dialog';
import { Paginator } from '../../shared/ui/paginator';

@Component({
  selector: 'app-inventario',
  imports: [DecimalPipe, ReactiveFormsModule, MovimientoDialog, InsumoFormDialog, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Inventario de insumos</h2>
        <p class="text-sm text-slate-500">Materia prima, envases y servicios.</p>
      </div>
      @if (puedeMover()) {
        <button class="btn btn-primary" (click)="mostrarNuevo.set(true)">
          <span class="material-icons text-[20px]">add</span> Nuevo insumo
        </button>
      }
    </div>

    <!-- Filtros -->
    <div class="card mb-4 flex flex-wrap items-center gap-3 p-3">
      <div class="search min-w-64 flex-1">
        <span class="material-icons">search</span>
        <input class="input" [formControl]="searchCtrl" placeholder="Buscar por nombre o código…" />
      </div>
      <select class="select w-48" [formControl]="categoriaCtrl">
        <option value="">Todas las categorías</option>
        @for (c of categorias(); track c) {
          <option [value]="c">{{ c }}</option>
        }
      </select>
      <button
        class="btn"
        [class.btn-primary]="soloStockBajo()"
        [class.btn-outline]="!soloStockBajo()"
        (click)="toggleStockBajo()"
      >
        <span class="material-icons text-[20px]">warning</span>
        {{ soloStockBajo() ? 'Mostrando alertas' : 'Solo stock bajo' }}
      </button>
      @if (puedeEditar()) {
        <button
          class="btn"
          [class.btn-primary]="mostrarInactivos()"
          [class.btn-outline]="!mostrarInactivos()"
          (click)="toggleInactivos()"
        >
          <span class="material-icons text-[20px]">visibility_off</span>
          {{ mostrarInactivos() ? 'Mostrando inactivos' : 'Mostrar inactivos' }}
        </button>
      }
    </div>

    <!-- Tabla -->
    <div class="card overflow-hidden">
      @if (loading()) {
        <div class="h-1 w-full overflow-hidden bg-brand-100">
          <div class="h-full w-1/3 animate-[loading_1s_infinite] bg-brand-500"></div>
        </div>
      }
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Código</th><th>Nombre</th><th>Categoría</th><th>Stock</th>
              <th>Estado</th><th class="text-right">Costo unit.</th>
              @if (puedeMover() || puedeEditar()) { <th class="text-right">Acciones</th> }
            </tr>
          </thead>
          <tbody>
            @for (i of insumos(); track i.id) {
              <tr [class.opacity-50]="!i.activo">
                <td class="font-mono text-xs text-slate-500">{{ i.codigo }}</td>
                <td class="font-medium text-slate-800">
                  {{ i.nombre }}
                  @if (!i.activo) {
                    <span class="badge badge-neutral ml-2 text-[10px]">Inactivo</span>
                  }
                </td>
                <td><span class="badge badge-neutral">{{ i.categoria }}</span></td>
                <td>{{ i.stock_actual | number: '1.0-2' }} {{ i.unidad_medida }}</td>
                <td><span class="badge badge-{{ i.estado_stock.toLowerCase() }}">{{ i.estado_stock }}</span></td>
                <td class="text-right tabular-nums">\${{ i.costo_actual | number: '1.2-2' }}</td>
                @if (puedeMover() || puedeEditar()) {
                  <td>
                    <div class="flex justify-end gap-1">
                      @if (puedeMover() && i.activo) {
                        <button class="btn-icon rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Ingreso" (click)="abrir(i, 'ingreso')">
                          <span class="material-icons text-[20px]">add</span>
                        </button>
                        <button class="btn-icon rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                          title="Egreso" (click)="abrir(i, 'egreso')">
                          <span class="material-icons text-[20px]">remove</span>
                        </button>
                      }
                      @if (puedeEditar()) {
                        <button class="btn-icon rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                          title="Editar" (click)="editando.set(i)">
                          <span class="material-icons text-[20px]">edit</span>
                        </button>
                        @if (i.activo) {
                          <button class="btn-icon rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                            title="Desactivar" (click)="toggleActivo(i)">
                            <span class="material-icons text-[20px]">block</span>
                          </button>
                        } @else {
                          <button class="btn-icon rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            title="Activar" (click)="toggleActivo(i)">
                            <span class="material-icons text-[20px]">check_circle</span>
                          </button>
                        }
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (!loading() && insumos().length === 0) {
        <div class="p-12 text-center text-slate-400">
          <span class="material-icons mb-2 text-4xl">inventory_2</span>
          <p>No se encontraron insumos.</p>
        </div>
      }

      <app-paginator [page]="page()" [limit]="limit()" [total]="total()" (pageChange)="onPage($event)" />
    </div>

    @if (movimiento(); as m) {
      <app-movimiento-dialog
        [insumo]="m.insumo"
        [tipo]="m.tipo"
        (saved)="onSaved()"
        (closed)="movimiento.set(null)"
      />
    }
    @if (mostrarNuevo() || editando()) {
      <app-insumo-form-dialog [insumo]="editando()" (saved)="onSaved()" (closed)="cerrarForm()" />
    }
  `,
  styles: `
    @keyframes loading { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }
  `,
})
export class Inventario implements OnInit {
  private service = inject(InsumoService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly insumos = signal<InsumoListItem[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly soloStockBajo = signal(false);
  readonly mostrarInactivos = signal(false);

  readonly movimiento = signal<{ insumo: InsumoListItem; tipo: 'ingreso' | 'egreso' } | null>(null);
  readonly mostrarNuevo = signal(false);
  readonly editando = signal<InsumoListItem | null>(null);

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly categoriaCtrl = new FormControl('', { nonNullable: true });

  readonly puedeMover = computed(() => this.auth.hasRole('GERENTE', 'OPERARIO'));
  readonly puedeEditar = computed(() => this.auth.hasRole('GERENTE'));

  ngOnInit() {
    this.cargar();
    this.service.categorias().subscribe((res) => this.categorias.set(res.data));

    this.searchCtrl.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.page.set(1);
      this.cargar();
    });
    this.categoriaCtrl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.cargar();
    });
  }

  cargar() {
    this.loading.set(true);
    this.service
      .listar({
        page: this.page(),
        limit: this.limit(),
        search: this.searchCtrl.value || undefined,
        categoria: this.categoriaCtrl.value || undefined,
        stock_bajo: this.soloStockBajo() || undefined,
        activos_solo: this.mostrarInactivos() ? false : undefined,
      })
      .subscribe({
        next: (res) => {
          this.insumos.set(res.data);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(p: number) {
    this.page.set(p);
    this.cargar();
  }

  toggleStockBajo() {
    this.soloStockBajo.update((v) => !v);
    this.page.set(1);
    this.cargar();
  }

  toggleInactivos() {
    this.mostrarInactivos.update((v) => !v);
    this.page.set(1);
    this.cargar();
  }

  abrir(insumo: InsumoListItem, tipo: 'ingreso' | 'egreso') {
    this.movimiento.set({ insumo, tipo });
  }

  async toggleActivo(i: InsumoListItem) {
    const activar = !i.activo;
    const ok = await this.confirm.confirm({
      title: activar ? `Activar ${i.nombre}` : `Desactivar ${i.nombre}`,
      message: activar
        ? 'El insumo volverá a aparecer en los listados y se podrán registrar ingresos/egresos.'
        : 'El insumo dejará de aparecer en el inventario y no se podrán registrar ingresos/egresos. Las recetas existentes no se modifican.',
      tone: activar ? 'primary' : 'danger',
      icon: activar ? 'check_circle' : 'block',
      confirmText: activar ? 'Activar' : 'Desactivar',
    });
    if (!ok) return;

    this.service.actualizar(i.id, { activo: activar }).subscribe(() => {
      this.toast.success(activar ? 'Insumo activado' : 'Insumo desactivado');
      this.cargar();
    });
  }

  cerrarForm() {
    this.mostrarNuevo.set(false);
    this.editando.set(null);
  }

  onSaved() {
    this.movimiento.set(null);
    this.cerrarForm();
    this.cargar();
  }
}
