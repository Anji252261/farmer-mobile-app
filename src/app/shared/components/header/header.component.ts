import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left" *ngIf="currentUser$ | async as user">
        <button
          class="hamburger"
          *ngIf="shouldShowHamburger(user)"
          type="button"
          aria-label="Toggle menu"
          (click)="menuToggle.emit()"
        >☰</button>
        <h1 class="app-title">{{ getHeaderBrand(user) }}</h1>
      </div>
      <div class="header-right">
        <button class="theme-btn" type="button" (click)="themeToggle.emit()" [attr.aria-label]="darkMode ? 'Switch to light mode' : 'Switch to dark mode'">
          {{ darkMode ? 'Light' : 'Dark' }}
        </button>
        <button class="icon-btn" title="Notifications">🔔</button>
        <span *ngIf="currentUser$ | async as user">
          <span class="user-name" [title]="user.name">{{ user.name }}</span>
          <button class="avatar" title="{{ user.name }}">{{ getInitials(user.name) }}</button>
        </span>
        <button class="logout-btn" type="button" (click)="logout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      background: var(--app-surface);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-bottom: 1px solid var(--app-line);
      height: 60px;
      position: sticky;
      top: 0;
      z-index: 60;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .header-left h1 {
      font-size: 1.08rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      margin: 0;
      color: var(--app-ink-900);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .hamburger {
      display: none;
      background: transparent;
      border: none;
      font-size: 1.4rem;
      min-width: 40px;
      min-height: 40px;
      cursor: pointer;
      color: var(--app-ink-700);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .icon-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      position: relative;
      color: var(--app-ink-700);
    }
    .icon-btn::after {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: red;
      border-radius: 50%;
      position: absolute;
      top: 0;
      right: 0;
    }
    .theme-btn {
      border: 1px solid var(--app-line);
      background: var(--app-surface-soft);
      color: var(--app-ink-700);
      border-radius: 8px;
      min-height: 36px;
      padding: 7px 10px;
      font-weight: 500;
      cursor: pointer;
    }
    .theme-btn:hover {
      border-color: var(--app-primary);
      color: var(--app-primary-deep);
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--app-primary);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .user-name {
      margin-right: 8px;
      color: var(--app-ink-700);
      font-weight: 500;
      font-size: 0.9rem;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: middle;
      display: inline-block;
    }
    .logout-btn {
      border: 1px solid var(--app-line);
      background: color-mix(in srgb, var(--app-primary) 14%, var(--app-surface));
      color: var(--app-primary-deep);
      border-radius: 8px;
      min-height: 36px;
      padding: 7px 10px;
      font-weight: 550;
      cursor: pointer;
    }
    .logout-btn:hover,
    .theme-btn:hover {
      background: color-mix(in srgb, var(--app-primary) 22%, var(--app-surface));
      color: var(--app-primary-deep);
      border-color: color-mix(in srgb, var(--app-primary) 35%, var(--app-line));
    }
    .app-title { font-size: 1rem; margin: 0; }
    @media (max-width: 900px) {
      .header {
        padding: 0 10px;
        gap: 8px;
      }
      .hamburger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .app-title {
        font-size: 1rem;
        font-weight: 580;
        line-height: 1.2;
      }
      .header-right {
        gap: 6px;
      }
      .theme-btn,
      .logout-btn {
        min-height: 34px;
        padding: 6px 9px;
        font-size: 0.84rem;
        font-weight: 500;
      }
    }
    @media (max-width: 480px) {
      .app-title {
        font-size: 0.95rem;
      }
      .user-name,
      .icon-btn,
      .avatar {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();
  @Output() themeToggle = new EventEmitter<void>();
  @Input() darkMode = false;
  currentUser$ = this.auth.currentUser$;
  constructor(private auth: AuthService, private router: Router) {}

  getHeaderBrand(user: User): string {
    if (user.role === 'MAIN_OWNER') {
      return 'Farmer Business System';
    }
    return user.shopName?.trim() || `${user.name} Shop`;
  }

  shouldShowHamburger(user: User): boolean {
    // Sub-owner has bottom tab navigation on mobile, so hamburger is redundant.
    return user.role === 'MAIN_OWNER';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
  getInitials(name: string | undefined) {
    if (!name) return 'US';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0,2)
      .toUpperCase();
  }
}
