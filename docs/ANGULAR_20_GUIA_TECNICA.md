# Guía Técnica Angular 20+ - Sistema de Gestión de Producción y Nómina

## 1. SETUP DEL PROYECTO ANGULAR 20+

### 1.1 Crear el Proyecto
```bash
# Usar Angular CLI 20+
ng new sistema-produccion-nomina --routing --style=scss --skip-git

cd sistema-produccion-nomina

# Instalar dependencias adicionales
npm install @angular/material @angular/cdk
npm install rxjs
npm install ngx-spinner
npm install ngx-toastr
npm install date-fns
npm install axios  # o usar HttpClient nativo
```

### 1.2 Estructura de Carpetas Recomendada
```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   ├── models/
│   │   │   ├── usuario.model.ts
│   │   │   ├── insumo.model.ts
│   │   │   ├── orden-produccion.model.ts
│   │   │   ├── venta.model.ts
│   │   │   ├── empleado.model.ts
│   │   │   ├── nomina.model.ts
│   │   │   └── auditoria.model.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── loading.service.ts
│   │   └── core.module.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   └── header.component.html
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   └── sidebar.component.html
│   │   │   ├── layout/
│   │   │   │   ├── layout.component.ts
│   │   │   │   └── layout.component.html
│   │   │   ├── confirm-dialog/
│   │   │   ├── loading-spinner/
│   │   │   └── pagination/
│   │   ├── pipes/
│   │   │   ├── currency.pipe.ts
│   │   │   ├── date.pipe.ts
│   │   │   └── number-format.pipe.ts
│   │   ├── directives/
│   │   │   ├── highlight.directive.ts
│   │   │   └── has-permission.directive.ts
│   │   └── shared.module.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   └── login/
│   │   │   │       ├── login.component.ts
│   │   │   │       └── login.component.html
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── auth-routing.module.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   │   └── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── estadisticas/
│   │   │   │   ├── graficos/
│   │   │   │   └── alertas/
│   │   │   ├── services/
│   │   │   │   └── dashboard.service.ts
│   │   │   ├── dashboard-routing.module.ts
│   │   │   └── dashboard.module.ts
│   │   │
│   │   ├── inventario/
│   │   │   ├── pages/
│   │   │   │   ├── lista-insumos/
│   │   │   │   ├── detalle-insumo/
│   │   │   │   ├── ingreso-insumo/
│   │   │   │   └── egreso-insumo/
│   │   │   ├── components/
│   │   │   │   ├── tabla-insumos/
│   │   │   │   ├── form-insumo/
│   │   │   │   ├── alertas-stock/
│   │   │   │   └── historial-movimientos/
│   │   │   ├── services/
│   │   │   │   └── insumo.service.ts
│   │   │   ├── models/
│   │   │   │   └── insumo.model.ts
│   │   │   ├── inventario-routing.module.ts
│   │   │   └── inventario.module.ts
│   │   │
│   │   ├── produccion/
│   │   │   ├── pages/
│   │   │   │   ├── lista-ordenes/
│   │   │   │   ├── crear-orden/
│   │   │   │   ├── registrar-consumo/
│   │   │   │   └── detalle-orden/
│   │   │   ├── components/
│   │   │   │   ├── form-orden/
│   │   │   │   ├── tabla-ordenes/
│   │   │   │   ├── registro-consumo/
│   │   │   │   └── resumen-produccion/
│   │   │   ├── services/
│   │   │   │   ├── produccion.service.ts
│   │   │   │   └── receta.service.ts
│   │   │   ├── models/
│   │   │   │   ├── orden-produccion.model.ts
│   │   │   │   └── receta.model.ts
│   │   │   ├── produccion-routing.module.ts
│   │   │   └── produccion.module.ts
│   │   │
│   │   ├── ventas/
│   │   │   ├── pages/
│   │   │   │   ├── lista-ventas/
│   │   │   │   ├── crear-venta/
│   │   │   │   └── detalle-venta/
│   │   │   ├── components/
│   │   │   │   ├── form-venta/
│   │   │   │   ├── tabla-ventas/
│   │   │   │   └── resumen-venta/
│   │   │   ├── services/
│   │   │   │   └── venta.service.ts
│   │   │   ├── models/
│   │   │   │   └── venta.model.ts
│   │   │   ├── ventas-routing.module.ts
│   │   │   └── ventas.module.ts
│   │   │
│   │   ├── nomina/
│   │   │   ├── pages/
│   │   │   │   ├── lista-empleados/
│   │   │   │   ├── crear-empleado/
│   │   │   │   ├── configurar-salarial/
│   │   │   │   ├── proceso-nomina/
│   │   │   │   └── recibos/
│   │   │   ├── components/
│   │   │   │   ├── form-empleado/
│   │   │   │   ├── tabla-empleados/
│   │   │   │   ├── asistente-nomina/
│   │   │   │   ├── configuracion-aportes/
│   │   │   │   └── tabla-recibos/
│   │   │   ├── services/
│   │   │   │   ├── empleado.service.ts
│   │   │   │   ├── nomina.service.ts
│   │   │   │   └── configuracion-aportes.service.ts
│   │   │   ├── models/
│   │   │   │   ├── empleado.model.ts
│   │   │   │   ├── estructura-salarial.model.ts
│   │   │   │   └── nomina.model.ts
│   │   │   ├── nomina-routing.module.ts
│   │   │   └── nomina.module.ts
│   │   │
│   │   ├── auditoria/
│   │   │   ├── pages/
│   │   │   │   ├── logs/
│   │   │   │   ├── historial-precios/
│   │   │   │   └── auditoria-nomina/
│   │   │   ├── components/
│   │   │   │   ├── tabla-logs/
│   │   │   │   ├── detalle-cambio/
│   │   │   │   └── filtros/
│   │   │   ├── services/
│   │   │   │   └── auditoria.service.ts
│   │   │   ├── models/
│   │   │   │   └── auditoria.model.ts
│   │   │   ├── auditoria-routing.module.ts
│   │   │   └── auditoria.module.ts
│   │   │
│   │   └── reportes/
│   │       ├── pages/
│   │       │   ├── reporte-produccion/
│   │       │   ├── reporte-nomina/
│   │       │   ├── reporte-ventas/
│   │       │   └── reporte-auditoria/
│   │       ├── components/
│   │       │   ├── generador-reportes/
│   │       │   ├── filtros-reporte/
│   │       │   └── preview-reporte/
│   │       ├── services/
│   │       │   └── reporte.service.ts
│   │       ├── reportes-routing.module.ts
│   │       └── reportes.module.ts
│   │
│   ├── app-routing.module.ts
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.module.ts
│   └── app.config.ts (si usas standalone)
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── styles/
│       ├── global.scss
│       ├── variables.scss
│       ├── mixins.scss
│       ├── themes.scss
│       └── responsive.scss
│
├── environments/
│   ├── environment.ts
│   ├── environment.staging.ts
│   └── environment.prod.ts
│
├── index.html
├── styles.scss
└── main.ts
```

