import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    houseNo: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    village: ['']
  });

  constructor(
    private fb: FormBuilder,
    private customerSvc: CustomerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get villageCount(): number {
    const villages = new Set(
      this.customers
        .map(customer => (customer.village || '').trim().toLowerCase())
        .filter(village => village.length > 0)
    );
    return villages.size;
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

  private load() {
    this.customerSvc.getAll().subscribe({
      next: customers => {
        this.customers = customers;
      },
      error: err => {
        this.toast.error('Failed to load customers');
        console.error(err);
      }
    });
  }

add() {
  // if (this.form.invalid) {
  //   this.toast.error('Please enter valid customer details');
  //   return;
  // }

  const { name, phone, village, houseNo } = this.form.value;

  this.customerSvc.create({
    name: String(name || '').trim(),
    phone: String(phone || '').trim(),
    village: String(village || '').trim(),
    houseNo: String(houseNo || '').trim(),
   
  }).subscribe({
    next: () => {
      this.form.reset();
      this.toast.success('Customer added');
      this.load();
    },
    error: (err) => {
      this.toast.error('Failed to add customer');
      console.error(err);
    }
  });
}

  remove(customer: Customer) {
    // this.customerSvc.delete(customer.id).subscribe(() => {
    //   this.toast.success('Customer removed');
    //   this.load();
    // });
   
    this.customerSvc.deleteCustomer({ customerId: customer._id, status: 'inactive' }).subscribe({
      next: () => {
        this.toast.success('Customer removed');   
        this.load();
      },
      error: (err) => {
        this.toast.error('Failed to remove customer');
        console.error(err);
      }
    });
  }

  trackById(_index: number, customer: Customer) {
    return customer._id;
  }
}
