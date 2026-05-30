import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) return true; // ✅ ONLY check token, nothing else

  router.navigate(['/login']);
  return false;
};