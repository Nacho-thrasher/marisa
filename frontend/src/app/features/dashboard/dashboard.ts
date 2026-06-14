import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { InsumoService } from '../../core/services/insumo.service';
import { ResumenStock } from '../../core/models/insumo.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private insumos = inject(InsumoService);
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly resumen = signal<ResumenStock | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    if (this.auth.hasRole('GERENTE', 'OPERARIO')) {
      this.insumos.resumenStock().subscribe({
        next: (res) => {
          this.resumen.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }
}