---

## 2. CARACTERÍSTICAS CLAVE DE ANGULAR 20+

### 2.1 Guards Funcionales (AuthGuard)
```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

// Uso en routing:
// {
//   path: 'dashboard',
//   component: DashboardComponent,
//   canActivate: [authGuard]
// }
```

### 2.2 RxJS y Signals para Reactividad
```typescript
// usuario.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  // Usando Signals (Angular 16+)
  private usuarioSignal = signal<Usuario | null>(null);
  usuarioActual = this.usuarioSignal.asReadonly();

  // O usando RxJS tradicional
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtenerUsuario(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`/api/v1/usuarios/${id}`)
      .pipe(
        tap(usuario => {
          this.usuarioSignal.set(usuario);
          this.usuarioSubject.next(usuario);
        })
      );
  }
}
```

### 2.3 Reactive Forms
```typescript
// form-insumo.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InsumoService } from '../../services/insumo.service';

@Component({
  selector: 'app-form-insumo',
  templateUrl: './form-insumo.component.html',
  styleUrls: ['./form-insumo.component.scss']
})
export class FormInsumoComponent {
  formulario: FormGroup;
  enviando = false;

  constructor(
    private fb: FormBuilder,
    private insumoService: InsumoService
  ) {
    this.formulario = this.crearFormulario();
  }

  crearFormulario(): FormGroup {
    return this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['', Validators.required],
      unidad_medida: ['kg'],
      precio_unitario: ['', [Validators.required, Validators.min(0)]],
      stock_minimo: ['', [Validators.required, Validators.min(0)]],
      stock_critico: ['', [Validators.required, Validators.min(0)]]
    });
  }

  enviar(): void {
    if (this.formulario.invalid) {
      return;
    }

    this.enviando = true;
    this.insumoService.crear(this.formulario.value)
      .subscribe({
        next: (respuesta) => {
          console.log('Insumo creado:', respuesta);
          this.formulario.reset();
          this.enviando = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.enviando = false;
        }
      });
  }
}
```

