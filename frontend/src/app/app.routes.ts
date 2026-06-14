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
        path: 'ventas',
        canActivate: [roleGuard],
        data: { roles: ['GERENTE'] },
        loadComponent: () => import('./features/ventas/ventas').then((m) => m.Ventas),
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
    ],
  },
  { path: '**', redirectTo: '' },
];
