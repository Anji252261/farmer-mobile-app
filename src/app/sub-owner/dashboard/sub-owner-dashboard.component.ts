import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardMetrics } from '../../models/dashboard.model';
import { finalize } from 'rxjs';

interface AiTip {
  level: 'high' | 'normal';
  title: string;
  message: string;
  actionText: string;
  actionLink: string;
}

@Component({
  selector: 'app-sub-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sub-owner-dashboard.component.html',
  styleUrls: ['./sub-owner-dashboard.component.scss']
})
export class SubOwnerDashboardComponent implements OnInit {
  loading = true;
  metrics: DashboardMetrics = {
    totalItems: 0,
    totalCustomers: 0,
    totalOrders: 0,
    todaySaleAmount: 0,
    last7DaysSaleAmount: 0,
    topSellingItem: 'No sales yet',
    lowStockItems: []
  };

  constructor(private dashboardSvc: DashboardService) {}

  ngOnInit(): void {
    this.dashboardSvc
      .getMetrics()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: metrics => {
          this.metrics = metrics;
        },
        error: () => {
          this.metrics = {
            totalItems: 0,
            totalCustomers: 0,
            totalOrders: 0,
            todaySaleAmount: 0,
            last7DaysSaleAmount: 0,
            topSellingItem: 'No sales yet',
            lowStockItems: []
          };
        }
      });
  }

  get totalItems(): number {
    return this.metrics.totalItems;
  }

  get totalCustomers(): number {
    return this.metrics.totalCustomers;
  }

  get totalOrders(): number {
    return this.metrics.totalOrders;
  }

  get todaySaleAmount(): number {
    return this.metrics.todaySaleAmount;
  }

  get last7DaysSaleAmount(): number {
    return this.metrics.last7DaysSaleAmount;
  }

  get topSellingItemName(): string {
    return this.metrics.topSellingItem || 'No sales yet';
  }

  get lowStockItems() {
    return this.metrics.lowStockItems;
  }

  get aiTips(): AiTip[] {
    const tips: AiTip[] = [];

    if (this.lowStockItems.length > 0) {
      tips.push({
        level: 'high',
        title: 'Low Stock Alert',
        message: `${this.lowStockItems.length} item(s) are low. Buy stock now to avoid missed sales.`,
        actionText: 'Open Items',
        actionLink: '/sub-owner/items'
      });
    }

    if (this.totalCustomers < 5) {
      tips.push({
        level: 'normal',
        title: 'Grow Customer List',
        message: 'Add more customers. More customer list gives more daily sales.',
        actionText: 'Add Customers',
        actionLink: '/sub-owner/customers'
      });
    }

    if (this.totalOrders === 0) {
      tips.push({
        level: 'normal',
        title: 'Start First Sale',
        message: 'No sales recorded yet. Record one sale to start tracking business.',
        actionText: 'Record Sale',
        actionLink: '/sub-owner/sales/new'
      });
    }

    if (!tips.length) {
      tips.push({
        level: 'normal',
        title: 'Business Is Healthy',
        message: 'Great work. Continue daily sales entry and keep checking low stock list.',
        actionText: 'Record Sale',
        actionLink: '/sub-owner/sales/new'
      });
    }

    return tips;
  }
}
