import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  BillingCycle, 
  CreateBillingCycleRequest, 
  UpdateBillingCycleRequest 
} from '../models';

@Injectable({ providedIn: 'root' })
export class BillingCyclesService {
  private apiUrl = `${environment.apiUrl}/billingcycles`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams & { year?: number }): Observable<PagedResponse<BillingCycle>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.year) httpParams = httpParams.set('Year', params.year.toString());
    return this.http.get<PagedResponse<BillingCycle>>(this.apiUrl, { params: httpParams });
  }

  // Alias for backward compatibility
  list(year?: number): Observable<ApiResponse<BillingCycle[]>> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    return this.http.get<ApiResponse<BillingCycle[]>>(this.apiUrl, { params });
  }

  // Unused - commented out
  // getById(id: number): Observable<ApiResponse<BillingCycle>> {
  //   return this.http.get<ApiResponse<BillingCycle>>(`${this.apiUrl}/${id}`);
  // }

  getCurrent(): Observable<ApiResponse<BillingCycle>> {
    return this.http.get<ApiResponse<BillingCycle>>(`${this.apiUrl}/current`);
  }

  create(payload: CreateBillingCycleRequest): Observable<ApiResponse<BillingCycle>> {
    return this.http.post<ApiResponse<BillingCycle>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateBillingCycleRequest): Observable<ApiResponse<BillingCycle>> {
    return this.http.put<ApiResponse<BillingCycle>>(`${this.apiUrl}/${id}`, payload);
  }

  // Update status uses the PUT endpoint with status in the body
  updateStatus(id: number, payload: { status: string }): Observable<ApiResponse<BillingCycle>> {
    return this.http.put<ApiResponse<BillingCycle>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