### 2.4 Interceptors
```typescript
// auth.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}

// app.module.ts
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
]
```

### 2.5 Lazy Loading de Módulos
```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.module')
      .then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/dashboard/dashboard.module')
          .then(m => m.DashboardModule)
      },
      {
        path: 'inventario',
        loadChildren: () => import('./modules/inventario/inventario.module')
          .then(m => m.InventarioModule)
      },
      {
        path: 'produccion',
        loadChildren: () => import('./modules/produccion/produccion.module')
          .then(m => m.ProduccionModule)
      },
      {
        path: 'ventas',
        loadChildren: () => import('./modules/ventas/ventas.module')
          .then(m => m.VentasModule)
      },
      {
        path: 'nomina',
        loadChildren: () => import('./modules/nomina/nomina.module')
          .then(m => m.NominaModule)
      },
      {
        path: 'auditoria',
        loadChildren: () => import('./modules/auditoria/auditoria.module')
          .then(m => m.AuditoriaModule)
      },
      {
        path: 'reportes',
        loadChildren: () => import('./modules/reportes/reportes.module')
          .then(m => m.ReportesModule)
      }
    ]
  }
];
```

### 2.6 HttpClient para Llamadas a API
```typescript
// insumo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InsumoService {
  private apiUrl = `${environment.apiUrl}/insumos`;

  constructor(private http: HttpClient) {}

  obtener(page: number = 1, limit: number = 50): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(this.apiUrl, { params });
  }

  obtenerPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crear(insumo: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, insumo);
  }

  actualizar(id: string, insumo: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, insumo);
  }

  registrarIngreso(id: string, ingreso: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/ingreso`, ingreso);
  }

  registrarEgreso(id: string, egreso: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/egreso`, egreso);
  }

  obtenerMovimientos(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/movimientos`);
  }
}
```

### 2.7 Directivas Personalizadas
```typescript
// has-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  @Input() appHasPermission: string | string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const permisos = Array.isArray(this.appHasPermission)
      ? this.appHasPermission
      : [this.appHasPermission];

    const tienePermiso = this.authService.tienePermiso(permisos);

    if (tienePermiso) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

// Uso en template:
// <button *appHasPermission="'inventario:crear'">Crear Insumo</button>
// <div *appHasPermission="['inventario:ver', 'inventario:editar']">
//   Contenido solo para usuarios con permisos
// </div>
```

### 2.8 Pipes Personalizados
```typescript
// currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
  standalone: true
})
export class CurrencyPipe implements PipeTransform {
  transform(value: number, currency: string = '$'): string {
    if (!value) return `${currency} 0.00`;
    return `${currency} ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

// Uso en template:
// <span>{{ producto.precio | appCurrency }}</span>
// <span>{{ venta.total | appCurrency: '₲' }}</span>
```

---

## 3. ESTRUCTURA DE UN MÓDULO TÍPICO

### Ejemplo: Módulo de Inventario

```typescript
// inventario.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';

import { InventarioRoutingModule } from './inventario-routing.module';
import { ListaInsumosComponent } from './pages/lista-insumos/lista-insumos.component';
import { FormInsumoComponent } from './components/form-insumo/form-insumo.component';
import { TablaInsumosComponent } from './components/tabla-insumos/tabla-insumos.component';
import { IngresoInsumoComponent } from './pages/ingreso-insumo/ingreso-insumo.component';
import { EgresoInsumoComponent } from './pages/egreso-insumo/egreso-insumo.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ListaInsumosComponent,
    FormInsumoComponent,
    TablaInsumosComponent,
    IngresoInsumoComponent,
    EgresoInsumoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    InventarioRoutingModule,
    SharedModule
  ]
})
export class InventarioModule { }
```

---

## 4. CONFIGURACIÓN DE ENVIRONMENTS

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  logLevel: 'DEBUG'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tuempresa.com/api/v1',
  logLevel: 'ERROR'
};
```

---

## 5. PACKAGE.JSON RECOMENDADO

```json
{
  "name": "sistema-produccion-nomina",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint",
    "serve": "ng serve --open"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/compiler": "^20.0.0",
    "@angular/core": "^20.0.0",
    "@angular/forms": "^20.0.0",
    "@angular/material": "^20.0.0",
    "@angular/platform-browser": "^20.0.0",
    "@angular/platform-browser-dynamic": "^20.0.0",
    "@angular/router": "^20.0.0",
    "@cdk/coercion": "^20.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0",
    "ngx-spinner": "^17.0.0",
    "ngx-toastr": "^17.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.0.0",
    "@angular/cli": "^20.0.0",
    "@angular/compiler-cli": "^20.0.0",
    "@types/jasmine": "~5.1.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.4.0"
  }
}
```

---

## 6. EJEMPLO COMPLETO: COMPONENTE DE INGRESO DE INSUMO

### 6.1 Componente TypeScript
```typescript
// ingreso-insumo.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InsumoService } from '../../services/insumo.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-ingreso-insumo',
  templateUrl: './ingreso-insumo.component.html',
  styleUrls: ['./ingreso-insumo.component.scss']
})
export class IngresoInsumoComponent implements OnInit {
  formulario: FormGroup;
  enviando = false;
  insumo: any;
  insumoId: string;

