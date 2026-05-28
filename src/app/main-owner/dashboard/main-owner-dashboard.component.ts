import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs';
import { CreateSubOwnerPayload, UpdateSubOwnerPayload, User } from '../../models/user.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-main-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './main-owner-dashboard.component.html',
  styleUrls: ['./main-owner-dashboard.component.scss']
})
export class MainOwnerDashboardComponent {
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    shopName: ['', [Validators.required, Validators.minLength(2)]],
    password: ['']
  });

  loading = false;
  errorMessage = '';
  successMessage = '';
  tempPassword = '';
  editingSubOwnerId: string | null = null;

  subOwners$: Observable<User[]> = this.userSvc.getByRole('SUB_OWNER');

  constructor(private userSvc: UserService, private fb: FormBuilder) {}

  addSubOwner() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.tempPassword = '';

    const basePayload: UpdateSubOwnerPayload = {
      name: String(this.form.value.name || ''),
      phone: String(this.form.value.phone || ''),
      shopName: String(this.form.value.shopName || ''),
      password: String(this.form.value.password || '')
    };

    if (this.editingSubOwnerId) {
      this.userSvc.updateSubOwner(this.editingSubOwnerId, basePayload).subscribe({
        next: updated => {
          this.loading = false;
          this.successMessage = `Sub owner ${updated.name} updated successfully.`;
          this.cancelEdit();
        },
        error: err => {
          this.loading = false;
          this.errorMessage = err?.error?.message || err?.message || 'Unable to update sub owner.';
        }
      });

      return;
    }

    const payload: CreateSubOwnerPayload = {
      name: basePayload.name,
      phone: basePayload.phone,
      shopName: basePayload.shopName
    };

    this.userSvc.createSubOwner(payload).subscribe({
      next: result => {
        this.loading = false;
        this.successMessage = `Sub owner ${result.user.name} added successfully.`;
        this.tempPassword = result.tempPassword || '';
        this.form.reset();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Unable to add sub owner.';
      }
    });
  }

  startEdit(owner: User) {
    this.editingSubOwnerId = owner.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.tempPassword = '';

    this.form.patchValue({
      name: owner.name,
      phone: owner.phone || '',
      shopName: owner.shopName || '',
      password: ''
    });
  }

  cancelEdit() {
    this.editingSubOwnerId = null;
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
