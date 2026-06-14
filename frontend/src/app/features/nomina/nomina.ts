import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NominaService,
  EmpleadoListItem,
  NominaListItem,
  Aporte,
  Recibo,
} from '../../core/services/nomina.service';
import { ToastService } from '../../shared/ui/toast.service';
import { DescargasService } from '../../core/services/descargas.service';
import { Modal } from '../../shared/ui/modal';

type Tab = 'liquidaciones' | 'empleados' | 'aportes';

@Component({
  selector: 'app-nomina',
  imports: [DecimalPipe, DatePipe, FormsModule, Modal],
  template: `
    <h2 class="page-title">Nómina</h2>
    <p class="page-subtitle">Empleados, liquidaciones de sueldo y aportes.</p>

    <!-- Tabs -->
    <div class="mb-5 overflow-x-auto">
      <div class="tabs">
        @for (t of tabs; track t.id) {
          <button class="tab" [class.tab-active]="tab() === t.id" (click)="tab.set(t.id)">
            {{ t.label }}
          </button>
        }
      </div>
    </div>

    <!-- LIQUIDACIONES -->
    @if (tab() === 'liquidaciones') {
      <div class="mb-4 flex justify-end">
        <button class="btn btn-primary" (click)="mostrarProcesar.set(true)">
          <span class="material-icons text-[20px]">calculate</span> Procesar nómina
        </button>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead><tr><th>N° nómina</th><th>Período</th><th>Empleados</th><th class="text-right">Neto total</th><th>Estado</th><th class="text-right">Recibos</th></tr></thead>
            <tbody>
              @for (n of nominas(); track n.nomina_id) {
                <tr>
                  <td class="font-mono text-xs text-slate-500">{{ n.numero_nomina }}</td>
                  <td class="font-medium text-slate-800">{{ n.periodo }}</td>
                  <td>{{ n.cantidad_empleados }}</td>
                  <td class="text-right tabular-nums">\${{ n.total_neto | number: '1.0-2' }}</td>
                  <td><span class="badge badge-ok">{{ n.estado }}</span></td>
                  <td class="text-right">
                    <button class="btn btn-soft px-3 py-1.5 text-xs" (click)="verRecibos(n)">
                      <span class="material-icons text-[16px]">receipt_long</span> Ver
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (nominas().length === 0) {
          <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">payments</span><p>No hay liquidaciones procesadas.</p></div>
        }
      </div>
    }

    <!-- EMPLEADOS -->
    @if (tab() === 'empleados') {
      <div class="mb-4 flex justify-end">
        <button class="btn btn-primary" (click)="abrirNuevoEmpleado()">
          <span class="material-icons text-[20px]">person_add</span> Nuevo empleado
        </button>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead><tr><th>DNI</th><th>Nombre</th><th>Puesto</th><th>Antigüedad</th><th class="text-right">Sueldo básico</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (e of empleados(); track e.id) {
                <tr>
                  <td class="font-mono text-xs text-slate-500">{{ e.dni }}</td>
                  <td class="font-medium text-slate-800">{{ e.nombre }} {{ e.apellido }}</td>
                  <td>{{ e.puesto }}</td>
                  <td>{{ e.antiguedad_anos }} años</td>
                  <td class="text-right tabular-nums">{{ e.estructura_salarial_actual ? '$' + (e.estructura_salarial_actual.sueldo_basico | number: '1.0-0') : '—' }}</td>
                  <td><span class="badge badge-ok">{{ e.estado }}</span></td>
                  <td class="text-right">
                    <button class="btn-ghost btn-icon rounded-lg" title="Estructura salarial" (click)="abrirEstructura(e)">
                      <span class="material-icons text-[20px]">attach_money</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (empleados().length === 0) {
          <div class="p-12 text-center text-slate-400"><span class="material-icons mb-2 text-4xl">groups</span><p>Sin empleados.</p></div>
        }
      </div>
    }

    <!-- APORTES -->
    @if (tab() === 'aportes') {
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead><tr><th>Concepto</th><th>Tipo</th><th>Vigente desde</th><th class="text-right">Porcentaje</th><th></th></tr></thead>
            <tbody>
              @for (a of aportes(); track a.id) {
                <tr>
                  <td class="font-medium text-slate-800">{{ a.nombre }}</td>
                  <td><span class="badge badge-neutral">{{ a.tipo }}</span></td>
                  <td>{{ a.vigente_desde | date: 'dd/MM/yyyy' }}</td>
                  <td class="text-right">
                    @if (editandoAporte() === a.id) {
                      <input class="input w-24 text-right" type="number" step="any" [(ngModel)]="nuevoPorcentaje" />
                    } @else {
                      <span class="tabular-nums font-semibold">{{ a.porcentaje }}%</span>
                    }
                  </td>
                  <td class="text-right">
                    @if (editandoAporte() === a.id) {
                      <button class="btn-ghost btn-icon rounded-lg text-emerald-600" (click)="guardarAporte(a)"><span class="material-icons text-[20px]">check</span></button>
                      <button class="btn-ghost btn-icon rounded-lg" (click)="editandoAporte.set(null)"><span class="material-icons text-[20px]">close</span></button>
                    } @else {
                      <button class="btn-ghost btn-icon rounded-lg" (click)="editarAporte(a)"><span class="material-icons text-[20px]">edit</span></button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Modal procesar -->
    @if (mostrarProcesar()) {
      <app-modal title="Procesar nómina mensual" (closed)="mostrarProcesar.set(false)">
        <p class="mb-4 text-sm text-slate-500">Se generarán los recibos de todos los empleados activos con estructura salarial vigente.</p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Mes</label>
            <select class="select" [(ngModel)]="mes">
              @for (m of meses; track m.v) { <option [ngValue]="m.v">{{ m.n }}</option> }
            </select>
          </div>
          <div><label class="label">Año</label><input class="input" type="number" [(ngModel)]="anio" /></div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarProcesar.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="procesar()">Procesar</button>
        </div>
      </app-modal>
    }

    <!-- Modal recibos -->
    @if (reciboNomina(); as n) {
      <app-modal [title]="'Recibos — ' + n.periodo" [wide]="true" (closed)="reciboNomina.set(null)">
        <div class="overflow-x-auto">
          <table class="table">
            <thead><tr><th>Empleado</th><th class="text-right">Haberes</th><th class="text-right">Descuentos</th><th class="text-right">Neto</th><th class="text-right">Costo empresa</th><th></th></tr></thead>
            <tbody>
              @for (r of recibos(); track r.recibo_id) {
                <tr>
                  <td class="font-medium text-slate-800">{{ r.empleado }}</td>
                  <td class="text-right tabular-nums">\${{ r.total_haberes | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums text-rose-600">-\${{ r.total_descuentos | number: '1.0-2' }}</td>
                  <td class="text-right font-semibold tabular-nums">\${{ r.neto_a_pagar | number: '1.0-2' }}</td>
                  <td class="text-right tabular-nums text-slate-500">\${{ r.costo_total_empleado | number: '1.0-2' }}</td>
                  <td class="text-right">
                    <button class="btn-ghost btn-icon" title="Recibo PDF" (click)="descargarRecibo(r)">
                      <span class="material-icons text-[20px]">picture_as_pdf</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div modal-footer>
          <button class="btn btn-outline" (click)="exportarNomina(n)">
            <span class="material-icons text-[20px]">download</span> Excel
          </button>
          <button class="btn btn-primary" (click)="reciboNomina.set(null)">Cerrar</button>
        </div>
      </app-modal>
    }

    <!-- Modal nuevo empleado -->
    @if (mostrarEmpleado()) {
      <app-modal title="Nuevo empleado" [wide]="true" (closed)="mostrarEmpleado.set(false)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label class="label">DNI</label><input class="input" [(ngModel)]="empForm.dni" /></div>
          <div><label class="label">CUIT</label><input class="input" [(ngModel)]="empForm.cuit" /></div>
          <div><label class="label">Nombre</label><input class="input" [(ngModel)]="empForm.nombre" /></div>
          <div><label class="label">Apellido</label><input class="input" [(ngModel)]="empForm.apellido" /></div>
          <div><label class="label">Puesto</label><input class="input" [(ngModel)]="empForm.puesto" /></div>
          <div><label class="label">Departamento</label><input class="input" [(ngModel)]="empForm.departamento" /></div>
          <div><label class="label">Fecha de ingreso</label><input class="input" type="date" [(ngModel)]="empForm.fecha_ingreso" /></div>
          <div><label class="label">Email</label><input class="input" [(ngModel)]="empForm.email" /></div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="mostrarEmpleado.set(false)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="guardarEmpleado()">Crear</button>
        </div>
      </app-modal>
    }

    <!-- Modal estructura salarial -->
    @if (estructuraEmpleado(); as emp) {
      <app-modal [title]="'Estructura salarial — ' + emp.nombre + ' ' + emp.apellido" (closed)="estructuraEmpleado.set(null)">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label class="label">Sueldo básico</label><input class="input" type="number" [(ngModel)]="estForm.sueldo_basico" /></div>
          <div><label class="label">Tarifa horaria</label><input class="input" type="number" [(ngModel)]="estForm.tarifa_horaria" /></div>
          <div><label class="label">Bono fijo</label><input class="input" type="number" [(ngModel)]="estForm.bono_fijo" /></div>
          <div><label class="label">Vigente desde</label><input class="input" type="date" [(ngModel)]="estForm.fecha_inicio" /></div>
        </div>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="estructuraEmpleado.set(null)">Cancelar</button>
          <button class="btn btn-primary" [disabled]="saving()" (click)="guardarEstructura()">Guardar</button>
        </div>
      </app-modal>
    }
  `,
})
export class Nomina implements OnInit {
  private service = inject(NominaService);
  private descargas = inject(DescargasService);
  private toast = inject(ToastService);

