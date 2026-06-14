import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid min-h-screen lg:grid-cols-2">
      <!-- Panel de marca -->
      <div
        class="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex"
      >
        <div class="flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <span class="material-icons">factory</span>
          </div>
          <span class="text-lg font-bold">Marisa</span>
        </div>

        <div>
          <h1 class="max-w-md text-4xl leading-tight font-extrabold text-white">
            Gestión de producción y nómina, todo en un lugar.
          </h1>
          <p class="mt-4 max-w-md text-brand-100">
            Inventario, recetas, ventas, sueldos y auditoría para tu fábrica de snacks.
          </p>
        </div>

        <div class="flex gap-8 text-sm text-brand-100">
          <div><div class="text-2xl font-bold text-white">+27</div>módulos de datos</div>
          <div><div class="text-2xl font-bold text-white">100%</div>trazabilidad</div>
        </div>

        <div class="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-white/10"></div>
        <div class="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-accent/20"></div>
      </div>

      <!-- Formulario -->
      <div class="flex items-center justify-center bg-slate-100 p-6">
        <div class="card w-full max-w-md p-8">
          <div class="mb-6 lg:hidden">
            <div class="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
              <span class="material-icons">factory</span>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h2>
          <p class="mb-6 text-sm text-slate-500">Ingresá tus credenciales para continuar</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="label">Usuario</label>
              <input class="input" formControlName="username" autocomplete="username" placeholder="tu.usuario" />
            </div>

            <div>
              <label class="label">Contraseña</label>
              <div class="relative">
                <input
                  class="input pr-11"
                  [type]="hide() ? 'password' : 'text'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  (click)="hide.set(!hide())"
                >
                  <span class="material-icons text-[20px]">{{ hide() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>

            @if (error()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{{ error() }}</p>
            }

            <button type="submit" class="btn btn-primary w-full" [disabled]="loading() || form.invalid">
              @if (loading()) {
                <span class="material-icons animate-spin text-[20px]">progress_activity</span>
              }
              {{ loading() ? 'Ingresando…' : 'Ingresar' }}
            </button>
          </form>

          <p class="mt-6 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Demo: <b>admin</b> / Admin123! · <b>operario</b> / Operario123!
          </p>
        </div>
      </div>
    </div>
  `,
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hide = signal(true);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'No se pudo iniciar sesión');
      },
    });
  }
}
