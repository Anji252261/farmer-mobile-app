import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of (toasts$ | async)" class="toast toast-{{ t.type }}">
        {{ t.message }}
        <button (click)="removeToast(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      width: min(320px, calc(100vw - 24px));
    }
    .toast {
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--app-line);
      box-shadow: var(--app-shadow-sm);
      background: var(--app-surface);
    }
    .toast-success {
      background-color: var(--app-success-soft);
      color: var(--app-success);
    }
    .toast-error {
      background-color: var(--app-danger-soft);
      color: var(--app-danger);
    }
    .toast-info {
      background-color: var(--app-info-soft);
      color: var(--app-info);
    }
    .toast button {
      border: none;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
    }
  `]
})
export class ToastComponent {
  toasts$ = this.toastSvc.toasts$;
  constructor(private toastSvc: ToastService) {}
  removeToast(id: number) {
    this.toastSvc.removeToast(id);
  }
}
