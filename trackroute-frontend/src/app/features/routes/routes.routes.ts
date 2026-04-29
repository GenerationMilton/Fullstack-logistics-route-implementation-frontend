import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ROUTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./routes-list.component').then((m) => m.RoutesListComponent)
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./route-form.component').then((m) => m.RouteFormComponent)
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./route-form.component').then((m) => m.RouteFormComponent)
  }
];
