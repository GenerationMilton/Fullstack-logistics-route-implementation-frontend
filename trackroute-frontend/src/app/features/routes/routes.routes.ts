import { Routes } from '@angular/router';

export const ROUTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./routes-list.component').then((m) => m.RoutesListComponent)
  }
];
