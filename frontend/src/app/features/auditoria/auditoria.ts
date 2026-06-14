import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, LogItem, LogDetalle } from '../../core/services/auditoria.service';
import { Modal } from '../../shared/ui/modal';
import { Paginator } from '../../shared/ui/paginator';

@Component({
  selector: 'app-auditoria',
  imports: [DatePipe, JsonPipe, FormsModule, Modal, Paginator],
  template: `
    <h2 class="page-title">Auditoría</h2>
    <p class="page-subtitle">Trazabilidad de todas las operaciones del sistema.</p>

    <div class="card mb-4 flex flex-wrap items-center gap-3 p-3">
      <select class="select w-44" [(ngModel)]="modulo" (ngModelChange)="cargar(1)">
        <option value="">Todos los módulos</option>
        <option value="inventario">Inventario</option>
        <option value="produccion">Producción</option>
        <option value="ventas">Ventas</option>
        <option value="nomina">Nómina</option>
        <option value="seguridad">Seguridad</option>
      </select>
      <select class="select w-44" [(ngModel)]="accion" (ngModelChange)="cargar(1)">
        <option value="">Todas las acciones</option>
        <option value="CREAR">Crear</option>
        <option value="EDITAR">Editar</option>
        <option value="ANULAR">Anular</option>
        <option value="LOGIN">Login</option>
      </select>
    </div>

    <div class="card overflow-hidden">
      <table class="table">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Tabla</th><th class="text-right"></th></tr></thead>
        <tbody>
          @for (l of logs(); track l.id) {
            <tr class="cursor-pointer" (click)="ver(l)">
              <td class="whitespace-nowrap text-slate-600">{{ l.fecha | date: 'dd/MM/yy HH:mm' }}</td>
              <td class="font-medium text-slate-800">{{ l.usuario || '—' }}</td>
              <td><span class="badge" [class]="accionClase(l.accion)">{{ l.accion }}</span></td>
              <td>{{ l.modulo }}</td>
              <td class="font-mono text-xs text-slate-500">{{ l.tabla || '—' }}</td>
              <td class="text-right"><span class="material-icons text-[18px] text-slate-400">chevron_right</span></td>
            </tr>
          }
        </tbody>
      </table>
      @if (logs().length === 0) {
        <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">fact_check</span><p>Sin registros de auditoría.</p></div>
      }
      <app-paginator [page]="page()" [limit]="15" [total]="total()" (pageChange)="cargar($event)" />
    </div>

    @if (detalle(); as d) {
      <app-modal [title]="'Registro #' + d.id" [wide]="true" (closed)="detalle.set(null)">
        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div><dt class="text-slate-500">Usuario</dt><dd class="font-medium">{{ d.usuario || '—' }}</dd></div>
          <div><dt class="text-slate-500">Fecha</dt><dd class="font-medium">{{ d.fecha | date: 'dd/MM/yyyy HH:mm:ss' }}</dd></div>
          <div><dt class="text-slate-500">Acción</dt><dd><span class="badge" [class]="accionClase(d.accion)">{{ d.accion }}</span></dd></div>
          <div><dt class="text-slate-500">Módulo / tabla</dt><dd class="font-medium">{{ d.modulo }} / {{ d.tabla || '—' }}</dd></div>
          <div><dt class="text-slate-500">IP origen</dt><dd class="font-mono text-xs">{{ d.ip_origen || '—' }}</dd></div>
          <div><dt class="text-slate-500">Registro ID</dt><dd class="font-mono text-xs">{{ d.registro_id ?? '—' }}</dd></div>
        </dl>
        @if (d.valores_anteriores || d.valores_nuevos) {
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p class="mb-1 text-xs font-semibold text-slate-500">Valores anteriores</p>
              <pre class="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs">{{ d.valores_anteriores | json }}</pre>
            </div>
            <div>
              <p class="mb-1 text-xs font-semibold text-slate-500">Valores nuevos</p>
              <pre class="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs">{{ d.valores_nuevos | json }}</pre>
            </div>
          </div>
        }
        <div modal-footer><button class="btn btn-primary" (click)="detalle.set(null)">Cerrar</button></div>
      </app-modal>
    }
  `,
})
export class Auditoria implements OnInit {
  private service = inject(AuditoriaService);

  readonly logs = signal<LogItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly detalle = signal<LogDetalle | null>(null);
  modulo = '';
  accion = '';

  ngOnInit() {
    this.cargar(1);
  }

  cargar(p: number) {
    this.page.set(p);
    this.service.logs(p, 15, { modulo: this.modulo || undefined, accion: this.accion || undefined }).subscribe((res) => {
      this.logs.set(res.data);
      this.total.set(res.pagination.total);
    });
  }

  ver(l: LogItem) {
    this.service.obtener(l.id).subscribe((res) => this.detalle.set(res.data));
  }

  accionClase(accion: string) {
    return {
      CREAR: 'badge-ok',
      EDITAR: 'badge-info',
      ANULAR: 'badge-critico',
      LOGIN: 'badge-neutral',
      LOGOUT: 'badge-neutral',
    }[accion] ?? 'badge-neutral';
  }
}
