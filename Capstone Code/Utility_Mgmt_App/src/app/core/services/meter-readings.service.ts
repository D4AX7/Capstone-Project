import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  MeterReading, 
  MeterReadingListItem,
  CreateMeterReadingRequest, 
  UpdateMeterReadingRequest,
  BulkMeterReadingRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class MeterReadingsService {
  private apiUrl = `${environment.apiUrl}/meterreadings`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams & { billingMonth?: number; billingYear?: number }): Observable<PagedResponse<MeterReadingListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (params?.billingMonth) httpParams = httpParams.set('billingMonth', params.billingMonth.toString());
    if (params?.billingYear) httpParams = httpParams.set('billingYear', params.billingYear.toString());
    return this.http.get<PagedResponse<MeterReadingListItem>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<ApiResponse<MeterReading>> {
    return this.http.get<ApiResponse<MeterReading>>(`${this.apiUrl}/${id}`);
  }

  getByConnection(connectionId: number): Observable<ApiResponse<MeterReading[]>> {
    return this.http.get<ApiResponse<MeterReading[]>>(`${this.apiUrl}/connection/${connectionId}`);
  }

  getUnbilled(billingMonth?: number, billingYear?: number): Observable<ApiResponse<MeterReadingListItem[]>> {
    let params = new HttpParams();
    if (billingMonth) params = params.set('billingMonth', billingMonth.toString());
    if (billingYear) params = params.set('billingYear', billingYear.toString());
    return this.http.get<ApiResponse<MeterReadingListItem[]>>(`${this.apiUrl}/unbilled`, { params });
  }

  getLastReading(connectionId: number): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.apiUrl}/last-reading/${connectionId}`);
  }

  create(payload: CreateMeterReadingRequest): Observable<ApiResponse<MeterReading>> {
    return this.http.post<ApiResponse<MeterReading>>(this.apiUrl, payload);
  }

  // Unused - commented out
  // createBulk(payload: BulkMeterReadingRequest): Observable<ApiResponse<MeterReading[]>> {
  //   return this.http.post<ApiResponse<MeterReading[]>>(`${this.apiUrl}/bulk`, payload);
  // }

  update(id: number, payload: UpdateMeterReadingRequest): Observable<ApiResponse<MeterReading>> {
    return this.http.put<ApiResponse<MeterReading>>(`${this.apiUrl}/${id}`, payload);
  }

  // Unused - commented out
  // delete(id: number): Observable<ApiResponse<boolean>> {
  //   return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  // }
}
