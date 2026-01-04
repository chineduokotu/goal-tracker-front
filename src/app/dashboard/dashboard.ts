import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { GoalService } from '../services/goal.service';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { Goal } from '../models/goal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  // charts data
  public statusChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  public categoryChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public trendChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  public isBrowser = typeof window !== 'undefined';

  constructor(public goalService: GoalService) {
    this.goalService.getGoals().subscribe((goals: Goal[]) => this.updateCharts(goals));
  }

  private updateCharts(goals: Goal[]) {
    // Status chart: completed vs pending vs in-progress
    const statusCounts: Record<string, number> = { completed: 0, 'in-progress': 0, pending: 0 };
    goals.forEach(g => statusCounts[g.status] = (statusCounts[g.status] || 0) + 1);
    this.statusChartData = {
      labels: ['Completed', 'In Progress', 'Pending'],
      datasets: [{ data: [statusCounts['completed'], statusCounts['in-progress'], statusCounts['pending']], backgroundColor: ['#4caf50', '#ff9800', '#9e9e9e'] } as ChartDataset<'doughnut', number[]>]
    };

    // Category chart: counts per category (include all categories even if zero)
    const catMap: Record<string, number> = {};
    this.goalService.categories.forEach(c => catMap[c] = 0);
    goals.forEach(g => catMap[g.category] = (catMap[g.category] || 0) + 1);
    this.categoryChartData = { labels: Object.keys(catMap), datasets: [{ label: 'Goals', data: Object.values(catMap), backgroundColor: '#42a5f5' }] };

    // Trend chart: goals created or due per month (group by targetDate month)
    const monthMap: Record<string, number> = {};
    goals.forEach(g => {
      if (!g.targetDate) return;
      const d = new Date(g.targetDate);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[label] = (monthMap[label] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthMap).sort();
    this.trendChartData = sortedMonths.length > 0 ? { labels: sortedMonths, datasets: [{ label: 'Goals due', data: sortedMonths.map(m => monthMap[m]), borderColor: '#673ab7', fill: false }] } : { labels: [], datasets: [] };
  }
}