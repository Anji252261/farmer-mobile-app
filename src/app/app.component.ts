import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AuthService } from './core/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, HeaderComponent, SidebarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'farmer-mobile-app';
  showSidebar = false;
  isLoginRoute = false;
  darkMode = false;
  currentUser$ = this.auth.currentUser$;

  constructor(private router: Router, private auth: AuthService) {
    this.darkMode = localStorage.getItem('app-theme') === 'dark';
    this.applyTheme();

    this.isLoginRoute = this.router.url.startsWith('/login');
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoginRoute = this.router.url.startsWith('/login');
        if (this.isLoginRoute) {
          this.showSidebar = false;
        }
      });
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('app-theme', this.darkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
  }
}
