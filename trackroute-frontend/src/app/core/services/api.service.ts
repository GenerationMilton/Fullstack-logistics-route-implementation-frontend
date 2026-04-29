import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(url: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<T> {
    let httpParams = new HttpParams();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === '') continue;
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<T>(url, { params: httpParams });
  }
}
