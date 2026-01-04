import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Goal, SubTask, GoalCategory, GoalPriority, GoalStatus } from '../models/goal';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private storageKey = 'goals_v1';
  private goals$ = new BehaviorSubject<Goal[]>(this.loadFromStorage());

  // Expose possible categories and priorities for form selects
  public readonly categories: GoalCategory[] = ['Work', 'Personal', 'Fitness', 'Learning', 'Other'];
  public readonly priorities: GoalPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

  constructor() {
    // Start with empty dataset (no seeded/dummy data).
  }

  getGoals(): Observable<Goal[]> {
    return this.goals$.asObservable();
  }

  getGoal(id: number): Observable<Goal> {
    const g = this.goals$.value.find(x => x.id === id);
    return g ? of({ ...g }) : throwError(() => `Goal ${id} not found`);
  }

  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    const id = this.nextId();
    const newGoal: Goal = { id, ...goal };
    const updated = [...this.goals$.value, newGoal];
    this.saveAndEmit(updated);
    return of(newGoal);
  }

  updateGoal(id: number, goal: Goal): Observable<Goal> {
    const idx = this.goals$.value.findIndex(g => g.id === id);
    if (idx === -1) return throwError(() => `Goal ${id} not found`);
    const updated = [...this.goals$.value];
    updated[idx] = { ...goal, id };
    this.saveAndEmit(updated);
    return of(updated[idx]);
  }

  deleteGoal(id: number): Observable<void> {
    const idx = this.goals$.value.findIndex(g => g.id === id);
    if (idx === -1) return throwError(() => `Goal ${id} not found`);
    const updated = [...this.goals$.value];
    updated.splice(idx, 1);
    this.saveAndEmit(updated);
    return of(void 0);
  }

  // Subtask helpers
  addSubTask(goalId: number, title: string): Observable<SubTask> {
    const goal = this.goals$.value.find(g => g.id === goalId);
    if (!goal) return throwError(() => `Goal ${goalId} not found`);
    const id = this.nextSubTaskId(goal);
    const sub: SubTask = { id, title, completed: false };
    goal.subTasks = goal.subTasks ?? [];
    goal.subTasks.push(sub);
    this.recalculateProgress(goal);
    this.saveAndEmit([...this.goals$.value]);
    return of(sub);
  }

  toggleSubTask(goalId: number, subTaskId: number): Observable<void> {
    const goal = this.goals$.value.find(g => g.id === goalId);
    if (!goal) return throwError(() => `Goal ${goalId} not found`);
    const s = goal.subTasks?.find(st => st.id === subTaskId);
    if (!s) return throwError(() => `SubTask ${subTaskId} not found`);
    s.completed = !s.completed;
    this.recalculateProgress(goal);
    this.saveAndEmit([...this.goals$.value]);
    return of(void 0);
  }

  // Reminder helpers
  addReminder(goalId: number, timeIso: string, message?: string) {
    const goal = this.goals$.value.find(g => g.id === goalId);
    if (!goal) return throwError(() => `Goal ${goalId} not found`);
    goal.reminders = goal.reminders ?? [];
    const id = goal.reminders.length > 0 ? Math.max(...goal.reminders.map(r => r.id)) + 1 : 1;
    const rem = { id, time: timeIso, message: message ?? `Reminder for ${goal.title}`, notified: false };
    goal.reminders.push(rem);
    this.saveAndEmit([...this.goals$.value]);
    return of(rem);
  }

  removeReminder(goalId: number, reminderId: number) {
    const goal = this.goals$.value.find(g => g.id === goalId);
    if (!goal) return throwError(() => `Goal ${goalId} not found`);
    goal.reminders = (goal.reminders ?? []).filter(r => r.id !== reminderId);
    this.saveAndEmit([...this.goals$.value]);
    return of(void 0);
  }

  markReminderNotified(goalId: number, reminderId: number) {
    const goal = this.goals$.value.find(g => g.id === goalId);
    if (!goal) return throwError(() => `Goal ${goalId} not found`);
    const r = goal.reminders?.find(rr => rr.id === reminderId);
    if (!r) return throwError(() => `Reminder ${reminderId} not found`);
    r.notified = true;
    this.saveAndEmit([...this.goals$.value]);
    return of(void 0);
  }
  // Utility helpers
  private recalculateProgress(goal: Goal) {
    if (!goal.subTasks || goal.subTasks.length === 0) return;
    const total = goal.subTasks.length;
    const done = goal.subTasks.filter(s => s.completed).length;
    goal.progress = Math.round((done / total) * 100);
    if (goal.progress === 100) goal.status = 'completed';
    else if (goal.progress > 0) goal.status = 'in-progress';
    else goal.status = 'pending';
  }

  private nextId(): number {
    return this.goals$.value.length > 0 ? Math.max(...this.goals$.value.map(g => g.id)) + 1 : 1;
  }

  private nextSubTaskId(goal: Goal): number {
    if (!goal.subTasks || goal.subTasks.length === 0) return 1;
    return Math.max(...goal.subTasks.map(s => s.id)) + 1;
  }

  private saveAndEmit(goals: Goal[]) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(goals));
      } catch (e) {
        console.warn('Failed to persist goals to localStorage', e);
      }
    }
    this.goals$.next(goals);
  }

  private loadFromStorage(): Goal[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to parse stored goals', e);
      return [];
    }
  }

  // Simple client-side filters (returns filtered array)
  filter(goals: Goal[], opts: { category?: string; priority?: string; status?: string; search?: string }) {
    return goals.filter(g => {
      if (opts.category && opts.category !== 'All' && g.category !== opts.category) return false;
      if (opts.priority && opts.priority !== 'All' && g.priority !== opts.priority) return false;
      if (opts.status && opts.status !== 'All' && g.status !== opts.status) return false;
      if (opts.search && !(`${g.title} ${g.description} ${g.notes}`.toLowerCase().includes(opts.search.toLowerCase()))) return false;
      return true;
    });
  }

  // Utility to wipe all goals (useful to start fresh)
  clearAll(): void {
    this.saveAndEmit([]);
  }
}