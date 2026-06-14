import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ProduccionService,
  Producto,
  InsumoRequerido,
  OrdenListItem,
  OrdenDetalle,
} from '../../core/services/produccion.service';
import { ProductosService } from '../../core/services/productos.service';
import { InsumoService } from '../../core/services/insumo.service';
import { InsumoListItem } from '../../core/models/insumo.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

interface LineaConsumo extends InsumoRequerido {
  utilizada: number;
}

interface LineaReceta {
  insumo_id: number | null;
  cantidad_requerida: number | null;
  unidad_medida: string;
  porcentaje_merma: number;
}

type FiltroEstado = '' | 'PLANIFICADA' | 'EN_PROCESO' | 'COMPLETADA';

@Component({
  selector: 'app-produccion',
  imports: [DecimalPipe, DatePipe, FormsModule, Modal, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Órdenes de producción</h2>
        <p class="text-sm text-slate-500">Planificá, ejecutá y registrá el consumo real.</p>
      </div>
      <button class="btn btn-primary" (click)="abrirNueva()">
        <span class="material-icons text-[20px]">add</span> Nueva orden
      </button>
    </div>

    <!-- Filtro por estado -->
    <div class="mb-4 overflow-x-auto">
      <div class="tabs">
        @for (f of filtros; track f.id) {
          <button class="tab" [class.tab-active]="filtro() === f.id" (click)="filtrar(f.id)">{{ f.label }}</button>
        }
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>N° orden</th><th>Producto</th><th>Solicitado</th><th>Producido</th>
              <th>Fecha</th><th>Estado</th><th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (o of ordenes(); track o.orden_id) {
              <tr>
                <td class="font-mono text-xs text-slate-500">{{ o.numero_orden }}</td>
                <td class="font-medium text-slate-800">{{ o.producto }}</td>
                <td>{{ o.cantidad_solicitada | number: '1.0-0' }}</td>
                <td>{{ o.cantidad_producida ? (o.cantidad_producida | number: '1.0-0') : '—' }}</td>
                <td>{{ o.fecha_produccion | date: 'dd/MM/yyyy' }}</td>
                <td><span class="badge" [class]="estadoClase(o.estado)">{{ o.estado }}</span></td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    @if (o.estado === 'PLANIFICADA') {
                      <button class="btn btn-outline px-3 py-1.5 text-xs" (click)="iniciar(o)" [disabled]="saving()">
                        <span class="material-icons text-[16px]">play_arrow</span> Iniciar
                      </button>
                    }
                    @if (o.estado === 'PLANIFICADA' || o.estado === 'EN_PROCESO') {
                      <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="abrirCompletar(o)">
                        <span class="material-icons text-[16px]">task_alt</span> Completar
                      </button>
                    } @else if (o.estado === 'COMPLETADA') {
                      <button class="btn btn-ghost px-3 py-1.5 text-xs" (click)="verDetalle(o)">
                        <span class="material-icons text-[16px]">visibility</span> Ver
                      </button>
                    } @else {
                      <span class="text-xs text-slate-400">—</span>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (!loading() && ordenes().length === 0) {
        <div class="p-12 text-center text-slate-400">
          <span class="material-icons mb-2 text-4xl">precision_manufacturing</span>
          <p>Todavía no hay órdenes de producción.</p>
        </div>
      }
      <app-paginator [page]="page()" [limit]="10" [total]="total()" (pageChange)="cargar($event)" />
    </div>

    <!-- Modal nueva orden -->
    @if (mostrarNueva()) {
      <app-modal title="Nueva orden de producción" [wide]="true" (closed)="cerrarNueva()">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label">Producto</label>
            <select class="select" [(ngModel)]="productoId" (ngModelChange)="resetPreview()">
              <option [ngValue]="null" disabled>Seleccioná…</option>
              @for (p of productos(); track p.id) {
                <option [ngValue]="p.id">{{ p.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="label">Cantidad a producir</label>
            <input class="input" type="number" min="1" [(ngModel)]="cantidad" (ngModelChange)="resetPreview()" />
          </div>
          <div>
            <label class="label">Fecha de producción</label>
            <input class="input" type="date" [(ngModel)]="fecha" />
          </div>
        </div>

        <button
          class="btn btn-outline mt-4 w-full"
          [disabled]="!productoId || !cantidad || previewLoading()"
          (click)="previsualizar()"
        >
          <span class="material-icons text-[18px]">calculate</span>
          {{ previewLoading() ? 'Calculando…' : 'Calcular insumos' }}
        </button>

        <!-- Sin receta: en vez de error, guiamos a crearla -->
        @if (sinReceta()) {
          <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div class="flex items-start gap-3">
              <span class="material-icons text-[22px] text-amber-600">receipt_long</span>
              <div class="flex-1">
                <p class="font-semibold text-slate-800">Este producto todavía no tiene receta</p>
                <p class="mt-0.5 text-sm text-slate-600">
                  Para calcular insumos y producir, primero hay que cargar la receta (qué insumos lleva y en qué cantidad).
                </p>
                @if (esGerente()) {
                  <button class="btn btn-primary mt-3" (click)="abrirReceta()">
                    <span class="material-icons text-[18px]">add</span> Crear receta ahora
                  </button>
                } @else {
                  <p class="mt-3 text-sm font-medium text-amber-700">
                    Pedile a un gerente que cargue la receta de este producto.
                  </p>
                }
              </div>
            </div>
          </div>
        }

        @if (preview().length) {
          <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div class="overflow-x-auto">
              <table class="table">
                <thead><tr><th>Insumo</th><th>Requerido</th><th>Disponible</th><th>Estado</th></tr></thead>
                <tbody>
                  @for (i of preview(); track i.insumo_id) {
                    <tr>
                      <td class="font-medium text-slate-800">{{ i.nombre }}</td>
                      <td>{{ i.cantidad | number: '1.0-2' }} {{ i.unidad }}</td>
                      <td>{{ i.stock_disponible | number: '1.0-2' }}</td>
                      <td>
                        <span class="badge" [class]="i.suficiente ? 'badge-ok' : 'badge-critico'">
                          {{ i.suficiente ? 'OK' : 'Insuficiente' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <p class="mt-3 text-right text-sm text-slate-600">
            Costo estimado: <b class="text-slate-900">\${{ costoEstimado() | number: '1.0-2' }}</b>
          </p>
          @if (!puedeCrear()) {
            <p class="mt-1 text-right text-xs font-medium text-rose-600">
              Hay insumos sin stock suficiente. Reponé stock para poder crear la orden.
            </p>
          }
        }

        <div modal-footer>
          <button class="btn btn-ghost" (click)="cerrarNueva()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!puedeCrear() || saving()" (click)="crear()">Crear orden</button>
        </div>
      </app-modal>
    }

    <!-- Modal crear receta -->
    @if (mostrarReceta()) {
      <app-modal [title]="'Crear receta — ' + productoNombre()" [wide]="true" (closed)="mostrarReceta.set(false)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label class="label">Código</label>
            <input class="input" [(ngModel)]="recetaForm.codigo" placeholder="REC-001" />
          </div>
          <div>
            <label class="label">Rendimiento esperado</label>
            <input class="input" type="number" min="1" [(ngModel)]="recetaForm.rendimiento_esperado" />
          </div>
          <div>
            <label class="label">Unidad de rendimiento</label>
            <input class="input" [(ngModel)]="recetaForm.unidad_rendimiento" placeholder="unidades, kg…" />
          </div>
        </div>

        <p class="mt-5 mb-2 text-sm font-semibold text-slate-700">Insumos de la receta</p>
        <div class="space-y-2">
          @for (l of recetaLineas(); track $index) {
            <div class="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-12 sm:items-center sm:rounded-none sm:bg-transparent sm:p-0">
              <div class="sm:col-span-5">
                <select class="select" [(ngModel)]="l.insumo_id" (ngModelChange)="onInsumoReceta(l)">
                  <option [ngValue]="null" disabled>Insumo…</option>
                  @for (ins of insumos(); track ins.id) {
                    <option [ngValue]="ins.id">{{ ins.nombre }}</option>
                  }
                </select>
              </div>
              <div class="flex items-center gap-2 sm:contents">
                <input class="input min-w-0 flex-1 sm:col-span-3" type="number" min="0" step="any" placeholder="Cantidad" [(ngModel)]="l.cantidad_requerida" />
                <div class="shrink-0 text-sm text-slate-500 sm:col-span-2">{{ l.unidad_medida || '—' }}</div>
                <input class="input w-14 shrink-0 px-2 text-center sm:col-span-1 sm:w-full" type="number" min="0" step="any" title="Merma %" [(ngModel)]="l.porcentaje_merma" />
                <button class="btn-ghost btn-icon shrink-0 text-rose-500 sm:col-span-1 sm:justify-self-end" (click)="quitarLineaReceta($index)">
                  <span class="material-icons text-[18px]">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
        <button class="btn btn-soft mt-3" (click)="agregarLineaReceta()">
          <span class="material-icons text-[18px]">add</span> Agregar insumo
        </button>
        <p class="mt-3 text-right text-sm text-slate-600">
          Costo estimado: <b class="text-slate-900">\${{ costoReceta() | number: '1.0-2' }}</b>
          <span class="text-slate-400"> · por {{ recetaForm.unidad_rendimiento || 'lote' }}</span>
        </p>

        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarReceta.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!recetaValida() || saving()" (click)="guardarReceta()">
            Guardar receta
          </button>
        </div>
      </app-modal>
    }

    <!-- Modal detalle de orden completada -->
    @if (detalle(); as d) {
      <app-modal [title]="'Orden ' + d.numero_orden" [wide]="true" (closed)="detalle.set(null)">
        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-500">Producto</div><div class="font-semibold text-slate-800">{{ d.producto }}</div></div>
          <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-500">Producido</div><div class="font-semibold text-slate-800">{{ d.cantidad_producida | number: '1.0-0' }}</div></div>
          <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-500">Defectuosa</div><div class="font-semibold text-slate-800">{{ d.cantidad_defectuosa | number: '1.0-0' }}</div></div>
          <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-500">Costo real</div><div class="font-semibold text-slate-800">\${{ d.costo_real | number: '1.0-2' }}</div></div>
        </div>
        <p class="mb-2 text-sm font-semibold text-slate-700">Consumo real de insumos</p>
        <div class="overflow-hidden rounded-xl border border-slate-200">
          <div class="overflow-x-auto">
            <table class="table">
              <thead><tr><th>Insumo</th><th class="text-right">Previsto</th><th class="text-right">Real</th><th class="text-right">Δ</th><th class="text-right">Costo</th></tr></thead>
              <tbody>
                @for (c of d.consumo_real; track c.insumo) {
                  <tr>
                    <td class="font-medium text-slate-800">{{ c.insumo }}</td>
                    <td class="text-right tabular-nums">{{ c.cantidad_prevista | number: '1.0-2' }}</td>
                    <td class="text-right tabular-nums">{{ c.cantidad_utilizada | number: '1.0-2' }}</td>
                    <td class="text-right tabular-nums" [class]="num(c.diferencia) > 0 ? 'text-rose-600' : 'text-emerald-600'">
                      {{ num(c.diferencia) > 0 ? '+' : '' }}{{ c.diferencia | number: '1.0-2' }}
                    </td>
                    <td class="text-right tabular-nums text-slate-500">\${{ c.costo_total | number: '1.0-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <div modal-footer><button class="btn btn-primary" (click)="detalle.set(null)">Cerrar</button></div>
      </app-modal>
    }

    <!-- Modal completar -->
    @if (completarOrden(); as ord) {
      <app-modal [title]="'Completar — ' + ord.numero_orden" [wide]="true" (closed)="completarOrden.set(null)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Cantidad producida</label>
            <input class="input" type="number" min="0" [(ngModel)]="producida" />
          </div>
          <div>
            <label class="label">Defectuosa / merma</label>
            <input class="input" type="number" min="0" [(ngModel)]="defectuosa" />
          </div>
        </div>
        <p class="mt-4 mb-2 text-sm font-semibold text-slate-700">Consumo real de insumos</p>
        <div class="space-y-2">
          @for (l of consumo(); track l.insumo_id) {
            <div class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <span class="flex-1 text-sm font-medium text-slate-700">{{ l.nombre }}</span>
              <span class="text-xs text-slate-400">sug. {{ l.cantidad | number: '1.0-2' }} {{ l.unidad }}</span>
              <input class="input w-32" type="number" min="0" step="any" [(ngModel)]="l.utilizada" />
            </div>
          }
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="completarOrden.set(null)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="confirmarCompletar()">Confirmar producción</button>
        </div>
      </app-modal>
    }
  `,
})
export class Produccion implements OnInit {
  private service = inject(ProduccionService);
  private productosSvc = inject(ProductosService);
  private insumoSvc = inject(InsumoService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly ordenes = signal<OrdenListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly saving = signal(false);

  // Filtro por estado
  readonly filtros = [
    { id: '' as FiltroEstado, label: 'Todas' },
    { id: 'PLANIFICADA' as FiltroEstado, label: 'Planificadas' },
    { id: 'EN_PROCESO' as FiltroEstado, label: 'En proceso' },
    { id: 'COMPLETADA' as FiltroEstado, label: 'Completadas' },
  ];
  readonly filtro = signal<FiltroEstado>('');

  // Nueva orden
  readonly mostrarNueva = signal(false);
  readonly productos = signal<Producto[]>([]);
  readonly preview = signal<InsumoRequerido[]>([]);
  readonly costoEstimado = signal('0');
  readonly previewLoading = signal(false);
  readonly sinReceta = signal(false);
  productoId: number | null = null;
  cantidad = 50;
  fecha = new Date().toISOString().slice(0, 10);

  // Receta
  readonly mostrarReceta = signal(false);
  readonly insumos = signal<InsumoListItem[]>([]);
  readonly recetaLineas = signal<LineaReceta[]>([]);
  recetaForm = { codigo: '', rendimiento_esperado: 1, unidad_rendimiento: 'unidades' };

  // Completar
  readonly completarOrden = signal<OrdenListItem | null>(null);
  readonly consumo = signal<LineaConsumo[]>([]);
  producida = 0;
  defectuosa = 0;

  // Detalle de orden completada
  readonly detalle = signal<OrdenDetalle | null>(null);

  esGerente() {
    return this.auth.hasRole('GERENTE');
  }
  num(v: string | number) {
    return Number(v);
  }
  productoNombre() {
    return this.productos().find((p) => p.id === this.productoId)?.nombre ?? '';
  }

  ngOnInit() {
    this.cargar(1);
    this.service.productos().subscribe((res) => this.productos.set(res.data));
    this.insumoSvc.listar({ limit: 100 }).subscribe((res) => this.insumos.set(res.data));
  }

  filtrar(estado: FiltroEstado) {
    this.filtro.set(estado);
    this.cargar(1);
  }

  cargar(p: number) {
    this.page.set(p);
    this.loading.set(true);
    this.service.listarOrdenes(p, 10, this.filtro() || undefined).subscribe({
      next: (res) => {
        this.ordenes.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  iniciar(o: OrdenListItem) {
    this.saving.set(true);
    this.service.iniciar(o.orden_id).subscribe({
      next: () => {
        this.toast.success('Orden iniciada');
        this.saving.set(false);
        this.cargar(this.page());
      },
      error: () => this.saving.set(false),
    });
  }

  verDetalle(o: OrdenListItem) {
    this.service.obtenerOrden(o.orden_id).subscribe((res) => this.detalle.set(res.data));
  }

  estadoClase(estado: string) {
    return {
      PLANIFICADA: 'badge-info',
      EN_PROCESO: 'badge-bajo',
      COMPLETADA: 'badge-ok',
      CANCELADA: 'badge-critico',
    }[estado] ?? 'badge-neutral';
  }

  abrirNueva() {
    this.productoId = null;
    this.cantidad = 50;
    this.fecha = new Date().toISOString().slice(0, 10);
    this.mostrarNueva.set(true);
    this.resetPreview();
  }

  cerrarNueva() {
    this.mostrarNueva.set(false);
    this.resetPreview();
  }

  resetPreview() {
    this.preview.set([]);
    this.costoEstimado.set('0');
    this.sinReceta.set(false);
  }

  previsualizar() {
    if (!this.productoId || !this.cantidad) return;
    this.previewLoading.set(true);
    this.sinReceta.set(false);
    // silent=true: si no hay receta, lo mostramos inline (no como toast de error).
    this.service.preview(this.productoId, this.cantidad, true).subscribe({
      next: (res) => {
        this.preview.set(res.data.insumos_requeridos);
        this.costoEstimado.set(res.data.costo_estimado);
        this.previewLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.previewLoading.set(false);
        this.preview.set([]);
        const msg = String(err.error?.message ?? '');
        if (err.status === 400 && /receta/i.test(msg)) {
          this.sinReceta.set(true);
        } else {
          this.toast.error(msg || 'No se pudieron calcular los insumos');
        }
      },
    });
  }

  puedeCrear() {
    return this.productoId && this.cantidad > 0 && this.preview().every((i) => i.suficiente) && this.preview().length > 0;
  }

  crear() {
    if (!this.productoId) return;
    this.saving.set(true);
    this.service
      .crearOrden({ producto_id: this.productoId, cantidad_solicitada: this.cantidad, fecha_produccion: this.fecha })
      .subscribe({
        next: () => {
          this.toast.success('Orden creada');
          this.saving.set(false);
          this.cerrarNueva();
          this.cargar(1);
        },
        error: () => this.saving.set(false),
      });
  }

  // ── Receta ──────────────────────────────────────────────
  abrirReceta() {
    const prod = this.productos().find((p) => p.id === this.productoId);
    this.recetaForm = {
      codigo: prod ? `REC-${prod.codigo}` : '',
      rendimiento_esperado: this.cantidad || 1,
      unidad_rendimiento: 'unidades',
    };
    this.recetaLineas.set([{ insumo_id: null, cantidad_requerida: null, unidad_medida: '', porcentaje_merma: 0 }]);
    this.mostrarReceta.set(true);
  }

  agregarLineaReceta() {
    this.recetaLineas.update((ls) => [...ls, { insumo_id: null, cantidad_requerida: null, unidad_medida: '', porcentaje_merma: 0 }]);
  }

  quitarLineaReceta(i: number) {
    this.recetaLineas.update((ls) => ls.filter((_, idx) => idx !== i));
  }

  onInsumoReceta(l: LineaReceta) {
    const ins = this.insumos().find((x) => x.id === l.insumo_id);
    if (ins) l.unidad_medida = ins.unidad_medida;
  }

  costoReceta() {
    return this.recetaLineas().reduce((acc, l) => {
      const ins = this.insumos().find((x) => x.id === l.insumo_id);
      const costo = ins ? Number(ins.costo_actual) : 0;
      return acc + costo * (Number(l.cantidad_requerida) || 0);
    }, 0);
  }

  recetaValida() {
    const lineas = this.recetaLineas().filter((l) => l.insumo_id && Number(l.cantidad_requerida) > 0);
    return (
      this.recetaForm.codigo.trim().length > 0 &&
      Number(this.recetaForm.rendimiento_esperado) > 0 &&
      this.recetaForm.unidad_rendimiento.trim().length > 0 &&
      lineas.length > 0
    );
  }

  guardarReceta() {
    if (!this.productoId || !this.recetaValida()) return;
    this.saving.set(true);
    const insumos = this.recetaLineas()
      .filter((l) => l.insumo_id && Number(l.cantidad_requerida) > 0)
      .map((l) => ({
        insumo_id: l.insumo_id!,
        cantidad_requerida: Number(l.cantidad_requerida),
        unidad_medida: l.unidad_medida,
        porcentaje_merma: Number(l.porcentaje_merma) || 0,
      }));
    this.productosSvc
      .crearReceta(this.productoId, {
        codigo: this.recetaForm.codigo.trim(),
        rendimiento_esperado: Number(this.recetaForm.rendimiento_esperado),
        unidad_rendimiento: this.recetaForm.unidad_rendimiento.trim(),
        insumos,
      })
      .subscribe({
        next: () => {
          this.toast.success('Receta creada');
          this.saving.set(false);
          this.mostrarReceta.set(false);
          this.sinReceta.set(false);
          // Recalcular insumos automáticamente con la nueva receta.
          this.previsualizar();
        },
        error: () => this.saving.set(false),
      });
  }

  abrirCompletar(o: OrdenListItem) {
    this.completarOrden.set(o);
    this.producida = Number(o.cantidad_solicitada);
    this.defectuosa = 0;
    this.consumo.set([]);
    // Reutilizamos el preview para sugerir el consumo según receta.
    this.service.preview(this.findProductoId(o), Number(o.cantidad_solicitada)).subscribe({
      next: (res) => this.consumo.set(res.data.insumos_requeridos.map((i) => ({ ...i, utilizada: Math.round(Number(i.cantidad) * 100) / 100 }))),
    });
  }

  /** Como la lista trae el nombre, buscamos el id en el catálogo cargado. */
  private findProductoId(o: OrdenListItem): number {
    const p = this.productos().find((x) => x.nombre === o.producto);
    return p?.id ?? 0;
  }

  confirmarCompletar() {
    const o = this.completarOrden();
    if (!o) return;
    this.saving.set(true);
    this.service
      .completar(o.orden_id, {
        cantidad_producida: this.producida,
        cantidad_defectuosa: this.defectuosa,
        consumo_real: this.consumo().map((l) => ({ insumo_id: l.insumo_id, cantidad_utilizada: Number(l.utilizada) })),
      })
      .subscribe({
        next: () => {
          this.toast.success('Producción registrada');
          this.saving.set(false);
          this.completarOrden.set(null);
          this.cargar(this.page());
        },
        error: () => this.saving.set(false),
      });
  }
}
