import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { InsumoService } from '../../core/services/insumo.service';

@Component({
  selector: 'app-insumo-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo insumo</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <input matInput formControlName="categoria" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Unidad de medida</mat-label>
          <mat-select formControlName="unidad_medida">
            <mat-option value="kg">kg</mat-option>
            <mat-option value="litros">litros</mat-option>
            <mat-option value="unidades">unidades</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio unitario</mat-label>
          <input matInput type="number" formControlName="precio_unitario" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Stock mínimo</mat-label>
          <input matInput type="number" formControlName="stock_minimo" min="0" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Stock crítico</mat-label>
          <input matInput type="number" formControlName="stock_critico" min="0" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || saving()" (click)="guardar()">
        Crear
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      min-width: 480px;
    }
  `,
})
export class InsumoFormDialog {
  private fb = inject(FormBuilder);
  private service = inject(InsumoService);
  readonly ref = inject(MatDialogRef<InsumoFormDialog>);

  readonly saving = signal(false);

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    categoria: ['general', Validators.required],
    unidad_medida: ['kg', Validators.required],
    precio_unitario: [0, [Validators.required, Validators.min(0)]],
    stock_minimo: [0, Validators.min(0)],
    stock_critico: [0, Validators.min(0)],
  });

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.service.crear(this.form.getRawValue()).subscribe({
      next: () => this.ref.close(true),
      error: () => this.saving.set(false),
    });
  }
}
