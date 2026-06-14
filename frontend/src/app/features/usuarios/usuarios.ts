import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, UsuarioItem, CrearUsuario } from '../../core/services/usuarios.service';
import { Rol } from '../../core/models/auth.model';
import { ToastService } from '../../shared/ui/toast.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

const ROLES: { v: Rol; label: string; clase: string }[] = [
  { v: 'ADMIN', label: 'Administrador', clase: 'badge-critico' },
  { v: 'GERENTE', label: 'Gerente', clase: 'badge-info' },
  { v: 'OPERARIO', label: 'Operario', clase: 'badge-neutral' },
  { v: 'RRHH', label: 'RR.HH.', clase: 'badge-bajo' },
  { v: 'CONTADOR', label: 'Contador', clase: 'badge-ok' },
];

@Component({
  selector: 'app-usuarios',
  imports: [DatePipe, FormsModule, Modal, Paginator],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="page-title">Usuarios</h2>
        <p class="text-sm text-slate-500">Acceso al sistema y roles. Solo administradores.</p>
      </div>
      <button class="btn btn-primary" (click)="abrirNuevo()">
        <span class="material-icons text-[20px]">person_add</span> Nuevo usuario
      </button>
    </div>

    <div class="card mb-4 flex flex-wrap items-center gap-3 p-3">
      <div class="search min-w-64 flex-1">
        <span class="material-icons">search</span>
        <input class="input" [(ngModel)]="search" (ngModelChange)="cargar(1)" placeholder="Buscar usuario o email…" />
      </div>
      <select class="select w-44" [(ngModel)]="rolFiltro" (ngModelChange)="cargar(1)">
        <option value="">Todos los roles</option>
        @for (r of roles; track r.v) { <option [value]="r.v">{{ r.label }}</option> }
      </select>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Último ingreso</th><th class="text-right">Acciones</th></tr></thead>
          <tbody>
            @for (u of usuarios(); track u.id) {
              <tr>
                <td class="font-medium text-slate-800">{{ u.username }}</td>
                <td class="text-slate-600">{{ u.email }}</td>
                <td><span class="badge" [class]="rolClase(u.rol)">{{ rolLabel(u.rol) }}</span></td>
                <td>
                  <span class="badge" [class]="u.activo ? 'badge-ok' : 'badge-critico'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="whitespace-nowrap text-slate-500">{{ u.ultimo_login ? (u.ultimo_login | date: 'dd/MM/yy HH:mm') : '—' }}</td>
                <td>
                  <div class="flex items-center justify-end gap-1">
                    <button class="btn-ghost btn-icon" title="Editar" (click)="abrirEditar(u)">
                      <span class="material-icons text-[20px]">edit</span>
                    </button>
                    <button class="btn-ghost btn-icon" title="Restablecer contraseña" (click)="abrirReset(u)">
                      <span class="material-icons text-[20px]">lock_reset</span>
                    </button>
                    <button
                      class="btn-ghost btn-icon"
                      [class.text-rose-600]="u.activo"
                      [class.text-emerald-600]="!u.activo"
                      [title]="u.activo ? 'Desactivar' : 'Activar'"
                      (click)="toggleActivo(u)"
                    >
                      <span class="material-icons text-[20px]">{{ u.activo ? 'block' : 'check_circle' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (usuarios().length === 0) {
        <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">group</span><p>Sin usuarios.</p></div>
      }
      <app-paginator [page]="page()" [limit]="20" [total]="total()" (pageChange)="cargar($event)" />
    </div>

    <!-- Nuevo usuario -->
    @if (mostrarNuevo()) {
      <app-modal title="Nuevo usuario" (closed)="mostrarNuevo.set(false)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label class="label">Usuario</label><input class="input" [(ngModel)]="form.username" placeholder="ej.: jperez" /></div>
          <div><label class="label">Email</label><input class="input" type="email" [(ngModel)]="form.email" /></div>
          <div>
            <label class="label">Rol</label>
            <select class="select" [(ngModel)]="form.rol">
              @for (r of roles; track r.v) { <option [value]="r.v">{{ r.label }}</option> }
            </select>
          </div>
          <div><label class="label">Contraseña</label><input class="input" type="text" [(ngModel)]="form.password" placeholder="mín. 6 caracteres" /></div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarNuevo.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="!nuevoValido() || saving()" (click)="guardarNuevo()">Crear usuario</button>
        </div>
      </app-modal>
    }

    <!-- Editar usuario -->
    @if (editando(); as u) {
      <app-modal [title]="'Editar ' + u.username" (closed)="editando.set(null)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label class="label">Email</label><input class="input" type="email" [(ngModel)]="editForm.email" /></div>
          <div>
            <label class="label">Rol</label>
            <select class="select" [(ngModel)]="editForm.rol">
              @for (r of roles; track r.v) { <option [value]="r.v">{{ r.label }}</option> }
            </select>
          </div>
        </div>
        <label class="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" [(ngModel)]="editForm.activo" /> Usuario activo
        </label>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editando.set(null)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="guardarEdicion()">Guardar cambios</button>
        </div>
      </app-modal>
    }

    <!-- Reset password -->
    @if (resetEl(); as u) {
      <app-modal [title]="'Restablecer contraseña — ' + u.username" (closed)="resetEl.set(null)">
        <p class="mb-3 text-sm text-slate-500">Definí una nueva contraseña para este usuario. Deberá cambiarla al ingresar.</p>
        <label class="label">Nueva contraseña</label>
        <input class="input" type="text" [(ngModel)]="nuevaPass" placeholder="mín. 6 caracteres" />
        <div modal-footer>
          <button class="btn btn-ghost" (click)="resetEl.set(null)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="nuevaPass.length < 6 || saving()" (click)="guardarReset()">Restablecer</button>
        </div>
      </app-modal>
    }
  `,
})
export class Usuarios implements OnInit {
  private service = inject(UsuariosService);
  private toast = inject(ToastService);

  readonly roles = ROLES;
  readonly usuarios = signal<UsuarioItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly saving = signal(false);
  search = '';
  rolFiltro = '';

  readonly mostrarNuevo = signal(false);
  readonly editando = signal<UsuarioItem | null>(null);
  readonly resetEl = signal<UsuarioItem | null>(null);

  form: CrearUsuario = { username: '', email: '', password: '', rol: 'OPERARIO' };
  editForm: { email: string; rol: Rol; activo: boolean } = { email: '', rol: 'OPERARIO', activo: true };
  nuevaPass = '';

  ngOnInit() {
    this.cargar(1);
  }

  cargar(p: number) {
    this.page.set(p);
    this.service.listar(p, 20, { search: this.search || undefined, rol: this.rolFiltro || undefined }).subscribe((r) => {
      this.usuarios.set(r.data);
      this.total.set(r.pagination.total);
    });
  }

  abrirNuevo() {
    this.form = { username: '', email: '', password: '', rol: 'OPERARIO' };
    this.mostrarNuevo.set(true);
  }

  nuevoValido() {
    return this.form.username.trim().length >= 3 && /.+@.+\..+/.test(this.form.email) && this.form.password.length >= 6;
  }

  guardarNuevo() {
    this.saving.set(true);
    this.service.crear(this.form).subscribe({
      next: () => {
        this.toast.success('Usuario creado');
        this.saving.set(false);
        this.mostrarNuevo.set(false);
        this.cargar(1);
      },
      error: () => this.saving.set(false),
    });
  }

  abrirEditar(u: UsuarioItem) {
    this.editForm = { email: u.email, rol: u.rol, activo: u.activo };
    this.editando.set(u);
  }

  guardarEdicion() {
    const u = this.editando();
    if (!u) return;
    this.saving.set(true);
    this.service.actualizar(u.id, this.editForm).subscribe({
      next: () => {
        this.toast.success('Usuario actualizado');
        this.saving.set(false);
        this.editando.set(null);
        this.cargar(this.page());
      },
      error: () => this.saving.set(false),
    });
  }

  toggleActivo(u: UsuarioItem) {
    this.service.actualizar(u.id, { activo: !u.activo }).subscribe({
      next: () => {
        this.toast.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
        this.cargar(this.page());
      },
    });
  }

  abrirReset(u: UsuarioItem) {
    this.nuevaPass = '';
    this.resetEl.set(u);
  }

  guardarReset() {
    const u = this.resetEl();
    if (!u) return;
    this.saving.set(true);
    this.service.resetPassword(u.id, this.nuevaPass).subscribe({
      next: () => {
        this.toast.success('Contraseña restablecida');
        this.saving.set(false);
        this.resetEl.set(null);
      },
      error: () => this.saving.set(false),
    });
  }

  rolLabel(r: Rol) {
    return ROLES.find((x) => x.v === r)?.label ?? r;
  }
  rolClase(r: Rol) {
    return ROLES.find((x) => x.v === r)?.clase ?? 'badge-neutral';
  }
}
