import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductosService, RecetaVersion } from '../../core/services/productos.service';
import { InsumoService } from '../../core/services/insumo.service';
import { InsumoListItem } from '../../core/models/insumo.model';
import { Producto } from '../../core/services/produccion.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';

interface LineaReceta {
  insumo_id: number | null;
  cantidad_requerida: number | null;
  unidad_medida: string;
  porcentaje_merma: number;
}

@Component({
  selector: 'app-producto-receta-dialog',
  imports: [DecimalPipe, DatePipe, FormsModule, Modal],
  template: `
    <app-modal [title]="'Receta — ' + producto().nombre" [wide]="true" (closed)="closed.emit()">
      @if (loading()) {
        <p class="py-8 text-center text-sm text-slate-400">Cargando…</p>
      } @else {
        @if (versionVigente()) {
          <div class="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span class="material-icons text-[18px] text-slate-400">info</span>
            Versión vigente: v{{ versionVigente() }}. Guardar crea una nueva versión.
          </div>
        } @else {
          <div class="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-700">
            <span class="material-icons text-[18px]">receipt_long</span>
            Este producto todavía no tiene receta.
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label class="label">Código</label>
            <input class="input" [(ngModel)]="form.codigo" placeholder="REC-001" />
          </div>
          <div>
            <label class="label">Rendimiento esperado</label>
            <input class="input" type="number" min="1" [(ngModel)]="form.rendimiento_esperado" />
          </div>
          <div>
            <label class="label">Unidad de rendimiento</label>
            <input class="input" [(ngModel)]="form.unidad_rendimiento" placeholder="unidades, kg…" />
          </div>
        </div>

        <p class="mt-5 mb-1 text-sm font-semibold text-slate-700">Insumos de la receta</p>
        <p class="mb-3 text-xs text-slate-400">Indicá cuánto de cada insumo se usa por lote. La merma es el % extra que se pierde en el proceso.</p>

        <!-- Encabezados de columnas (solo desktop) -->
        <div class="hidden px-1 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase sm:grid sm:grid-cols-12 sm:gap-2">
          <div class="sm:col-span-5">Insumo</div>
          <div class="sm:col-span-3">Cantidad</div>
          <div class="sm:col-span-2">Unidad</div>
          <div class="sm:col-span-1 text-center" title="Porcentaje de merma">Merma %</div>
          <div class="sm:col-span-1"></div>
        </div>

        <div class="space-y-2">
          @for (l of lineas(); track $index) {
            <div class="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-12 sm:items-center sm:rounded-none sm:bg-transparent sm:p-0">
              <div class="sm:col-span-5">
                <label class="label mb-1 sm:hidden">Insumo</label>
                <select class="select" [(ngModel)]="l.insumo_id" (ngModelChange)="onInsumo(l)">
                  <option [ngValue]="null" disabled>Elegir insumo…</option>
                  @for (ins of insumos(); track ins.id) {
                    <option [ngValue]="ins.id">{{ ins.nombre }}</option>
                  }
                </select>
              </div>
              <div class="flex items-end gap-2 sm:contents">
                <div class="min-w-0 flex-1 sm:col-span-3">
                  <label class="label mb-1 sm:hidden">Cantidad</label>
                  <input class="input" type="number" min="0" step="any" placeholder="0" [(ngModel)]="l.cantidad_requerida" />
                </div>
                <div class="shrink-0 pb-2 text-sm text-slate-500 sm:col-span-2 sm:pb-0">{{ l.unidad_medida || '—' }}</div>
                <div class="w-16 shrink-0 sm:col-span-1 sm:w-full">
                  <label class="label mb-1 sm:hidden">Merma %</label>
                  <input class="input px-2 text-center" type="number" min="0" step="any" placeholder="0" title="Porcentaje de merma" [(ngModel)]="l.porcentaje_merma" />
                </div>
                <button class="btn-ghost btn-icon mb-0.5 shrink-0 text-rose-500 sm:col-span-1 sm:mb-0 sm:justify-self-end" title="Quitar insumo" (click)="quitarLinea($index)">
                  <span class="material-icons text-[18px]">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
        <button class="btn btn-soft mt-3" (click)="agregarLinea()">
          <span class="material-icons text-[18px]">add</span> Agregar insumo
        </button>

        <div class="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <div class="flex items-center gap-2 text-sm font-medium text-brand-700">
            <span class="material-icons text-[20px]">payments</span>
            Costo estimado del lote
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-brand-700">\${{ costoEstimado() | number: '1.0-2' }}</div>
            <div class="text-xs text-brand-600/70">por {{ form.unidad_rendimiento || 'lote' }}</div>
          </div>
        </div>

        @if (versiones().length > 1) {
          <div class="mt-4 border-t border-[var(--color-line)] pt-3">
            <button class="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900" (click)="mostrarVersiones.set(!mostrarVersiones())">
              <span class="material-icons text-[18px]">{{ mostrarVersiones() ? 'expand_less' : 'expand_more' }}</span>
              Versiones anteriores ({{ versiones().length }})
            </button>
            @if (mostrarVersiones()) {
              <div class="mt-2 overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr><th>Versión</th><th>Código</th><th class="text-right">Costo total</th><th>Creado por</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    @for (v of versiones(); track v.receta_id) {
                      <tr>
                        <td>
                          v{{ v.version }}
                          @if (v.vigente) { <span class="badge badge-ok ml-1 text-[10px]">Vigente</span> }
                        </td>
                        <td class="font-mono text-xs text-slate-500">{{ v.codigo }}</td>
                        <td class="text-right tabular-nums">{{ v.costo_total_esperado ? '$' + (v.costo_total_esperado | number: '1.2-2') : '—' }}</td>
                        <td class="text-slate-600">{{ v.creado_por || '—' }}</td>
                        <td class="whitespace-nowrap text-slate-500">{{ v.fecha_creacion | date: 'dd/MM/yy HH:mm' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }

      <div modal-footer>
        <button class="btn btn-ghost" (click)="closed.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="loading() || !valida() || saving()" (click)="guardar()">
          Guardar receta
        </button>
      </div>
    </app-modal>
  `,
})
export class ProductoRecetaDialog implements OnInit {
  private productosSvc = inject(ProductosService);
  private insumoSvc = inject(InsumoService);
  private toast = inject(ToastService);

