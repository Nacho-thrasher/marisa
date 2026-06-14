import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly opened = signal(true);

  private readonly allItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Inventario', icon: 'inventory_2', route: '/inventario', roles: ['GERENTE', 'OPERARIO'] },
    { label: 'Producción', icon: 'precision_manufacturing', route: '/produccion', roles: ['GERENTE', 'OPERARIO'] },
    { label: 'Ventas', icon: 'point_of_sale', route: '/ventas', roles: ['GERENTE'] },
    { label: 'Nómina', icon: 'groups', route: '/nomina', roles: ['RRHH'] },
    { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', roles: ['CONTADOR'] },
  ];

  readonly items = computed(() =>
    this.allItems.filter((i) => !i.roles || this.auth.hasRole(...i.roles)),
  );

  toggle() {
    this.opened.update((v) => !v);
  }

  logout() {
    this.auth.logout();
  }
}
