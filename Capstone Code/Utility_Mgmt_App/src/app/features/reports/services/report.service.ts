import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}
  getDashboardSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  getMonthlyRevenue(month: string, year: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/revenue/monthly`, { params });
  }

  getYearlyRevenue(year: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('year', year);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/revenue/yearly`, { params });
  }

  getOutstandingDues(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/outstanding-dues`);
  }

  getConsumption(month?: string, year?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/consumption`, { params });
  }

  getConsumerBilling(consumerId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/consumer-billing/${consumerId}`);
  }

  getCollection(fromDate?: string, toDate?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/collection`, { params });
  }
}
