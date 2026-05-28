import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const decoded = JSON.parse(atob(token.split('.')[1]));
    const userRole = decoded.role;
    const expectedRole = route.data['role'];

    if (userRole === expectedRole) return true;

    this.router.navigate(['/login']);
    return false;
  }
}