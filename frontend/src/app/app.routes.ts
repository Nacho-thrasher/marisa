import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'inventario',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE', 'OPERARIO'] },
        loadComponent: () => import('./features/inventario/inventario').then((m) => m.Inventario),
      },
      {
        path: 'produccion',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE', 'OPERARIO'] },
        loadComponent: () => import('./features/produccion/produccion').then((m) => m.Produccion),
      },
      {
        path: 'productos',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE'] },
        loadComponent: () => import('./features/productos/productos').then((m) => m.Productos),
      },
      {
        path: 'ventas',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE'] },
        loadComponent: () => import('./features/ventas/ventas').then((m) => m.Ventas),
      },
      {
        path: 'pedidos',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE', 'OPERARIO'] },
        loadComponent: () => import('./features/pedidos/pedido-diario').then((m) => m.PedidoDiario),
      },
      {
        path: 'clientes',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE'] },
        loadComponent: () => import('./features/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'vendedores',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE'] },
        loadComponent: () => import('./features/vendedores/vendedores').then((m) => m.Vendedores),
      },
      {
        path: 'reportes',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE', 'CONTADOR'] },
        loadComponent: () => import('./features/reportes/reportes').then((m) => m.Reportes),
      },
      {
        path: 'nomina',
        canActivate: [roleGuard],
        data: { roles: ['RRHH'] },
        loadComponent: () => import('./features/nomina/nomina').then((m) => m.Nomina),
      },
      {
        path: 'auditoria',
        canActivate: [roleGuard],
        data: { roles: ['CONTADOR'] },
        loadComponent: () => import('./features/auditoria/auditoria').then((m) => m.Auditoria),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/usuarios/usuarios').then((m) => m.Usuarios),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
