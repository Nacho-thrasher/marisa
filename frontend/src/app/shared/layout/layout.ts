import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';

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
    <div class="flex h-screen overflow-hidden">
      <!-- Backdrop (mobile) -->
      @if (opened()) {
        <div class="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" (click)="toggle()"></div>
      }

      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--color-line)] bg-white shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none lg:transition-[width]"
        [class.translate-x-0]="opened()"
        [class.-translate-x-full]="!opened()"
        [class.lg:w-0]="!opened()"
        [class.lg:overflow-hidden]="!opened()"
      >
        <div class="flex items-center gap-3 px-5 py-5">
          <div class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <span class="material-icons text-[20px]">factory</span>
          </div>
          <div class="leading-tight">
            <div class="text-[15px] font-bold text-slate-900">Marisa</div>
            <div class="text-[11px] text-slate-400">Producción & Nómina</div>
          </div>
        </div>

        <nav class="mt-1 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          @for (sec of secciones(); track sec.nombre) {
            <div>
              <p class="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {{ sec.nombre }}
              </p>
              <div class="space-y-0.5">
                @for (item of sec.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="!bg-brand-50 !text-brand-700"
                    (click)="onNavClick()"
                    class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span class="material-icons text-[20px]">{{ item.icon }}</span>
                    {{ item.label }}
                  </a>
                }
              </div>
            </div>
          }
        </nav>

        <div class="border-t border-[var(--color-line)] p-3">
          <div class="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {{ inicial() }}
            </div>
            <div class="min-w-0 flex-1 leading-tight">
              <div class="truncate text-sm font-semibold text-slate-800">{{ user()?.username }}</div>
              <div class="text-xs text-slate-400">{{ user()?.rol }}</div>
            </div>
            <button class="btn-ghost btn-icon" title="Cerrar sesión" (click)="logout()">
              <span class="material-icons text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--color-line)] bg-white/80 px-5 py-3 backdrop-blur-md">
          <button class="btn-ghost btn-icon" (click)="toggle()">
            <span class="material-icons">menu</span>
          </button>
          <h1 class="text-[15px] font-semibold text-slate-900">{{ pageLabel() }}</h1>
          <div class="flex-1"></div>
          <div class="relative">
            <button class="btn-ghost btn-icon relative" title="Notificaciones" (click)="toggleNotif()">
              <span class="material-icons text-[22px]">notifications</span>
              @if (notif.total() > 0) {
                <span class="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {{ notif.total() }}
                </span>
              }
            </button>

            @if (notifAbierto()) {
              <!-- backdrop para cerrar al hacer click afuera -->
              <div class="fixed inset-0 z-40" (click)="notifAbierto.set(false)"></div>
              <div class="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-lg animate-[pop_.15s_ease]">
                <div class="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
                  <span class="text-sm font-semibold text-slate-900">Notificaciones</span>
                  @if (notif.total() > 0) {
                    <span class="badge badge-neutral">{{ notif.total() }}</span>
                  }
                </div>
                <div class="max-h-96 overflow-y-auto">
                  @for (n of notif.items(); track n.id) {
                    <button
                      class="flex w-full items-start gap-3 border-b border-[var(--color-line)] px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50"
                      (click)="irA(n.route)"
                    >
                      <div class="icon-chip h-9 w-9" [class]="n.chip">
                        <span class="material-icons text-[18px]">{{ n.icon }}</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-medium text-slate-800">{{ n.titulo }}</div>
                        <div class="truncate text-xs text-slate-500">{{ n.detalle }}</div>
                      </div>
                    </button>
                  } @empty {
                    <div class="px-4 py-10 text-center text-sm text-slate-400">
                      <span class="material-icons mb-1 block text-3xl text-slate-300">notifications_off</span>
                      Sin novedades por ahora
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="flex items-center gap-2.5 pl-1">
            <div class="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {{ inicial() }}
            </div>
            <div class="hidden leading-tight sm:block">
              <div class="text-sm font-semibold text-slate-800">{{ user()?.username }}</div>
              <div class="text-[11px] text-slate-400">{{ user()?.rol }}</div>
            </div>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    @keyframes pop { from { opacity: 0; transform: scale(.97) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `,
})
export class Layout implements OnInit {
  private auth = inject(AuthService);
  readonly notif = inject(NotificacionesService);

  readonly user = this.auth.user;
  readonly opened = signal(typeof window === 'undefined' || window.innerWidth >= 1024);
  readonly notifAbierto = signal(false);

  private readonly allItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', section: 'General' },
    { label: 'Inventario', icon: 'inventory_2', route: '/inventario', roles: ['GERENTE', 'OPERARIO'], section: 'Operaciones' },
    { label: 'Producción', icon: 'precision_manufacturing', route: '/produccion', roles: ['GERENTE', 'OPERARIO'], section: 'Operaciones' },
    { label: 'Productos', icon: 'category', route: '/productos', roles: ['GERENTE'], section: 'Operaciones' },
    { label: 'Pedido diario', icon: 'edit_note', route: '/pedidos', roles: ['GERENTE', 'OPERARIO'], section: 'Comercial' },
    { label: 'Ventas', icon: 'point_of_sale', route: '/ventas', roles: ['GERENTE'], section: 'Comercial' },
    { label: 'Clientes', icon: 'storefront', route: '/clientes', roles: ['GERENTE'], section: 'Comercial' },
    { label: 'Reporte mensual', icon: 'bar_chart', route: '/reportes', roles: ['GERENTE', 'CONTADOR'], section: 'Comercial' },
    { label: 'Nómina', icon: 'groups', route: '/nomina', roles: ['RRHH'], section: 'Administración' },
    { label: 'Auditoría', icon: 'fact_check', route: '/auditoria', roles: ['CONTADOR'], section: 'Administración' },
    { label: 'Usuarios', icon: 'manage_accounts', route: '/usuarios', roles: ['ADMIN'], section: 'Administración' },
  ];

  readonly secciones = computed(() => {
    const visibles = this.allItems.filter((i) => !i.roles || this.auth.hasRole(...i.roles));
    const orden = ['General', 'Operaciones', 'Comercial', 'Administración'];
    return orden
      .map((s) => ({ nombre: s, items: visibles.filter((i) => i.section === s) }))
      .filter((g) => g.items.length > 0);
  });

  readonly inicial = computed(() => (this.user()?.username ?? '?').charAt(0).toUpperCase());

  private router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly pageLabel = computed(() => {
    const url = this.currentUrl();
    const match = this.allItems.find((i) => url.startsWith(i.route));
    return match?.label ?? 'Dashboard';
  });

  ngOnInit() {
    this.notif.cargar();
  }

  toggle() {
    this.opened.update((v) => !v);
  }

  onNavClick() {
    if (window.innerWidth < 1024) {
      this.opened.set(false);
    }
  }

  toggleNotif() {
    const abrir = !this.notifAbierto();
    this.notifAbierto.set(abrir);
    if (abrir) this.notif.cargar();
  }

  irA(route: string) {
    this.notifAbierto.set(false);
    this.router.navigateByUrl(route);
  }

  logout() {
    this.auth.logout();
  }
}
