import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/ui/toast-container';
import { ConfirmDialog } from './shared/ui/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialog],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-confirm-dialog />
  `,
})
export class App { }
