import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/auth.guard';
import { RoleGuard } from '../core/role.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'MAIN_OWNER' },
    children: [
      { path: '', loadComponent: () => import('./dashboard/main-owner-dashboard.component').then(m => m.MainOwnerDashboardComponent) },
      { path: 'sub-owner/:id', loadComponent: () => import('./sub-owner-details/sub-owner-details.component').then(m => m.SubOwnerDetailsComponent) }
    ]
  }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MainOwnerRoutingModule {}
