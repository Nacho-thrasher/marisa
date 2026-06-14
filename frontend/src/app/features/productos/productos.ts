import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ProductosService } from '../../core/services/productos.service';
import { Producto } from '../../core/services/produccion.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { ProductoFormDialog } from './producto-form-dialog';
import { ProductoRecetaDialog } from './producto-receta-dialog';
import { Paginator } from '../../shared/ui/paginator';

@Component({
  selector: 'app-productos',
  imports: [DecimalPipe, ReactiveFormsModule, ProductoFormDialog, ProductoRecetaDialog, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Productos</h2>
        <p class="text-sm text-slate-500">Catálogo de productos para Pedido diario y Producción.</p>
      </div>
      @if (puedeEditar()) {
        <button class="btn btn-primary" (click)="mostrarNuevo.set(true)">
          <span class="material-icons text-[20px]">add</span> Nuevo producto
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
              <th>Código</th><th>Nombre</th><th>Categoría</th><th>Peso</th>
              <th class="text-right">Costo prom.</th><th class="text-right">Precio público</th>
              @if (puedeEditar()) { <th class="text-right">Acciones</th> }
            </tr>
          </thead>
          <tbody>
            @for (p of productos(); track p.id) {
              <tr [class.opacity-50]="!p.activo">
                <td class="font-mono text-xs text-slate-500">{{ p.codigo }}</td>
                <td class="font-medium text-slate-800">
                  {{ p.nombre }}
                  @if (!p.activo) {
                    <span class="badge badge-neutral ml-2 text-[10px]">Inactivo</span>
                  }
                </td>
                <td><span class="badge badge-neutral">{{ p.categoria }}</span></td>
                <td>{{ p.pesoGramos ? (p.pesoGramos + ' g') : '—' }}</td>
                <td class="text-right tabular-nums">{{ p.costoPromedio ? '$' + (p.costoPromedio | number: '1.2-2') : '—' }}</td>
                <td class="text-right tabular-nums">{{ p.precioPublico ? '$' + (p.precioPublico | number: '1.2-2') : '—' }}</td>
                @if (puedeEditar()) {
                  <td>
                    <div class="flex justify-end gap-1">
                      <button class="btn-icon rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                        title="Editar" (click)="editando.set(p)">
                        <span class="material-icons text-[20px]">edit</span>
                      </button>
                      <button class="btn-icon rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                        title="Receta" (click)="receta.set(p)">
                        <span class="material-icons text-[20px]">receipt_long</span>
                      </button>
                      @if (p.activo) {
                        <button class="btn-icon rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Desactivar" (click)="toggleActivo(p)">
                          <span class="material-icons text-[20px]">block</span>
                        </button>
                      } @else {
                        <button class="btn-icon rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Activar" (click)="toggleActivo(p)">
                          <span class="material-icons text-[20px]">check_circle</span>
                        </button>
                      }
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (!loading() && productos().length === 0) {
        <div class="p-12 text-center text-slate-400">
          <span class="material-icons mb-2 text-4xl">inventory_2</span>
          <p>No se encontraron productos.</p>
        </div>
      }

      <app-paginator [page]="page()" [limit]="limit()" [total]="total()" (pageChange)="onPage($event)" />
    </div>

    @if (mostrarNuevo() || editando()) {
      <app-producto-form-dialog [producto]="editando()" (saved)="onSaved()" (closed)="cerrarForm()" />
    }
    @if (receta(); as p) {
      <app-producto-receta-dialog [producto]="p" (saved)="onRecetaGuardada()" (closed)="receta.set(null)" />
    }
  `,
  styles: `
    @keyframes loading { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }
  `,
})
export class Productos implements OnInit {
  private service = inject(ProductosService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly productos = signal<Producto[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(10);
  readonly mostrarInactivos = signal(false);

  readonly mostrarNuevo = signal(false);
  readonly editando = signal<Producto | null>(null);
  readonly receta = signal<Producto | null>(null);

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly categoriaCtrl = new FormControl('', { nonNullable: true });

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
        activos_solo: this.mostrarInactivos() ? false : undefined,
      })
      .subscribe({
        next: (res) => {
          this.productos.set(res.data);
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

  toggleInactivos() {
    this.mostrarInactivos.update((v) => !v);
    this.page.set(1);
    this.cargar();
  }

  async toggleActivo(p: Producto) {
    const activar = !p.activo;
    const ok = await this.confirm.confirm({
      title: activar ? `Activar ${p.nombre}` : `Desactivar ${p.nombre}`,
      message: activar
        ? 'El producto volverá a aparecer en Pedido diario y Producción.'
        : 'El producto dejará de aparecer en Pedido diario y no podrá usarse en nuevas órdenes de producción.',
      tone: activar ? 'primary' : 'danger',
      icon: activar ? 'check_circle' : 'block',
      confirmText: activar ? 'Activar' : 'Desactivar',
    });
    if (!ok) return;

    this.service.actualizar(p.id, { activo: activar }).subscribe(() => {
      this.toast.success(activar ? 'Producto activado' : 'Producto desactivado');
      this.cargar();
    });
  }

  cerrarForm() {
    this.mostrarNuevo.set(false);
    this.editando.set(null);
  }

  onSaved() {
    this.cerrarForm();
    this.cargar();
  }

  onRecetaGuardada() {
    this.receta.set(null);
    this.cargar();
  }
}
