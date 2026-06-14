import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime } from 'rxjs';
import { InsumoService } from '../../core/services/insumo.service';
import { AuthService } from '../../core/services/auth.service';
import { InsumoListItem } from '../../core/models/insumo.model';
import { MovimientoDialog } from './movimiento-dialog';
import { InsumoFormDialog } from './insumo-form-dialog';

@Component({
  selector: 'app-inventario',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  templateUrl: './inventario.html',
  styleUrl: './inventario.scss',
})
export class Inventario implements OnInit {
  private service = inject(InsumoService);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);

  readonly columnas = [
    'codigo',
    'nombre',
    'categoria',
    'stock_actual',
    'estado',
    'costo_actual',
    'acciones',
  ];

  readonly insumos = signal<InsumoListItem[]>([]);
  readonly categorias = signal<string[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly limit = signal(10);
  readonly soloStockBajo = signal(false);

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly categoriaCtrl = new FormControl('', { nonNullable: true });

  readonly puedeEditar = computed(() => this.auth.hasRole('GERENTE'));
  readonly puedeMover = computed(() => this.auth.hasRole('GERENTE', 'OPERARIO'));

  ngOnInit() {
    this.cargar();
    this.service.categorias().subscribe((res) => this.categorias.set(res.data));

    this.searchCtrl.valueChanges.pipe(debounceTime(350)).subscribe(() => {
      this.page.set(0);
      this.cargar();
    });
    this.categoriaCtrl.valueChanges.subscribe(() => {
      this.page.set(0);
      this.cargar();
    });
  }

  cargar() {
    this.loading.set(true);
    this.service
      .listar({
        page: this.page() + 1,
        limit: this.limit(),
        search: this.searchCtrl.value || undefined,
        categoria: this.categoriaCtrl.value || undefined,
        stock_bajo: this.soloStockBajo() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.insumos.set(res.data);
          this.total.set(res.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex);
    this.limit.set(e.pageSize);
    this.cargar();
  }

  toggleStockBajo() {
    this.soloStockBajo.update((v) => !v);
    this.page.set(0);
    this.cargar();
  }

  abrirMovimiento(insumo: InsumoListItem, tipo: 'ingreso' | 'egreso') {
    this.dialog
      .open(MovimientoDialog, { data: { insumo, tipo } })
      .afterClosed()
      .subscribe((ok) => ok && this.cargar());
  }

  nuevoInsumo() {
    this.dialog
      .open(InsumoFormDialog)
      .afterClosed()
      .subscribe((ok) => ok && this.cargar());
  }
}
