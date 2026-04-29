import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DashboardSummaryResponse } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly summarySubject = new BehaviorSubject<DashboardSummaryResponse | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly summary$ = this.summarySubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  setSummary(summary: DashboardSummaryResponse | null): void {
    this.summarySubject.next(summary);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