  constructor(
    private fb: FormBuilder,
    private insumoService: InsumoService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formulario = this.crearFormulario();
    this.insumoId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.cargarInsumo();
  }

  crearFormulario(): FormGroup {
    return this.fb.group({
      cantidad: ['', [Validators.required, Validators.min(0.01)]],
      precio_unitario: ['', [Validators.required, Validators.min(0)]],
      proveedor: ['', Validators.required],
      numero_lote: [''],
      fecha_vencimiento: [''],
      observaciones: ['']
    });
  }

  cargarInsumo(): void {
    if (!this.insumoId) return;

    this.insumoService.obtenerPorId(this.insumoId).subscribe({
      next: (insumo) => {
        this.insumo = insumo;
      },
      error: (error) => {
        this.notificationService.error('Error al cargar el insumo');
      }
    });
  }

  registrarIngreso(): void {
    if (this.formulario.invalid) {
      this.notificationService.warning('Por favor complete los campos requeridos');
      return;
    }

    this.enviando = true;
    const datos = this.formulario.value;

    this.insumoService.registrarIngreso(this.insumoId, datos).subscribe({
      next: (respuesta) => {
        this.notificationService.success('Ingreso registrado correctamente');
        this.router.navigate(['/dashboard/inventario']);
      },
      error: (error) => {
        this.notificationService.error(
          error.error?.message || 'Error al registrar ingreso'
        );
      },
      complete: () => {
        this.enviando = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/inventario']);
  }
}
```

### 6.2 Template HTML
```html
<!-- ingreso-insumo.component.html -->
<div class="container">
  <mat-card class="card-container">
    <mat-card-header>
      <mat-card-title>Registrar Ingreso de Materia Prima</mat-card-title>
      <mat-card-subtitle *ngIf="insumo">
        {{ insumo.nombre }} ({{ insumo.codigo }})
      </mat-card-subtitle>
    </mat-card-header>

    <mat-card-content>
      <form [formGroup]="formulario" (ngSubmit)="registrarIngreso()">
        <!-- Grid de 2 columnas -->
        <div class="form-grid">
          <!-- Cantidad -->
          <mat-form-field class="full-width">
            <mat-label>Cantidad <span class="required">*</span></mat-label>
            <input 
              matInput 
              type="number" 
              step="0.01"
              formControlName="cantidad"
              placeholder="100"
            />
            <mat-error *ngIf="formulario.get('cantidad')?.hasError('required')">
              La cantidad es requerida
            </mat-error>
            <mat-error *ngIf="formulario.get('cantidad')?.hasError('min')">
              La cantidad debe ser mayor a 0
            </mat-error>
          </mat-form-field>

          <!-- Precio Unitario -->
          <mat-form-field class="full-width">
            <mat-label>Precio Unitario <span class="required">*</span></mat-label>
            <input 
              matInput 
              type="number" 
              step="0.01"
              formControlName="precio_unitario"
              placeholder="15.50"
            />
            <mat-error *ngIf="formulario.get('precio_unitario')?.hasError('required')">
              El precio es requerido
            </mat-error>
            <mat-error *ngIf="formulario.get('precio_unitario')?.hasError('min')">
              El precio debe ser válido
            </mat-error>
          </mat-form-field>

          <!-- Proveedor -->
          <mat-form-field class="full-width">
            <mat-label>Proveedor <span class="required">*</span></mat-label>
            <input 
              matInput 
              formControlName="proveedor"
              placeholder="García SRL"
            />
            <mat-error *ngIf="formulario.get('proveedor')?.hasError('required')">
              El proveedor es requerido
            </mat-error>
          </mat-form-field>

          <!-- Número de Lote -->
          <mat-form-field class="full-width">
            <mat-label>Número de Lote</mat-label>
            <input 
              matInput 
              formControlName="numero_lote"
              placeholder="LOT-2024-001"
            />
          </mat-form-field>

          <!-- Fecha de Vencimiento -->
          <mat-form-field class="full-width">
            <mat-label>Fecha de Vencimiento</mat-label>
            <input 
              matInput 
              type="date"
              formControlName="fecha_vencimiento"
            />
          </mat-form-field>

          <!-- Observaciones -->
          <mat-form-field class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea 
              matInput 
              formControlName="observaciones"
              rows="3"
              placeholder="Observaciones del ingreso"
            ></textarea>
          </mat-form-field>
        </div>

        <!-- Botones de Acción -->
        <div class="button-group">
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="enviando || formulario.invalid"
          >
            <span *ngIf="!enviando">Registrar Ingreso</span>
            <span *ngIf="enviando">
              <mat-spinner [diameter]="20"></mat-spinner>
              Procesando...
            </span>
          </button>

          <button 
            mat-stroked-button 
            type="button"
            (click)="cancelar()"
            [disabled]="enviando"
          >
            Cancelar
          </button>
        </div>
      </form>
    </mat-card-content>
  </mat-card>
</div>
```

### 6.3 Estilos SCSS
```scss
// ingreso-insumo.component.scss
.container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.card-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  mat-card-header {
    margin-bottom: 24px;
  }

  mat-card-title {
    font-size: 24px;
    font-weight: 500;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .full-width {
    width: 100%;
  }
}

.required {
  color: #d32f2f;
  margin-left: 4px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;

  button {
    min-width: 120px;
  }
}

mat-spinner {
  display: inline-block;
  margin-right: 8px;
}
```

---

## 7. MEJORES PRÁCTICAS ANGULAR 20+

### 7.1 Cambiar Detection Strategy
```typescript
@Component({
  selector: 'app-tabla-insumos',
  templateUrl: './tabla-insumos.component.html',
  styleUrls: ['./tabla-insumos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablaInsumosComponent {
  // Reduce cambios detectados innecesarios
}
```

### 7.2 Usar Observables correctamente
```typescript
// ✗ MAL
ngOnInit(): void {
  this.insumoService.obtener().subscribe(insumos => {
    this.insumos = insumos;
  });
}

// ✓ BIEN
insumos$ = this.insumoService.obtener().pipe(
  shareReplay(1)  // Cachea los resultados
);

// En template:
// <div *ngFor="let insumo of insumos$ | async">
```

### 7.3 Desuscribirse correctamente
```typescript
// ✗ MAL
private subscription: Subscription;

ngOnInit(): void {
  this.subscription = this.service.obtener()
    .subscribe(data => { ... });
}

// ✓ BIEN
private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.service.obtener()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => { ... });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## 8. TESTING EN ANGULAR

```typescript
// insumo.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InsumoService } from './insumo.service';

describe('InsumoService', () => {
  let service: InsumoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InsumoService]
    });
    service = TestBed.inject(InsumoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería obtener insumos', () => {
    const mockInsumos = [
      { id: 1, nombre: 'Papa', precio: 15.50 }
    ];

    service.obtener().subscribe(insumos => {
      expect(insumos.length).toBe(1);
      expect(insumos[0].nombre).toBe('Papa');
    });

    const req = httpMock.expectOne('/api/v1/insumos?page=1&limit=50');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockInsumos });
  });
});
```

---

Esta guía complementa la documentación técnica general y proporciona ejemplos concretos para implementar el sistema con Angular 20+.
