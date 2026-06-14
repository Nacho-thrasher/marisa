import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProduccionService,
  Producto,
  InsumoRequerido,
  OrdenListItem,
} from '../../core/services/produccion.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

interface LineaConsumo extends InsumoRequerido {
  utilizada: number;
}

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
                  @if (o.estado !== 'COMPLETADA' && o.estado !== 'CANCELADA') {
                    <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="abrirCompletar(o)">
                      <span class="material-icons text-[16px]">task_alt</span> Completar
                    </button>
                  } @else {
                    <span class="text-xs text-slate-400">—</span>
                  }
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
      <app-modal title="Nueva orden de producción" [wide]="true" (closed)="mostrarNueva.set(false)">
        <div class="grid grid-cols-2 gap-4">
          <div>
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
            <input class="input" type="number" min="1" [(ngModel)]="cantidad" />
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button class="btn btn-outline" [disabled]="!productoId || !cantidad || previewLoading()" (click)="previsualizar()">
            <span class="material-icons text-[18px]">calculate</span> Calcular insumos
          </button>
          <input class="input flex-1" type="date" [(ngModel)]="fecha" />
        </div>

        @if (preview().length) {
          <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
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
          <p class="mt-3 text-right text-sm text-slate-600">
            Costo estimado: <b class="text-slate-900">\${{ costoEstimado() | number: '1.0-2' }}</b>
          </p>
        }

        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarNueva.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!puedeCrear() || saving()" (click)="crear()">Crear orden</button>
        </div>
      </app-modal>
    }

    <!-- Modal completar -->
    @if (completarOrden(); as ord) {
      <app-modal [title]="'Completar — ' + ord.numero_orden" [wide]="true" (closed)="completarOrden.set(null)">
        <div class="grid grid-cols-2 gap-4">
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
  private toast = inject(ToastService);

  readonly ordenes = signal<OrdenListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly saving = signal(false);

  // Nueva orden
  readonly mostrarNueva = signal(false);
  readonly productos = signal<Producto[]>([]);
  readonly preview = signal<InsumoRequerido[]>([]);
  readonly costoEstimado = signal('0');
  readonly previewLoading = signal(false);
  productoId: number | null = null;
  cantidad = 50;
  fecha = new Date().toISOString().slice(0, 10);

  // Completar
  readonly completarOrden = signal<OrdenListItem | null>(null);
  readonly consumo = signal<LineaConsumo[]>([]);
  producida = 0;
  defectuosa = 0;

  ngOnInit() {
    this.cargar(1);
    this.service.productos().subscribe((res) => this.productos.set(res.data));
  }

  cargar(p: number) {
    this.page.set(p);
    this.loading.set(true);
    this.service.listarOrdenes(p, 10).subscribe({
      next: (res) => {
        this.ordenes.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
    this.mostrarNueva.set(true);
    this.resetPreview();
  }

  resetPreview() {
    this.preview.set([]);
    this.costoEstimado.set('0');
  }

  previsualizar() {
    if (!this.productoId || !this.cantidad) return;
    this.previewLoading.set(true);
    this.service.preview(this.productoId, this.cantidad).subscribe({
      next: (res) => {
        this.preview.set(res.data.insumos_requeridos);
        this.costoEstimado.set(res.data.costo_estimado);
        this.previewLoading.set(false);
      },
      error: () => this.previewLoading.set(false),
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
          this.mostrarNueva.set(false);
          this.cargar(1);
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
