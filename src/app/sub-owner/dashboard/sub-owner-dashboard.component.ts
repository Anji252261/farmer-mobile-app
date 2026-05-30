import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ItemService } from '../../services/item.service';
import { CustomerService } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';
import { Item } from '../../models/item.model';
import { Sale } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { forkJoin } from 'rxjs';

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
  items: Item[] = [];
  customers: Customer[] = [];
  sales: Sale[] = [];

  constructor(
    private auth: AuthService,
    private itemSvc: ItemService,
    private customerSvc: CustomerService,
    private saleSvc: SaleService
  ) {}

  ngOnInit(): void {
    const ownerId = this.auth.currentUserValue?.id || '';
    forkJoin({
      items: this.itemSvc.getByOwner(ownerId),
      customers: this.customerSvc.getByOwner(ownerId),
      sales: this.saleSvc.getByOwner(ownerId)
    }).subscribe(({ items, customers, sales }) => {
      this.items = items;
      this.customers = customers;
      this.sales = sales;
      this.loading = false;
    });
  }

  get totalItems(): number {
    return this.items.length;
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get totalOrders(): number {
    return this.sales.length;
  }

  get todaySaleAmount(): number {
    const today = this.toDateInput(new Date());
    return this.sales
      .filter(sale => this.toDateInput(sale.date) === today)
      .reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);
  }

  get last7DaysSaleAmount(): number {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    return this.sales.reduce((sum, sale) => {
      const dt = new Date(sale.date);
      if (Number.isNaN(dt.getTime()) || dt < weekAgo || dt > now) {
        return sum;
      }
      return sum + Number(sale.totalPrice || 0);
    }, 0);
  }

  get lowStockItems(): Item[] {
    return this.items
      .filter(item => Number(item.quantity || 0) <= 10)
      .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
  }

  get topSellingItemName(): string {
    if (!this.sales.length) {
      return 'No sales yet';
    }

    const totals = new Map<string, number>();
    this.sales.forEach(sale => {
      const qty = Number(sale.quantity || 0);
      totals.set(sale.itemId, (totals.get(sale.itemId) || 0) + qty);
    });

    let topItemId = '';
    let topQty = 0;
    totals.forEach((qty, itemId) => {
      if (qty > topQty) {
        topQty = qty;
        topItemId = itemId;
      }
    });

    return this.items.find(item => item.id === topItemId)?.name || 'Unknown item';
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

    if (this.customers.length < 5) {
      tips.push({
        level: 'normal',
        title: 'Grow Customer List',
        message: 'Add more customers. More customer list gives more daily sales.',
        actionText: 'Add Customers',
        actionLink: '/sub-owner/customers'
      });
    }

    if (this.sales.length === 0) {
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

  private toDateInput(date: string | Date): string {
    const dt = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(dt.getTime())) {
      return '';
    }
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
