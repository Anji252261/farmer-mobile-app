import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', Validators.required]
  });
  loading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {}

  submit() {
    if (this.form.invalid) return;
    this.errorMessage = '';
    this.loading = true;
    const { identifier, password } = this.form.value;

    this.auth
      .login(String(identifier || ''), String(password || ''))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => {
          if (res.user.role === 'MAIN_OWNER') {
            this.router.navigate(['/main-owner']);
          } else {
            this.router.navigate(['/sub-owner']);
          }
        },
        error: () => {
          this.errorMessage = 'Invalid email/phone or password';
        }
      });
  }
}
