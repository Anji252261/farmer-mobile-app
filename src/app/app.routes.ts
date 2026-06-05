import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { RoleGuard } from './core/role.guard';
import { noAuthGuard } from './core/no-auth.guard'; // ← new file below
import { SubOwnerDashboardComponent } from './sub-owner/dashboard/sub-owner-dashboard.component';

export const routes: Routes = [
  { 
    path: '',
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login',
    canActivate: [noAuthGuard], // ← if token exists, skip login page
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'main-owner', 
    canActivate: [AuthGuard, RoleGuard], // ← guards only here, not in children
    data: { role: 'MAIN_OWNER' },
    children: [
      { 
        path: '', 
        
        loadComponent: () => import('./main-owner/dashboard/main-owner-dashboard.component').then(m => m.MainOwnerDashboardComponent) 
      },
      { 
        path: 'sub-owner/:id', 
        loadComponent: () => { return import('./main-owner/sub-owner-details/sub-owner-details.component').then(m => m.SubOwnerDetailsComponent) 
        }}
    ]
  },
  { 
    path: 'sub-owner', 
    canActivate: [AuthGuard, RoleGuard], // ← guards only here, not in children
    data: { role: 'SUB_OWNER' },
    
    children: [
    
      { path: 'dashboard', component: SubOwnerDashboardComponent },
      { path: 'customers', loadComponent: () =>{ return import('./sub-owner/customers/customer-list.component').then(m => m.CustomerListComponent) }},
      { path: 'items', loadComponent: () => import('./sub-owner/items/item-list.component').then(m => m.ItemListComponent) },
      { path: 'udhar', loadComponent: () => import('./sub-owner/udhar/udhar-book.component').then(m => m.UdharBookComponent) },
      { 
        path: 'sales',
        children: [
          { 
            path: 'new', 
            loadComponent: () => import('./sub-owner/sales/sales-form.component').then(m => m.SalesFormComponent) 
          }
          
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];