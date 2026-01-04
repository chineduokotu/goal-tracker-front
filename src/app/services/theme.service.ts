import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'app_theme_v1';
  private theme$ = new BehaviorSubject<Theme>(this.loadTheme());

  get current() { return this.theme$.asObservable(); }

  setTheme(theme: Theme) {
    this.theme$.next(theme);
    try { localStorage.setItem(this.key, theme); } catch (e) { /* ignore */ }
    this.apply(theme);
  }

  toggle() {
    const next: Theme = this.theme$.value === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private loadTheme(): Theme {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem(this.key) : null;
      return (t === 'dark' ? 'dark' : 'light');
    } catch (e) {
      return 'light';
    }
  }

  apply(theme: Theme) {
    const root = (typeof document !== 'undefined') ? document.documentElement : null;
    if (!root) return;
    root.setAttribute('data-theme', theme);
  }
}