  readonly tabs = [
    { id: 'liquidaciones' as Tab, label: 'Liquidaciones' },
    { id: 'empleados' as Tab, label: 'Empleados' },
    { id: 'aportes' as Tab, label: 'Aportes' },
  ];
  readonly tab = signal<Tab>('liquidaciones');
  readonly saving = signal(false);

  readonly nominas = signal<NominaListItem[]>([]);
  readonly empleados = signal<EmpleadoListItem[]>([]);
  readonly aportes = signal<Aporte[]>([]);
  readonly recibos = signal<Recibo[]>([]);

  readonly mostrarProcesar = signal(false);
  readonly reciboNomina = signal<NominaListItem | null>(null);
  readonly mostrarEmpleado = signal(false);
  readonly estructuraEmpleado = signal<EmpleadoListItem | null>(null);
  readonly editandoAporte = signal<number | null>(null);

  readonly meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' }, { v: 4, n: 'Abril' },
    { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' }, { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' },
    { v: 9, n: 'Septiembre' }, { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' },
  ];
  mes = new Date().getMonth() + 1;
  anio = new Date().getFullYear();
  nuevoPorcentaje = 0;

  empForm = { dni: '', cuit: '', nombre: '', apellido: '', puesto: '', departamento: '', fecha_ingreso: '', email: '' };
  estForm = { sueldo_basico: 0, tarifa_horaria: 0, bono_fijo: 0, fecha_inicio: new Date().toISOString().slice(0, 10) };