  readonly producto = input.required<Producto>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly insumos = signal<InsumoListItem[]>([]);
  readonly lineas = signal<LineaReceta[]>([]);
  readonly versionVigente = signal<number | null>(null);
  readonly versiones = signal<RecetaVersion[]>([]);
  readonly mostrarVersiones = signal(false);

  form = { codigo: '', rendimiento_esperado: 1, unidad_rendimiento: 'unidades' };

  ngOnInit() {
    this.insumoSvc.listar({ limit: 100 }).subscribe((res) => this.insumos.set(res.data));
    this.productosSvc.versionesReceta(this.producto().id).subscribe((res) => this.versiones.set(res.data));

    this.form.codigo = `REC-${this.producto().codigo}`;

    this.productosSvc.obtenerReceta(this.producto().id, true).subscribe({
      next: (res) => {
        const r = res.data;
        this.versionVigente.set(r.version);
        this.form = {
          codigo: r.codigo,
          rendimiento_esperado: Number(r.rendimiento_esperado),
          unidad_rendimiento: r.unidad,
        };
        this.lineas.set(
          r.insumos.map((i) => ({
            insumo_id: i.insumo_id,
            cantidad_requerida: Number(i.cantidad_requerida),
            unidad_medida: i.unidad_medida,
            porcentaje_merma: Number(i.porcentaje_merma),
          })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.lineas.set([{ insumo_id: null, cantidad_requerida: null, unidad_medida: '', porcentaje_merma: 0 }]);
        this.loading.set(false);
      },
    });
  }

  agregarLinea() {
    this.lineas.update((ls) => [...ls, { insumo_id: null, cantidad_requerida: null, unidad_medida: '', porcentaje_merma: 0 }]);
  }

  quitarLinea(i: number) {
    this.lineas.update((ls) => ls.filter((_, idx) => idx !== i));
  }

  onInsumo(l: LineaReceta) {
    const ins = this.insumos().find((x) => x.id === l.insumo_id);
    if (ins) l.unidad_medida = ins.unidad_medida;
  }

  costoEstimado() {
    return this.lineas().reduce((acc, l) => {
      const ins = this.insumos().find((x) => x.id === l.insumo_id);
      const costo = ins ? Number(ins.costo_actual) : 0;
      const cantidad = Number(l.cantidad_requerida) || 0;
      const merma = Number(l.porcentaje_merma) || 0;
      return acc + costo * cantidad * (1 + merma / 100);
    }, 0);
  }

  valida() {
    const lineas = this.lineas().filter((l) => l.insumo_id && Number(l.cantidad_requerida) > 0);
    return (
      this.form.codigo.trim().length > 0 &&
      Number(this.form.rendimiento_esperado) > 0 &&
      this.form.unidad_rendimiento.trim().length > 0 &&
      lineas.length > 0
    );
  }

  guardar() {
    if (!this.valida()) return;
    this.saving.set(true);
    const insumos = this.lineas()
      .filter((l) => l.insumo_id && Number(l.cantidad_requerida) > 0)
      .map((l) => ({
        insumo_id: l.insumo_id!,
        cantidad_requerida: Number(l.cantidad_requerida),
        unidad_medida: l.unidad_medida,
        porcentaje_merma: Number(l.porcentaje_merma) || 0,
      }));

    this.productosSvc
      .crearReceta(this.producto().id, {
        codigo: this.form.codigo.trim(),
        rendimiento_esperado: Number(this.form.rendimiento_esperado),
        unidad_rendimiento: this.form.unidad_rendimiento.trim(),
        insumos,
      })
      .subscribe({
        next: () => {
          this.toast.success(this.versionVigente() ? 'Receta actualizada' : 'Receta creada');
          this.saved.emit();
        },
        error: () => this.saving.set(false),
      });
  }
}
