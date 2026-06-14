import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { InsumoService } from '../../core/services/insumo.service';
import { InsumoListItem } from '../../core/models/insumo.model';

export interface MovimientoDialogData {
  tipo: 'ingreso' | 'egreso';
  insumo: InsumoListItem;
}

@Component({
  selector: 'app-movimiento-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar egreso' }} —
      {{ data.insumo.nombre }}
    </h2>
    <mat-dialog-content>
      <p class="stock-actual">
        Stock actual: <strong>{{ data.insumo.stock_actual }} {{ data.insumo.unidad_medida }}</strong>
      </p>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cantidad ({{ data.insumo.unidad_medida }})</mat-label>
          <input matInput type="number" formControlName="cantidad" min="0" />
        </mat-form-field>

        @if (data.tipo === 'ingreso') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Precio unitario (opcional)</mat-label>
            <input matInput type="number" formControlName="precio_unitario" min="0" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Proveedor</mat-label>
            <input matInput formControlName="proveedor" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>N° de lote</mat-label>
            <input matInput formControlName="numero_lote" />
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo</mat-label>
            <mat-select formControlName="motivo">
              <mat-option value="PRODUCCION">Producción</mat-option>
              <mat-option value="PERDIDA">Pérdida</mat-option>
              <mat-option value="DEVOLUCION">Devolución</mat-option>
              <mat-option value="AJUSTE">Ajuste</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones</mat-label>
          <textarea matInput formControlName="observaciones" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || saving()"
        (click)="guardar()"
      >
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form { display: flex; flex-direction: column; min-width: 360px; }
    .stock-actual { color: #555; margin: 0 0 12px; }
  `,
})
export class MovimientoDialog {
  private fb = inject(FormBuilder);
  private service = inject(InsumoService);
  readonly ref = inject(MatDialogRef<MovimientoDialog>);
  readonly data = inject<MovimientoDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  form = this.fb.nonNullable.group({
    cantidad: [null as number | null, [Validators.required, Validators.min(0.001)]],
    precio_unitario: [null as number | null],
    proveedor: [''],
    numero_lote: [''],
    motivo: ['PRODUCCION'],
    observaciones: [''],
  });

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.data.insumo.id;

    const obs$ =
      this.data.tipo === 'ingreso'
        ? this.service.ingreso(id, {
            cantidad: v.cantidad!,
            precio_unitario: v.precio_unitario ?? undefined,
            proveedor: v.proveedor || undefined,
            numero_lote: v.numero_lote || undefined,
            observaciones: v.observaciones || undefined,
          })
        : this.service.egreso(id, {
            cantidad: v.cantidad!,
            motivo: v.motivo,
            observaciones: v.observaciones || undefined,
          });

    obs$.subscribe({
      next: () => this.ref.close(true),
      error: () => this.saving.set(false),
    });
  }
}
