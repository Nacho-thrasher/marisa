import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService, VentaListItem } from '../../core/services/venta.service';
import { ProduccionService, Producto } from '../../core/services/produccion.service';
import { ClientesService, Cliente, Vendedor, TipoLista } from '../../core/services/clientes.service';
import { DescargasService } from '../../core/services/descargas.service';
import { ToastService } from '../../shared/ui/toast.service';
import { ConfirmService } from '../../shared/ui/confirm.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

interface Linea {
  producto_id: number | null;
  cantidad: number;
  precio_unitario: number;
}

@Component({
  selector: 'app-ventas',
  imports: [DecimalPipe, DatePipe, FormsModule, Modal, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Ventas</h2>
        <p class="text-sm text-slate-500">Remitos, clientes y márgenes.</p>
      </div>
      <button class="btn btn-primary" (click)="abrirNueva()">
        <span class="material-icons text-[20px]">add</span> Nueva venta
      </button>
    </div>

    @if (resumen(); as r) {
      <div class="mb-4 grid gap-4 sm:grid-cols-3">
        <div class="card p-4"><div class="text-sm text-slate-500">Ventas vigentes</div><div class="text-2xl font-bold">{{ r.cantidad_ventas }}</div></div>
        <div class="card p-4"><div class="text-sm text-slate-500">Total facturado</div><div class="text-2xl font-bold">\${{ r.total_vendido | number: '1.0-0' }}</div></div>
        <div class="card p-4"><div class="text-sm text-slate-500">Ganancia bruta</div><div class="text-2xl font-bold text-emerald-600">\${{ r.ganancia_total | number: '1.0-0' }}</div></div>
      </div>
    }

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Comprobante</th><th>Cliente</th><th>Fecha</th><th>Ítems</th><th class="text-right">Total</th><th>Estado</th><th class="text-right">Acciones</th></tr>
          </thead>
          <tbody>
            @for (v of ventas(); track v.venta_id) {
              <tr>
                <td class="font-mono text-xs text-slate-500">{{ v.numero_comprobante }}</td>
                <td class="font-medium text-slate-800">{{ v.cliente || '—' }}</td>
                <td>{{ v.fecha | date: 'dd/MM/yyyy' }}</td>
                <td>{{ v.productos_cantidad }}</td>
                <td class="text-right tabular-nums">\${{ v.total | number: '1.0-2' }}</td>
                <td><span class="badge" [class]="v.estado === 'VIGENTE' ? 'badge-ok' : 'badge-critico'">{{ v.estado }}</span></td>
                <td class="text-right">
                  <button class="btn-ghost btn-icon" title="Descargar remito (PDF)" (click)="descargarRemito(v)">
                    <span class="material-icons text-[20px]">picture_as_pdf</span>
                  </button>
                  @if (v.estado === 'VIGENTE') {
                    <button class="btn-ghost btn-icon text-rose-600" title="Anular" (click)="anular(v)">
                      <span class="material-icons text-[20px]">block</span>
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (!loading() && ventas().length === 0) {
        <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">point_of_sale</span><p>Sin ventas registradas.</p></div>
      }
      <app-paginator [page]="page()" [limit]="10" [total]="total()" (pageChange)="cargar($event)" />
    </div>

    @if (mostrarNueva()) {
      <app-modal title="Nueva venta" [wide]="true" (closed)="mostrarNueva.set(false)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Cliente</label>
            <select class="select" [(ngModel)]="clienteId" (ngModelChange)="onClienteChange()">
              <option [ngValue]="null">— Cliente ocasional —</option>
              @for (c of clientes(); track c.id) { <option [ngValue]="c.id">{{ c.nombre }} ({{ listaLabel(c.tipo_lista) }})</option> }
            </select>
          </div>
          <div>
            <label class="label">Vendedor</label>
            <select class="select" [(ngModel)]="vendedorId">
              <option [ngValue]="null">— Sin vendedor —</option>
              @for (v of vendedores(); track v.id) { <option [ngValue]="v.id">{{ v.nombre }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Lista de precios</label>
            <select class="select" [(ngModel)]="listaPrecio" (ngModelChange)="reprecificar()">
              <option value="MAYORISTA">Distribuidor mayorista</option>
              <option value="REVENDEDOR">Revendedor</option>
              <option value="COMERCIO">Comercio</option>
              <option value="PUBLICO">Al público</option>
            </select>
          </div>
          <div>
            <label class="label">Medio de pago</label>
            <select class="select" [(ngModel)]="medioPago">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
          <div><label class="label">CUIT</label><input class="input" [(ngModel)]="cuit" /></div>
          <div><label class="label">Descuento (%)</label><input class="input" type="number" min="0" max="100" [(ngModel)]="descuento" /></div>
        </div>

        <div class="mt-4 mb-2 flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-700">Productos</p>
          <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="agregarLinea()">
            <span class="material-icons text-[16px]">add</span> Agregar
          </button>
        </div>
        <div class="space-y-2">
          @for (l of lineas(); track $index) {
            <div class="flex flex-col gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex-row sm:items-center">
              <select class="select w-full sm:flex-1" [(ngModel)]="l.producto_id" (ngModelChange)="autoPrecio(l)">
                <option [ngValue]="null" disabled>Producto…</option>
                @for (p of productos(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }
              </select>
              <div class="flex items-center gap-2">
                <input class="input w-24" type="number" min="1" [(ngModel)]="l.cantidad" placeholder="Cant." />
                <input class="input w-28" type="number" min="0" step="any" [(ngModel)]="l.precio_unitario" placeholder="Precio" />
                <button class="btn-ghost btn-icon rounded-lg text-rose-500" (click)="quitarLinea($index)">
                  <span class="material-icons text-[18px]">delete</span>
                </button>
              </div>
            </div>
          }
        </div>
        <p class="mt-3 text-right text-sm text-slate-600">Total estimado: <b class="text-slate-900">\${{ totalEstimado() | number: '1.0-2' }}</b></p>

        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarNueva.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!puedeGuardar() || saving()" (click)="guardar()">Registrar venta</button>
        </div>
      </app-modal>
    }
  `,
})
export class Ventas implements OnInit {
  private service = inject(VentaService);
  private prodService = inject(ProduccionService);
  private clientesService = inject(ClientesService);
  private descargas = inject(DescargasService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly ventas = signal<VentaListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly resumen = signal<{ cantidad_ventas: number; total_vendido: string; ganancia_total: string } | null>(null);

  readonly mostrarNueva = signal(false);
  readonly productos = signal<Producto[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly vendedores = signal<Vendedor[]>([]);
  readonly lineas = signal<Linea[]>([]);
  cuit = '';
  medioPago = 'efectivo';
  descuento = 0;
  clienteId: number | null = null;
  vendedorId: number | null = null;
  listaPrecio: TipoLista = 'REVENDEDOR';

  readonly totalEstimado = computed(() => {
    const bruto = this.lineas().reduce((a, l) => a + (l.cantidad || 0) * (l.precio_unitario || 0), 0);
    return bruto * (1 - (this.descuento || 0) / 100);
  });

  ngOnInit() {
    this.cargar(1);
    this.cargarResumen();
    this.prodService.productos().subscribe((res) => this.productos.set(res.data));
    this.clientesService.listar(1, 200).subscribe((res) => this.clientes.set(res.data));
    this.clientesService.vendedores().subscribe((res) => this.vendedores.set(res.data));
  }

  /** Precio del producto según la lista seleccionada (fallback a precioVenta). */
  private precioLista(p: Producto): number {
    const map: Record<TipoLista, string | null> = {
      MAYORISTA: p.precioMayorista,
      REVENDEDOR: p.precioRevendedor,
      COMERCIO: p.precioComercio,
      PUBLICO: p.precioPublico,
    };
    return Number(map[this.listaPrecio] ?? p.precioVenta ?? 0);
  }

  onClienteChange() {
    const c = this.clientes().find((x) => x.id === this.clienteId);
    if (c) {
      this.listaPrecio = c.tipo_lista;
      if (c.vendedor_id) this.vendedorId = c.vendedor_id;
      this.cuit = c.cuit ?? this.cuit;
      this.reprecificar();
    }
  }

  /** Recalcula los precios de todas las líneas según la lista vigente. */
  reprecificar() {
    this.lineas.update((ls) =>
      ls.map((l) => {
        const p = this.productos().find((x) => x.id === l.producto_id);
        return p ? { ...l, precio_unitario: this.precioLista(p) } : l;
      }),
    );
  }

  cargar(p: number) {
    this.page.set(p);
    this.loading.set(true);
    this.service.listar(p, 10).subscribe({
      next: (res) => {
        this.ventas.set(res.data);
        this.total.set(res.pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cargarResumen() {
    this.service.resumen().subscribe((res) => this.resumen.set(res.data));
  }

  abrirNueva() {
    this.clienteId = null;
    this.vendedorId = null;
    this.listaPrecio = 'REVENDEDOR';
    this.cuit = '';
    this.medioPago = 'efectivo';
    this.descuento = 0;
    this.lineas.set([{ producto_id: null, cantidad: 1, precio_unitario: 0 }]);
    this.mostrarNueva.set(true);
  }

  listaLabel(t: string) {
    return { MAYORISTA: 'Mayorista', REVENDEDOR: 'Revendedor', COMERCIO: 'Comercio', PUBLICO: 'Público' }[t] ?? t;
  }

  agregarLinea() {
    this.lineas.update((l) => [...l, { producto_id: null, cantidad: 1, precio_unitario: 0 }]);
  }

  quitarLinea(i: number) {
    this.lineas.update((l) => l.filter((_, idx) => idx !== i));
  }

  autoPrecio(l: Linea) {
    const p = this.productos().find((x) => x.id === l.producto_id);
    if (p) l.precio_unitario = this.precioLista(p);
  }

  puedeGuardar() {
    const ls = this.lineas();
    return ls.length > 0 && ls.every((l) => l.producto_id && l.cantidad > 0);
  }

  guardar() {
    this.saving.set(true);
    const clienteSel = this.clientes().find((c) => c.id === this.clienteId);
    this.service
      .crear({
        cliente_nombre: clienteSel?.nombre,
        cliente_id: this.clienteId ?? undefined,
        vendedor_id: this.vendedorId ?? undefined,
        lista_precio: this.listaPrecio,
        cliente_cuit: this.cuit || undefined,
        medio_pago: this.medioPago,
        descuento_porcentaje: this.descuento || undefined,
        detalles: this.lineas().map((l) => ({
          producto_id: l.producto_id!,
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario),
        })),
      })
      .subscribe({
        next: () => {
          this.toast.success('Venta registrada');
          this.saving.set(false);
          this.mostrarNueva.set(false);
          this.cargar(1);
          this.cargarResumen();
        },
        error: () => this.saving.set(false),
      });
  }

  descargarRemito(v: VentaListItem) {
    this.descargas.descargar(`/ventas/${v.venta_id}/remito`, `${v.numero_comprobante}.pdf`);
  }

  async anular(v: VentaListItem) {
    const motivo = await this.confirm.prompt({
      title: `Anular ${v.numero_comprobante}`,
      message: 'Esta acción revierte el stock y deja la venta sin efecto. Ingresá el motivo de la anulación.',
      label: 'Motivo de anulación',
      placeholder: 'Ej.: error de carga, devolución del cliente…',
      tone: 'danger',
      icon: 'block',
      confirmText: 'Anular venta',
      multiline: true,
    });
    if (!motivo) return;
    this.service.anular(v.venta_id, motivo).subscribe(() => {
      this.toast.success('Venta anulada');
      this.cargar(this.page());
      this.cargarResumen();
    });
  }
}