  ngOnInit() {
    this.cargarNominas();
    this.cargarEmpleados();
    this.service.aportes().subscribe((res) => this.aportes.set(res.data));
  }

  cargarNominas() {
    this.service.listarNominas(1, 20).subscribe((res) => this.nominas.set(res.data));
  }
  cargarEmpleados() {
    this.service.empleados(1, 50).subscribe((res) => this.empleados.set(res.data));
  }

  procesar() {
    this.saving.set(true);
    this.service.procesar(this.mes, this.anio).subscribe({
      next: () => {
        this.toast.success('Nómina procesada');
        this.saving.set(false);
        this.mostrarProcesar.set(false);
        this.cargarNominas();
      },
      error: () => this.saving.set(false),
    });
  }

  verRecibos(n: NominaListItem) {
    this.reciboNomina.set(n);
    this.service.recibos(n.nomina_id).subscribe((res) => this.recibos.set(res.data));
  }

  descargarRecibo(r: Recibo) {
    this.descargas.descargar(`/nomina/recibos/${r.recibo_id}/pdf`, `${r.numero_recibo}.pdf`);
  }

  exportarNomina(n: NominaListItem) {
    this.descargas.descargar(`/nomina/${n.nomina_id}/excel`, `nomina-${n.periodo.replace('/', '-')}.xlsx`);
  }

  abrirNuevoEmpleado() {
    this.empForm = { dni: '', cuit: '', nombre: '', apellido: '', puesto: '', departamento: '', fecha_ingreso: '', email: '' };
    this.mostrarEmpleado.set(true);
  }

  guardarEmpleado() {
    this.saving.set(true);
    const body: Record<string, unknown> = { ...this.empForm };
    if (!body['email']) delete body['email'];
    this.service.crearEmpleado(body).subscribe({
      next: () => {
        this.toast.success('Empleado creado');
        this.saving.set(false);
        this.mostrarEmpleado.set(false);
        this.cargarEmpleados();
      },
      error: () => this.saving.set(false),
    });
  }

  abrirEstructura(e: EmpleadoListItem) {
    this.estForm = {
      sueldo_basico: e.estructura_salarial_actual ? Number(e.estructura_salarial_actual.sueldo_basico) : 0,
      tarifa_horaria: 0,
      bono_fijo: 0,
      fecha_inicio: new Date().toISOString().slice(0, 10),
    };
    this.estructuraEmpleado.set(e);
  }

  guardarEstructura() {
    const e = this.estructuraEmpleado();
    if (!e) return;
    this.saving.set(true);
    this.service.configurarEstructura(e.id, this.estForm).subscribe({
      next: () => {
        this.toast.success('Estructura salarial actualizada');
        this.saving.set(false);
        this.estructuraEmpleado.set(null);
        this.cargarEmpleados();
      },
      error: () => this.saving.set(false),
    });
  }

  editarAporte(a: Aporte) {
    this.editandoAporte.set(a.id);
    this.nuevoPorcentaje = Number(a.porcentaje);
  }

  guardarAporte(a: Aporte) {
    this.service.actualizarAporte(a.id, Number(this.nuevoPorcentaje)).subscribe(() => {
      this.toast.success('Aporte actualizado');
      this.editandoAporte.set(null);
      this.service.aportes().subscribe((res) => this.aportes.set(res.data));
    });
  }
}
