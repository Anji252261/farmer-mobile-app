import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    return true;
  }

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const role = decoded.role;

    if (role === 'MAIN_OWNER') {
      router.navigate(['/main-owner']);
    } else if (role === 'SUB_OWNER') {
      router.navigate(['/sub-owner/dashboard']);
    } else {
      router.navigate(['/login']);
    }
  } catch {
    localStorage.removeItem('token');
    return true;
  }

  return false;
};