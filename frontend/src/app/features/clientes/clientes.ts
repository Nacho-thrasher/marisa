import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientesService, Cliente, Vendedor } from '../../core/services/clientes.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

@Component({
  selector: 'app-clientes',
  imports: [FormsModule, Modal, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Clientes</h2>
        <p class="text-sm text-slate-500">Cartera por zona de venta en Salta.</p>
      </div>
      <button class="btn btn-primary" (click)="abrirNuevo()">
        <span class="material-icons text-[20px]">add</span> Nuevo cliente
      </button>
    </div>

    <!-- Resumen por zona: dónde hay clientes (y dónde falta ir a ofrecer) -->
    @if (porZona().length) {
      <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        @for (z of porZona(); track z.zona) {
          <button
            class="card p-3 text-left transition hover:border-brand-300"
            [class.ring-1]="zonaFiltro() === z.zona"
            [class.ring-brand-500]="zonaFiltro() === z.zona"
            (click)="filtrarZona(z.zona)"
          >
            <div class="text-xs text-slate-500">{{ z.zona }}</div>
            <div class="text-xl font-bold text-slate-900">{{ z.clientes }}</div>
            <div class="text-[11px] text-slate-400">clientes</div>
          </button>
        }
      </div>
    }

    <div class="card mb-4 flex flex-wrap items-center gap-3 p-3">
      <div class="relative min-w-64 flex-1">
        <span class="material-icons absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-slate-400">search</span>
        <input class="input pl-10" [(ngModel)]="search" (ngModelChange)="cargar(1)" placeholder="Buscar cliente o localidad…" />
      </div>
      @if (zonaFiltro()) {
        <button class="btn btn-outline" (click)="filtrarZona(zonaFiltro())">
          <span class="material-icons text-[18px]">close</span> Zona: {{ zonaFiltro() }}
        </button>
      }
    </div>

    <div class="card overflow-hidden">
      <table class="table">
        <thead><tr><th>Cliente</th><th>Lista</th><th>Zona</th><th>Localidad</th><th>Vendedor</th><th>Teléfono</th></tr></thead>
        <tbody>
          @for (c of clientes(); track c.id) {
            <tr>
              <td class="font-medium text-slate-800">{{ c.nombre }}</td>
              <td><span class="badge" [class]="listaClase(c.tipo_lista)">{{ listaLabel(c.tipo_lista) }}</span></td>
              <td>{{ c.zona || '—' }}</td>
              <td>{{ c.localidad || '—' }}</td>
              <td>{{ c.vendedor || '—' }}</td>
              <td>{{ c.telefono || '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
      @if (clientes().length === 0) {
        <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">storefront</span><p>Sin clientes.</p></div>
      }
      <app-paginator [page]="page()" [limit]="20" [total]="total()" (pageChange)="cargar($event)" />
    </div>

    @if (mostrarNuevo()) {
      <app-modal title="Nuevo cliente" [wide]="true" (closed)="mostrarNuevo.set(false)">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="label">Nombre</label><input class="input" [(ngModel)]="form.nombre" /></div>
          <div>
            <label class="label">Lista de precios</label>
            <select class="select" [(ngModel)]="form.tipo_lista">
              <option value="MAYORISTA">Distribuidor mayorista</option>
              <option value="REVENDEDOR">Revendedor</option>
              <option value="COMERCIO">Comercio</option>
              <option value="PUBLICO">Al público</option>
            </select>
          </div>
          <div><label class="label">Zona</label><input class="input" [(ngModel)]="form.zona" placeholder="Centro, Norte…" /></div>
          <div><label class="label">Localidad</label><input class="input" [(ngModel)]="form.localidad" /></div>
          <div>
            <label class="label">Vendedor</label>
            <select class="select" [(ngModel)]="form.vendedor_id">
              <option [ngValue]="null">— Sin asignar —</option>
              @for (v of vendedores(); track v.id) { <option [ngValue]="v.id">{{ v.nombre }}</option> }
            </select>
          </div>
          <div><label class="label">Teléfono</label><input class="input" [(ngModel)]="form.telefono" /></div>
          <div><label class="label">CUIT</label><input class="input" [(ngModel)]="form.cuit" /></div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarNuevo.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!form.nombre || saving()" (click)="guardar()">Crear</button>
        </div>
      </app-modal>
    }
  `,
})
export class Clientes implements OnInit {
  private service = inject(ClientesService);
  private toast = inject(ToastService);

  readonly clientes = signal<Cliente[]>([]);
  readonly vendedores = signal<Vendedor[]>([]);
  readonly porZona = signal<{ zona: string; clientes: number }[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly zonaFiltro = signal('');
  readonly mostrarNuevo = signal(false);
  readonly saving = signal(false);
  search = '';

  form = { nombre: '', tipo_lista: 'REVENDEDOR', zona: '', localidad: '', telefono: '', cuit: '', vendedor_id: null as number | null };

  ngOnInit() {
    this.cargar(1);
    this.cargarZonas();
    this.service.vendedores().subscribe((r) => this.vendedores.set(r.data));
  }

  cargar(p: number) {
    this.page.set(p);
    this.service.listar(p, 20, { search: this.search || undefined, zona: this.zonaFiltro() || undefined }).subscribe((r) => {
      this.clientes.set(r.data);
      this.total.set(r.pagination.total);
    });
  }

  cargarZonas() {
    this.service.porZona().subscribe((r) => this.porZona.set(r.data));
  }

  filtrarZona(z: string) {
    this.zonaFiltro.set(this.zonaFiltro() === z ? '' : z);
    this.cargar(1);
  }

  abrirNuevo() {
    this.form = { nombre: '', tipo_lista: 'REVENDEDOR', zona: '', localidad: '', telefono: '', cuit: '', vendedor_id: null };
    this.mostrarNuevo.set(true);
  }

  guardar() {
    this.saving.set(true);
    const body: Record<string, unknown> = { ...this.form };
    Object.keys(body).forEach((k) => (body[k] === '' || body[k] === null) && delete body[k]);
    this.service.crear(body).subscribe({
      next: () => {
        this.toast.success('Cliente creado');
        this.saving.set(false);
        this.mostrarNuevo.set(false);
        this.cargar(1);
        this.cargarZonas();
      },
      error: () => this.saving.set(false),
    });
  }

  listaLabel(t: string) {
    return { MAYORISTA: 'Mayorista', REVENDEDOR: 'Revendedor', COMERCIO: 'Comercio', PUBLICO: 'Público' }[t] ?? t;
  }
  listaClase(t: string) {
    return { MAYORISTA: 'badge-info', REVENDEDOR: 'badge-neutral', COMERCIO: 'badge-bajo', PUBLICO: 'badge-ok' }[t] ?? 'badge-neutral';
  }
}
