import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  section: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-100">
      <!-- Sidebar -->
      <aside
        class="flex flex-col bg-gradient-to-b from-brand-700 to-brand-900 text-brand-100 transition-all duration-200"
        [class.w-64]="opened()"
        [class.w-0]="!opened()"
        [class.overflow-hidden]="!opened()"
      >
        <div class="flex items-center gap-3 px-5 py-5">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <span class="material-icons text-white">factory</span>
          </div>
          <div class="leading-tight">
            <div class="font-bold text-white">Marisa</div>
            <div class="text-xs text-brand-200">Producción & Nómina</div>
          </div>
        </div>

        <nav class="mt-2 flex-1 space-y-4 overflow-y-auto px-3 pb-4">
          @for (sec of secciones(); track sec.nombre) {
            <div>
              <p class="px-3 pb-1 text-[10px] font-semibold tracking-wider text-brand-300 uppercase">
                {{ sec.nombre }}
              </p>
              <div class="space-y-0.5">
                @for (item of sec.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="bg-white/15 text-white shadow-sm"
                    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand-100 transition hover:bg-white/10 hover:text-white"
                  >
                    <span class="material-icons text-[20px]">{{ item.icon }}</span>
                    {{ item.label }}
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <div class="border-t border-white/10 p-3">
          <div class="flex items-center gap-3 rounded-xl px-3 py-2">
            <div class="grid h-9 w-9 place-items-center rounded-md bg-white/20 text-sm font-bold text-white">
              {{ inicial() }}
            </div>
            <div class="min-w-0 flex-1 leading-tight">
              <div class="truncate text-sm font-semibold text-white">{{ user()?.username }}</div>
              <div class="text-xs text-brand-200">{{ user()?.rol }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center gap-3 border-b border-slate-200 bg-white/80 px-5 py-3 backdrop-blur">
          <button class="btn-ghost btn-icon rounded-lg" (click)="toggle()">
            <span class="material-icons">menu</span>
          </button>
          <h1 class="text-base font-semibold text-slate-700">{{ pageLabel() }}</h1>
          <div class="flex-1"></div>
          <button class="btn btn-ghost" (click)="logout()">
            <span class="material-icons text-[20px]">logout</span>
            Salir
          </button>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Layout {
  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly opened = signal(true);

  private readonly allItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', section: 'General' },
    { label: 'Inventario', icon: 'inventory_2', route: '/inventario', roles: ['GERENTE', 'OPERARIO'], section: 'Operaciones' },
    { label: 'Producción', icon: 'precision_manufacturing', route: '/produccion', roles: ['GERENTE', 'OPERARIO'], section: 'Operaciones' },
    { label: 'Pedido diario', icon: 'edit_note', route: '/pedidos', roles: ['GERENTE', 'OPERARIO'], section: 'Comercial' },
    { label: 'Ventas', icon: 'point_of_sale', route: '/ventas', roles: ['GERENTE'], section: 'Comercial' },
    { label: 'Clientes', icon: 'storefront', route: '/clientes', roles: ['GERENTE'], section: 'Comercial' },
    { label: 'Reporte mensual', icon: 'bar_chart', route: '/reportes', roles: ['GERENTE', 'CONTADOR'], section: 'Comercial' },
    { label: 'Nómina', icon: 'groups', route: '/nomina', roles: ['RRHH'], section: 'Administración' },
    { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', roles: ['CONTADOR'], section: 'Administración' },
  ];

  readonly secciones = computed(() => {
    const visibles = this.allItems.filter((i) => !i.roles || this.auth.hasRole(...i.roles));
    const orden = ['General', 'Operaciones', 'Comercial', 'Administración'];
    return orden
      .map((s) => ({ nombre: s, items: visibles.filter((i) => i.section === s) }))
      .filter((g) => g.items.length > 0);
  });

  readonly inicial = computed(() => (this.user()?.username ?? '?').charAt(0).toUpperCase());
  readonly pageLabel = computed(() => this.user()?.rol ?? '');

  toggle() {
    this.opened.update((v) => !v);
  }

  logout() {
    this.auth.logout();
  }
}
