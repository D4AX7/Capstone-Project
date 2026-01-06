import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse,
  DateRangeParams,
  DashboardSummary,
  MonthlyRevenueReport,
  OutstandingDuesReport,
  ConsumptionReport,
  ConsumerBillingSummary,
  CollectionReport
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/dashboard`);
  }

  getMonthlyRevenue(month: number, year: number): Observable<ApiResponse<MonthlyRevenueReport>> {
    return this.http.get<ApiResponse<MonthlyRevenueReport>>(`${this.apiUrl}/revenue/monthly`, {
      params: new HttpParams().set('month', month.toString()).set('year', year.toString())
    });
  }

  getYearlyRevenue(year: number): Observable<ApiResponse<MonthlyRevenueReport[]>> {
    return this.http.get<ApiResponse<MonthlyRevenueReport[]>>(`${this.apiUrl}/revenue/yearly`, {
      params: new HttpParams().set('year', year.toString())
    });
  }

  getOutstandingDues(): Observable<ApiResponse<OutstandingDuesReport>> {
    return this.http.get<ApiResponse<OutstandingDuesReport>>(`${this.apiUrl}/outstanding-dues`);
  }

  getConsumption(month: number, year: number): Observable<ApiResponse<ConsumptionReport>> {
    return this.http.get<ApiResponse<ConsumptionReport>>(`${this.apiUrl}/consumption`, {
      params: new HttpParams().set('month', month.toString()).set('year', year.toString())
    });
  }

  getConsumerBilling(consumerId: number, params?: DateRangeParams): Observable<ApiResponse<ConsumerBillingSummary>> {
    let httpParams = new HttpParams();
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<ApiResponse<ConsumerBillingSummary>>(`${this.apiUrl}/consumer-billing/${consumerId}`, { params: httpParams });
  }

  getCollection(params: DateRangeParams): Observable<ApiResponse<CollectionReport>> {
    let httpParams = new HttpParams();
    if (params.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<ApiResponse<CollectionReport>>(`${this.apiUrl}/collection`, { params: httpParams });
  }
}
