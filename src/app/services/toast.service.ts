import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  ttl?: number; // milliseconds
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = new Subject<Toast[]>();
  private list: Toast[] = [];
  public toasts$ = this.toasts.asObservable();
  private nextId = 1;

  show(message: string, type: Toast['type'] = 'info', ttl = 4000) {
    const t: Toast = { id: this.nextId++, message, type, ttl };
    this.list = [t, ...this.list];
    this.toasts.next(this.list);
    if (ttl > 0) setTimeout(() => this.dismiss(t.id), ttl);
    return t.id;
  }

  dismiss(id: number) {
    this.list = this.list.filter(t => t.id !== id);
    this.toasts.next(this.list);
  }

  clear() {
    this.list = [];
    this.toasts.next(this.list);
  }
}
