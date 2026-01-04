export interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

export type GoalStatus = 'pending' | 'in-progress' | 'completed';
export type GoalCategory = 'Work' | 'Personal' | 'Fitness' | 'Learning' | 'Other';
export type GoalPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Reminder {
  id: number;
  time: string; // ISO string
  message?: string;
  notified?: boolean;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate: string; // ISO date string
  progress: number; // 0-100 percentage
  status: GoalStatus;
  notes?: string;
  subTasks?: SubTask[];
  reminders?: Reminder[];
}