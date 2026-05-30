import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastSubject.asObservable();
  private counter = 0;

  success(message: string) {
    this.showToast('success', message);
  }

  error(message: string) {
    this.showToast('error', message);
  }

  info(message: string) {
    this.showToast('info', message);
  }

  private showToast(type: 'success' | 'error' | 'info', message: string) {
    const id = ++this.counter;
    const toast: ToastMessage = { type, message, id };
    const current = this.toastSubject.value;
    this.toastSubject.next([...current, toast]);
    setTimeout(() => this.removeToast(id), 3000);
  }

  removeToast(id: number) {
    this.toastSubject.next(this.toastSubject.value.filter(t => t.id !== id));
  }
}
