import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { ToastComponent } from './shared/toast.component';
import { RemindersService } from './services/reminders.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent{
  title = 'Goal Setter App';
  constructor(private theme: ThemeService, private reminders: RemindersService) {
    // Apply loaded theme immediately
    this.theme.apply((this.theme as any).loadTheme ? (this.theme as any).loadTheme() : 'light');
    // instantiate reminders service so it begins watching
    // (constructor injection ensures it starts)
  }

  themeToggle() {
    this.theme.toggle();
  }
}
