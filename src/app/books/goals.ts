import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalService } from '../services/goal.service';
import { ToastService } from '../services/toast.service';
import { Goal, SubTask } from '../models/goal';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.html',
  styleUrls: ['./goals.css']
})
export class GoalsComponent implements OnInit {
  goals: Goal[] = [];
  filteredGoals: Goal[] = [];
  selectedGoal: Goal | null = null;
  isEditing = false;
  editGoal: Goal = { id: 0, title: '', description: '', category: 'Other', priority: 'Medium', targetDate: '', progress: 0, status: 'pending', notes: '', subTasks: [] };
  newGoal: Omit<Goal, 'id'> = { title: '', description: '', category: 'Other', priority: 'Medium', targetDate: '', progress: 0, status: 'pending', notes: '', subTasks: [] };
  error: string | null = null;

  // filter state
  filterCategory: string = 'All';
  filterPriority: string = 'All';
  filterStatus: string = 'All';
  filterSearch: string = '';

  constructor(public goalService: GoalService, private toast: ToastService) { }

  clearAll(): void {
    if (!confirm('Clear ALL goals from LocalStorage? This cannot be undone.')) return;
    this.goalService.clearAll();
    this.applyFilters();
  }
  ngOnInit(): void {
    this.loadGoals();
  }

  loadGoals(): void {
    this.goalService.getGoals().subscribe({
      next: (goals) => {
        this.goals = goals;
        this.applyFilters();
      },
      error: (error) => {
        this.error = error;
      }
    });
  }

  selectGoal(goal: Goal): void {
    this.selectedGoal = goal;
    this.editGoal = { ...goal } as Goal;
    this.isEditing = true;
  }

  createGoal(): void {
    // Basic validation
    if (!this.newGoal.title || this.newGoal.title.trim() === '') {
      this.error = 'Title is required.';
      return;
    }
    if (!this.newGoal.targetDate) {
      this.error = 'Due date is required.';
      return;
    }

    this.goalService.createGoal(this.newGoal).subscribe({
      next: (goal) => {
        this.newGoal = { title: '', description: '', category: 'Other', priority: 'Medium', targetDate: '', progress: 0, status: 'pending', notes: '', subTasks: [] };
        this.error = null;
        this.applyFilters();
        this.toast.show('Goal created', 'success');
      },
      error: (error) => {
        this.error = error;
      }
    });
  }

  updateGoal(): void {
    if (this.editGoal.id) {
      this.goalService.updateGoal(this.editGoal.id, this.editGoal).subscribe({
        next: (updatedGoal) => {
          this.cancelEdit();
          this.error = null;
          this.applyFilters();
          this.toast.show('Goal updated', 'success');
        },
        error: (error) => {
          this.error = error;
        }
      });
    }
  }

  deleteGoal(id: number): void {
    this.goalService.deleteGoal(id).subscribe({
      next: () => {
        if (this.selectedGoal && this.selectedGoal.id === id) {
          this.selectedGoal = null;
        }
        this.error = null;
        this.applyFilters();
        this.toast.show('Goal deleted', 'success');
      },
      error: (error) => {
        this.error = error;
      }
    });
  }

  addSubTask(goal: Goal, title: string): void {
    if (!title || title.trim() === '') return;
    this.goalService.addSubTask(goal.id, title).subscribe({
      next: () => { this.applyFilters(); this.toast.show('Subtask added', 'success'); },
      error: (e) => this.toast.show(String(e), 'error')
    });
  }

  addReminder(goal: Goal, localDt: string, msg?: string) {
    if (!localDt) { this.toast.show('Please choose a date/time', 'error'); return; }
    // convert datetime-local to ISO string (assume local timezone)
    const iso = new Date(localDt).toISOString();
    this.goalService.addReminder(goal.id, iso, msg).subscribe({ next: () => { this.applyFilters(); this.toast.show('Reminder added', 'success'); }, error: (e) => this.toast.show(String(e), 'error') });
  }

  removeReminder(goalId: number, reminderId: number) {
    this.goalService.removeReminder(goalId, reminderId).subscribe({ next: () => { this.applyFilters(); this.toast.show('Reminder removed', 'info'); }, error: (e) => this.toast.show(String(e), 'error') });
  }

  toggleSubTask(goal: Goal, sub: SubTask): void {
    this.goalService.toggleSubTask(goal.id, sub.id).subscribe({
      next: () => { this.applyFilters(); this.toast.show(sub.completed ? 'Subtask marked' : 'Subtask unmarked', 'success'); },
      error: (e) => this.toast.show(String(e), 'error')
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedGoal = null;
  }

  calculateDaysLeft(targetDate: string): number {
    const today = new Date();
    const target = new Date(targetDate);
    const timeDiff = target.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getAbsValue(num: number): number {
    return Math.abs(num);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-in-progress';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  // Filtering
  applyFilters(): void {
    this.filteredGoals = this.goalService.filter(this.goals, { category: this.filterCategory, priority: this.filterPriority, status: this.filterStatus, search: this.filterSearch });
  }
}
