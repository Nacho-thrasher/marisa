import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduccionService, Producto } from '../../core/services/produccion.service';
import { ClientesService, Cliente, Vendedor, TipoLista } from '../../core/services/clientes.service';
import { VentaService } from '../../core/services/venta.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Guia } from '../../shared/ui/guia';

interface Fila {
  producto: Producto;
  cantidad: number | null;
}

@Component({
  selector: 'app-pedido-diario',
  imports: [DecimalPipe, FormsModule, Guia],
  template: `
    <div class="mb-6">
      <h2 class="page-title">Pedido diario</h2>
      <p class="text-sm text-slate-500">Cargá rápido el pedido de un vendedor, como en la planilla.</p>
    </div>

    <app-guia titulo="¿Cómo funciona el pedido diario?">
      <p>Es una forma <b>rápida</b> de cargar una venta, como la planilla por vendedor: elegís vendedor/cliente y la lista de precios, y cargás cantidades por producto.</p>
      <p>Al confirmar se registra una <b>venta</b> común: genera remito y <b>descuenta stock</b>. Es lo mismo que "Nueva venta" pero más ágil para varios productos.</p>
      <p>El total se calcula en vivo según la lista de precios elegida.</p>
    </app-guia>

    <!-- Encabezado del pedido -->
    <div class="card mb-4 grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
      <div>
        <label class="label">Vendedor</label>
        <select class="select" [(ngModel)]="vendedorId">
          <option [ngValue]="null">— Sin vendedor —</option>
          @for (v of vendedores(); track v.id) { <option [ngValue]="v.id">{{ v.nombre }}</option> }
        </select>
      </div>
      <div>
        <label class="label">Cliente</label>
        <select class="select" [(ngModel)]="clienteId" (ngModelChange)="onCliente()">
          <option [ngValue]="null">— Cliente ocasional —</option>
          @for (c of clientes(); track c.id) { <option [ngValue]="c.id">{{ c.nombre }}</option> }
        </select>
      </div>
      <div>
        <label class="label">Lista de precios</label>
        <select class="select" [(ngModel)]="lista">
          <option value="MAYORISTA">Distribuidor mayorista</option>
          <option value="REVENDEDOR">Revendedor</option>
          <option value="COMERCIO">Comercio</option>
          <option value="PUBLICO">Al público</option>
        </select>
      </div>
    </div>

    <!-- Grilla de productos -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Producto</th><th class="text-right">Precio</th><th class="w-32 text-center">Cantidad</th><th class="text-right">Subtotal</th></tr>
          </thead>
          <tbody>
            @for (f of filas(); track f.producto.id) {
              <tr [class.bg-brand-50]="(f.cantidad ?? 0) > 0">
                <td class="font-medium text-slate-800">{{ f.producto.nombre }}</td>
                <td class="text-right tabular-nums text-slate-500">\${{ precio(f.producto) | number: '1.0-2' }}</td>
                <td class="text-center">
                  <input
                    class="input w-24 text-center"
                    type="number"
                    min="0"
                    [(ngModel)]="f.cantidad"
                    (ngModelChange)="recalcular()"
                  />
                </td>
                <td class="text-right font-medium tabular-nums">
                  {{ (f.cantidad ?? 0) > 0 ? '$' + (precio(f.producto) * (f.cantidad ?? 0) | number: '1.0-2') : '—' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Barra de total -->
    <div class="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-lg">
      <div>
        <span class="text-sm text-slate-500">{{ itemsCargados() }} productos · </span>
        <span class="text-lg font-bold text-slate-900">Total: \${{ total() | number: '1.0-2' }}</span>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost" (click)="limpiar()">Limpiar</button>
        <button class="btn btn-primary" [disabled]="itemsCargados() === 0 || saving()" (click)="registrar()">
          <span class="material-icons text-[20px]">check</span> Registrar pedido
        </button>
      </div>
    </div>
  `,
})
export class PedidoDiario implements OnInit {
  private prod = inject(ProduccionService);
  private clientesSvc = inject(ClientesService);
  private ventas = inject(VentaService);
  private toast = inject(ToastService);

  readonly filas = signal<Fila[]>([]);
  readonly vendedores = signal<Vendedor[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly saving = signal(false);
  readonly tick = signal(0); // fuerza recálculo de computed

  vendedorId: number | null = null;
  clienteId: number | null = null;
  lista: TipoLista = 'REVENDEDOR';

  readonly itemsCargados = computed(() => {
    this.tick();
    return this.filas().filter((f) => (f.cantidad ?? 0) > 0).length;
  });
  readonly total = computed(() => {
    this.tick();
    return this.filas().reduce((acc, f) => acc + this.precio(f.producto) * (f.cantidad ?? 0), 0);
  });

  ngOnInit() {
    this.prod.productos().subscribe((r) => this.filas.set(r.data.map((p) => ({ producto: p, cantidad: null }))));
    this.clientesSvc.vendedores().subscribe((r) => this.vendedores.set(r.data));
    this.clientesSvc.listar(1, 200).subscribe((r) => this.clientes.set(r.data));
  }

  precio(p: Producto): number {
    const map: Record<TipoLista, string | null> = {
      MAYORISTA: p.precioMayorista,
      REVENDEDOR: p.precioRevendedor,
      COMERCIO: p.precioComercio,
      PUBLICO: p.precioPublico,
    };
    return Number(map[this.lista] ?? p.precioVenta ?? 0);
  }

  recalcular() {
    this.tick.update((v) => v + 1);
  }

  onCliente() {
    const c = this.clientes().find((x) => x.id === this.clienteId);
    if (c) {
      this.lista = c.tipo_lista;
      if (c.vendedor_id) this.vendedorId = c.vendedor_id;
      this.recalcular();
    }
  }

  limpiar() {
    this.filas.update((fs) => fs.map((f) => ({ ...f, cantidad: null })));
    this.recalcular();
  }

  registrar() {
    const detalles = this.filas()
      .filter((f) => (f.cantidad ?? 0) > 0)
      .map((f) => ({ producto_id: f.producto.id, cantidad: Number(f.cantidad), precio_unitario: this.precio(f.producto) }));
    if (detalles.length === 0) return;

    this.saving.set(true);
    const cliente = this.clientes().find((c) => c.id === this.clienteId);
    this.ventas
      .crear({
        cliente_id: this.clienteId ?? undefined,
        cliente_nombre: cliente?.nombre,
        vendedor_id: this.vendedorId ?? undefined,
        lista_precio: this.lista,
        detalles,
      })
      .subscribe({
        next: (res) => {
          this.toast.success(`Pedido registrado: ${res.data.numero_comprobante}`);
          this.saving.set(false);
          this.limpiar();
        },
        error: () => this.saving.set(false),
      });
  }
}
