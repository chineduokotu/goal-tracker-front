import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { GoalService } from './goal.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class RemindersService {
  private checkIntervalMs = 60 * 1000; // check every minute
  private sub: Subscription | null = null;

  constructor(private goalService: GoalService, private toast: ToastService) {
    // Only start timers in browser
    if (typeof window !== 'undefined') {
      this.requestPermission();
      this.sub = interval(this.checkIntervalMs).subscribe(() => this.checkReminders());
      // Also run immediately once
      setTimeout(() => this.checkReminders(), 1000);
    }
  }

  private async requestPermission() {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (e) {
      // ignore
    }
  }

  private checkReminders() {
    const now = new Date();
    this.goalService.getGoals().subscribe(goals => {
      goals.forEach(goal => {
        (goal.reminders ?? []).forEach(rem => {
          if (rem.notified) return;
          const when = new Date(rem.time);
          // If due now or in past (allow slight drift)
          if (when.getTime() <= now.getTime()) {
            this.fireNotification(goal.id, rem.id, rem.message ?? `Reminder for ${goal.title}`);
          }
        });
      });
    });
  }

  private fireNotification(goalId: number, reminderId: number, message: string) {
    // Browser Notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Goal Reminder', { body: message });
      } catch (e) {
        // fall back to toast
        this.toast.show(message, 'info');
      }
    } else {
      // fallback: toast
      this.toast.show(message, 'info');
    }
    // mark notified so it won't fire again
    this.goalService.markReminderNotified(goalId, reminderId).subscribe({ next: () => {}, error: () => {} });
  }

  stop() {
    this.sub?.unsubscribe();
    this.sub = null;
  }
}
