import { Routes } from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./monitoring-home.component').then((m) => m.MonitoringHomeComponent)
  }
];
