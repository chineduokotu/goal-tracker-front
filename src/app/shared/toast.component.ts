import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toast-container" *ngIf="toasts.length">
    <div *ngFor="let t of toasts" class="toast" [ngClass]="t.type">
      <div class="message">{{ t.message }}</div>
      <button class="close" (click)="dismiss(t.id)">×</button>
    </div>
  </div>
  `,
  styles: [`
  .toast-container { position: fixed; right: 16px; top: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast { padding: 10px 12px; border-radius: 6px; min-width: 200px; box-shadow: 0 2px 6px rgba(0,0,0,0.12); display: flex; justify-content: space-between; align-items: center; }
  .toast.success { background: #e6f4ea; color: #1b5e20; }
  .toast.error { background: #fdecea; color: #b00020; }
  .toast.info { background: #e8f0fe; color: #0d47a1; }
  .toast .close { background: transparent; border: none; font-size: 16px; cursor: pointer; }
  `]
})
export class ToastComponent {
  toasts: Toast[] = [];
  constructor(private ts: ToastService) {
    this.ts.toasts$.subscribe(list => this.toasts = list);
  }
  dismiss(id: number) { this.ts.dismiss(id); }
}
