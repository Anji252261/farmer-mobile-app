import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CustomerService } from '../../services/customer.service';
import { CreditService } from '../../services/credit.service';
import { ToastService } from '../../shared/services/toast.service';
import { Customer } from '../../models/customer.model';
import { CreditEntry } from '../../models/credit.model';

interface CustomerUdharRow {
  customer: Customer;
  balance: number;
  lastEntryDate: string | null;
}

@Component({
  selector: 'app-udhar-book',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './udhar-book.component.html',
  styleUrls: ['./udhar-book.component.scss']
})
export class UdharBookComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  rows: CustomerUdharRow[] = [];
  filteredRows: CustomerUdharRow[] = [];
  selectedCustomer: Customer | null = null;
  selectedEntries: CreditEntry[] = [];
  searchTerm = '';
  villageFilter = '';
  ownerId = '';
  totalOutstanding = 0;
  customersWithDue = 0;

  form = this.fb.group({
    type: ['credit' as 'credit' | 'payment', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    note: ['']
  });

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private customerSvc: CustomerService,
    private creditSvc: CreditService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.ownerId = this.auth.currentUserValue?.id || '';

    this.sub.add(
      this.customerSvc.getAll().subscribe({
        next: customers => {
          this.customers = customers;
          this.refreshRows();
        },
        error: () => this.toast.error('Failed to load customers')
      })
    );

    if (this.ownerId) {
      this.sub.add(
        this.creditSvc.watchEntries(this.ownerId).subscribe(() => this.refreshRows())
      );
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get villages(): string[] {
    const villages = new Set(
      this.customers
        .map(customer => (customer.village || '').trim())
        .filter(village => village.length > 0)
    );
    return Array.from(villages).sort((a, b) => a.localeCompare(b));
  }

  get selectedBalance(): number {
    if (!this.selectedCustomer?._id || !this.ownerId) {
      return 0;
    }
    return this.creditSvc.getBalance(this.ownerId, this.selectedCustomer._id);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(part => part)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    if (!customer._id || !this.ownerId) {
      this.selectedEntries = [];
      return;
    }
    this.selectedEntries = this.creditSvc.getCustomerEntries(this.ownerId, customer._id);
  }

  clearSelection(): void {
    this.selectedCustomer = null;
    this.selectedEntries = [];
    this.form.reset({ type: 'credit', amount: null, note: '' });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const village = this.villageFilter.trim().toLowerCase();

    this.filteredRows = this.rows.filter(row => {
      const matchesSearch =
        !search ||
        row.customer.name.toLowerCase().includes(search) ||
        (row.customer.phone || '').includes(search) ||
        (row.customer.village || '').toLowerCase().includes(search);

      const matchesVillage =
        !village || (row.customer.village || '').trim().toLowerCase() === village;

      return matchesSearch && matchesVillage;
    });
  }

  submitEntry(): void {
    if (!this.selectedCustomer?._id || !this.ownerId) {
      this.toast.error('Select a customer first');
      return;
    }

    if (this.form.invalid) {
      this.toast.error('Enter a valid amount');
      return;
    }

    const { type, amount, note } = this.form.value;
    const value = Number(amount);

    if (type === 'payment' && value > this.selectedBalance) {
      this.toast.error('Payment cannot be more than outstanding balance');
      return;
    }

    if (type === 'credit') {
      this.creditSvc.addCredit(this.ownerId, this.selectedCustomer._id, value, note || undefined);
      this.toast.success('Udhar recorded');
    } else {
      this.creditSvc.addPayment(this.ownerId, this.selectedCustomer._id, value, note || undefined);
      this.toast.success('Payment recorded');
    }

    this.form.patchValue({ amount: null, note: '' });
    this.selectCustomer(this.selectedCustomer);
    this.refreshRows();
  }

  shareReminder(customer: Customer, balance: number, event?: Event): void {
    event?.stopPropagation();

    const phone = (customer.phone || '').replace(/\D/g, '');
    if (phone.length !== 10) {
      this.toast.error('Customer phone is missing or invalid');
      return;
    }

    const message = [
      `Namaste ${customer.name},`,
      '',
      `Aapka udhar Rs ${balance.toFixed(0)} baki hai.`,
      'Kripya jaldi payment karein.',
      '',
      'Dhanyavaad.'
    ].join('\n');

    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  formatDate(iso: string | null): string {
    if (!iso) {
      return '-';
    }
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  entryLabel(type: CreditEntry['type']): string {
    return type === 'credit' ? 'Udhar Given' : 'Payment Received';
  }

  private refreshRows(): void {
    if (!this.ownerId) {
      this.rows = [];
      this.filteredRows = [];
      this.totalOutstanding = 0;
      this.customersWithDue = 0;
      return;
    }

    const summaries = this.creditSvc.getCustomerSummaries(this.ownerId);
    const summaryMap = new Map(summaries.map(summary => [summary.customerId, summary]));

    this.rows = this.customers
      .filter(customer => customer._id)
      .map(customer => {
        const summary = summaryMap.get(customer._id!);
        return {
          customer,
          balance: summary?.balance ?? 0,
          lastEntryDate: summary?.lastEntryDate ?? null
        };
      })
      .sort((a, b) => {
        if (b.balance !== a.balance) {
          return b.balance - a.balance;
        }
        return a.customer.name.localeCompare(b.customer.name);
      });

    this.totalOutstanding = this.creditSvc.getTotalOutstanding(this.ownerId);
    this.customersWithDue = this.rows.filter(row => row.balance > 0).length;
    this.applyFilters();

    if (this.selectedCustomer?._id) {
      const stillExists = this.customers.find(customer => customer._id === this.selectedCustomer?._id);
      if (stillExists) {
        this.selectCustomer(stillExists);
      } else {
        this.clearSelection();
      }
    }
  }
}
