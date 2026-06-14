import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { InsumoService } from './insumo.service';
import { ProduccionService } from './produccion.service';

export interface Notificacion {
  id: string;
  titulo: string;
  detalle: string;
  icon: string;
  chip: string;
  route: string;
}

/**
 * Agrega "novedades" reales del negocio para el panel de notificaciones del header:
 * insumos con stock bajo/crítico y órdenes de producción pendientes.
 * Es role-aware: solo consulta lo que el usuario puede ver.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private auth = inject(AuthService);
  private insumos = inject(InsumoService);
  private prod = inject(ProduccionService);

  private readonly stock = signal<Notificacion[]>([]);
  private readonly ordenes = signal<Notificacion[]>([]);

  readonly items = computed(() => [...this.stock(), ...this.ordenes()]);
  readonly total = computed(() => this.items().length);

  /** Refresca las notificaciones según el rol. Se puede llamar varias veces. */
  cargar() {
    if (!this.auth.hasRole('GERENTE', 'OPERARIO')) {
      this.stock.set([]);
      this.ordenes.set([]);
      return;
    }

    this.insumos.resumenStock().subscribe({
      next: (r) => {
        const alertas = r.data.detalles
          .filter((d) => d.estado !== 'OK')
          .slice(0, 8)
          .map<Notificacion>((d) => ({
            id: `stock-${d.insumo_id}`,
            titulo: d.estado === 'CRITICO' ? `Stock crítico: ${d.nombre}` : `Stock bajo: ${d.nombre}`,
            detalle: `Quedan ${Number(d.cantidad).toLocaleString('es-AR')} en stock`,
            icon: d.estado === 'CRITICO' ? 'error' : 'warning',
            chip: d.estado === 'CRITICO' ? 'chip-rose' : 'chip-amber',
            route: '/inventario',
          }));
        this.stock.set(alertas);
      },
      error: () => this.stock.set([]),
    });

    this.prod.listarOrdenes(1, 50).subscribe({
      next: (r) => {
        const pendientes = r.data.filter((o) => o.estado === 'PLANIFICADA' || o.estado === 'EN_PROCESO');
        const notif: Notificacion[] = [];
        const planificadas = pendientes.filter((o) => o.estado === 'PLANIFICADA').length;
        const enProceso = pendientes.filter((o) => o.estado === 'EN_PROCESO').length;
        if (enProceso > 0) {
          notif.push({
            id: 'ord-proceso',
            titulo: `${enProceso} orden${enProceso > 1 ? 'es' : ''} en proceso`,
            detalle: 'Pendientes de completar producción',
            icon: 'precision_manufacturing',
            chip: 'chip-blue',
            route: '/produccion',
          });
        }
        if (planificadas > 0) {
          notif.push({
            id: 'ord-plan',
            titulo: `${planificadas} orden${planificadas > 1 ? 'es' : ''} planificada${planificadas > 1 ? 's' : ''}`,
            detalle: 'Listas para iniciar',
            icon: 'event_available',
            chip: 'chip-violet',
            route: '/produccion',
          });
        }
        this.ordenes.set(notif);
      },
      error: () => this.ordenes.set([]),
    });
  }
}
