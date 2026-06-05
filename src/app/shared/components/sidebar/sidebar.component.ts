import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="sidebar">
      <button class="close-handle" (click)="closed.emit()">×</button>
      <div class="sidebar-top" *ngIf="currentUser$ | async as user">
        <h2>{{ getDashboardTitle(user.role) }}</h2>
      </div>
      <nav *ngIf="currentUser$ | async as user">
        <h3>MENU</h3>
        <ul>
          <li *ngIf="user.role === 'MAIN_OWNER'">
            <a routerLink="/main-owner" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">🏠</span><span>Dashboard</span>
            </a>
          </li>
          <li *ngIf="user.role === 'SUB_OWNER'">
            <a routerLink="/sub-owner/dashboard" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">DB</span><span>Dashboard</span>
            </a>
          </li>
          <li *ngIf="user.role === 'SUB_OWNER'">
            <a routerLink="/sub-owner/customers" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">👥</span><span>Customers</span>
            </a>
          </li>
          <li *ngIf="user.role === 'SUB_OWNER'">
            <a routerLink="/sub-owner/items" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">🌐</span><span>Universal Items</span>
            </a>
          </li>
          <li *ngIf="user.role === 'SUB_OWNER'">
            <a routerLink="/sub-owner/sales/new" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">💰</span><span>Add Sale</span>
            </a>
          </li>
          <li *ngIf="user.role === 'SUB_OWNER'">
            <a routerLink="/sub-owner/udhar" routerLinkActive="active" (click)="closed.emit()">
              <span class="icon">📒</span><span>Udhar Book</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  `,
  styles: [`.close-handle {
    display: none;
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    width: 36px;
    height: 36px;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }
  .sidebar {
    width: 220px;
    background: var(--app-surface);
    height: 100%;
    max-height: 100%;
    padding: 24px 12px;
    box-shadow: 1px 0 4px rgba(16, 42, 67, 0.1);
    position: sticky;
    top: 0;
    overflow-y: auto;
    border-right: 1px solid var(--app-line);
  }
  .sidebar-top h2 {
    margin: 0 0 16px;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.12;
    color: var(--app-ink-900);
    padding-left: 4px;
  }
  .sidebar h3 {
    margin: 0 0 16px;
    font-size: 0.9rem;
    color: var(--app-muted-600);
  }
  .sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .sidebar li {
    margin-bottom: 12px;
  }
  .sidebar a {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--app-ink-700);
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.95rem;
  }
  .sidebar a.active,
  .sidebar a:hover {
    background: color-mix(in srgb, var(--app-primary) 18%, var(--app-surface));
    color: var(--app-primary-deep);
  }
  .sidebar .icon {
    font-size: 1.1rem;
  }
  @media (max-width: 768px) {
    .sidebar {
      width: 250px;
      padding-top: 52px;
    }
    .close-handle {
      display: block;
    }
  }`]
})
export class SidebarComponent {
  @Output() closed = new EventEmitter<void>();
  currentUser$ = this.auth.currentUser$;
  constructor(private auth: AuthService) {}

  getDashboardTitle(role: string | undefined): string {
    return role === 'MAIN_OWNER' ? 'Main Owner Dashboard' : 'Sub Owner Dashboard';
  }
}
