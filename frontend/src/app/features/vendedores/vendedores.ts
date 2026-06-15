import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VendedoresService, VendedorItem, CrearVendedor } from '../../core/services/vendedores.service';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';

@Component({
  selector: 'app-vendedores',
  imports: [FormsModule, Modal],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Vendedores</h2>
        <p class="text-sm text-slate-500">Vendedores asignables a clientes y ventas.</p>
      </div>
      <button class="btn btn-primary" (click)="abrirNuevo()">
        <span class="material-icons text-[20px]">person_add</span> Nuevo vendedor
      </button>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Zona</th>
              <th>Teléfono</th>
              <th>Clientes</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (v of vendedores(); track v.id) {
              <tr>
                <td class="font-medium text-slate-800">{{ v.nombre }}</td>
                <td class="text-slate-600">{{ v.zona || '—' }}</td>
                <td class="text-slate-600">{{ v.telefono || '—' }}</td>
                <td class="text-slate-600">{{ v.clientes }}</td>
                <td>
                  <span class="badge" [class]="v.activo ? 'badge-ok' : 'badge-critico'">{{ v.activo ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <button class="btn-ghost btn-icon" title="Editar" (click)="abrirEditar(v)">
                      <span class="material-icons text-[20px]">edit</span>
                    </button>
                    <button
                      class="btn-ghost btn-icon"
                      [class.text-rose-600]="v.activo"
                      [class.text-emerald-600]="!v.activo"
                      [title]="v.activo ? 'Desactivar' : 'Activar'"
                      (click)="toggleActivo(v)"
                    >
                      <span class="material-icons text-[20px]">{{ v.activo ? 'block' : 'check_circle' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (vendedores().length === 0) {
        <div class="p-12 text-center text-slate-400">
          <span class="material-icons mb-2 text-4xl">groups</span>
          <p>Sin vendedores.</p>
        </div>
      }
    </div>

    <!-- Nuevo vendedor -->
    @if (mostrarNuevo()) {
      <app-modal title="Nuevo vendedor" (closed)="mostrarNuevo.set(false)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label">Nombre</label>
            <input class="input" [(ngModel)]="form.nombre" placeholder="ej.: Juan Pérez" />
          </div>
          <div>
            <label class="label">Zona</label>
            <input class="input" [(ngModel)]="form.zona" placeholder="opcional" />
          </div>
          <div>
            <label class="label">Teléfono</label>
            <input class="input" [(ngModel)]="form.telefono" placeholder="opcional" />
          </div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarNuevo.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!form.nombre.trim() || saving()" (click)="guardarNuevo()">Crear vendedor</button>
        </div>
      </app-modal>
    }

    <!-- Editar vendedor -->
    @if (editando(); as v) {
      <app-modal [title]="'Editar ' + v.nombre" (closed)="editando.set(null)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label">Nombre</label>
            <input class="input" [(ngModel)]="editForm.nombre" />
          </div>
          <div>
            <label class="label">Zona</label>
            <input class="input" [(ngModel)]="editForm.zona" />
          </div>
          <div>
            <label class="label">Teléfono</label>
            <input class="input" [(ngModel)]="editForm.telefono" />
          </div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editando.set(null)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!editForm.nombre.trim() || saving()" (click)="guardarEdicion()">Guardar cambios</button>
        </div>
      </app-modal>
    }
  `,
})
export class Vendedores implements OnInit {
  private service = inject(VendedoresService);
  private toast = inject(ToastService);

  readonly vendedores = signal<VendedorItem[]>([]);
  readonly saving = signal(false);

  readonly mostrarNuevo = signal(false);
  readonly editando = signal<VendedorItem | null>(null);

  form: CrearVendedor = { nombre: '', zona: '', telefono: '' };
  editForm: CrearVendedor = { nombre: '', zona: '', telefono: '' };

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.service.listar(false).subscribe((r) => this.vendedores.set(r.data));
  }

  abrirNuevo() {
    this.form = { nombre: '', zona: '', telefono: '' };
    this.mostrarNuevo.set(true);
  }

  guardarNuevo() {
    if (!this.form.nombre.trim()) return;
    this.saving.set(true);
    this.service
      .crear({ nombre: this.form.nombre.trim(), zona: this.form.zona?.trim() || undefined, telefono: this.form.telefono?.trim() || undefined })
      .subscribe({
        next: () => {
          this.toast.success('Vendedor creado');
          this.saving.set(false);
          this.mostrarNuevo.set(false);
          this.cargar();
        },
        error: () => this.saving.set(false),
      });
  }

  abrirEditar(v: VendedorItem) {
    this.editForm = { nombre: v.nombre, zona: v.zona ?? '', telefono: v.telefono ?? '' };
    this.editando.set(v);
  }

  guardarEdicion() {
    const v = this.editando();
    if (!v || !this.editForm.nombre.trim()) return;
    this.saving.set(true);
    this.service
      .actualizar(v.id, { nombre: this.editForm.nombre.trim(), zona: this.editForm.zona?.trim() || undefined, telefono: this.editForm.telefono?.trim() || undefined })
      .subscribe({
        next: () => {
          this.toast.success('Vendedor actualizado');
          this.saving.set(false);
          this.editando.set(null);
          this.cargar();
        },
        error: () => this.saving.set(false),
      });
  }

  toggleActivo(v: VendedorItem) {
    this.service.actualizar(v.id, { activo: !v.activo }).subscribe({
      next: () => {
        this.toast.success(v.activo ? 'Vendedor desactivado' : 'Vendedor activado');
        this.cargar();
      },
    });
  }
}
