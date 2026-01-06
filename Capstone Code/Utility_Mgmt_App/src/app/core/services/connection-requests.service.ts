import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PagedResponse,
  PaginationParams,
  ConnectionRequestDto,
  ConnectionRequestListDto,
  CreateConnectionRequestDto,
  ProcessConnectionRequestDto,
  AvailableUtilityDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class ConnectionRequestsService {
  private apiUrl = `${environment.apiUrl}/connectionrequests`;

  constructor(private http: HttpClient) {}

  // Consumer endpoints
  getAvailableUtilities(): Observable<ApiResponse<AvailableUtilityDto[]>> {
    return this.http.get<ApiResponse<AvailableUtilityDto[]>>(`${this.apiUrl}/available-utilities`);
  }

  createRequest(payload: CreateConnectionRequestDto): Observable<ApiResponse<ConnectionRequestDto>> {
    return this.http.post<ApiResponse<ConnectionRequestDto>>(this.apiUrl, payload);
  }

  getMyRequests(): Observable<ApiResponse<ConnectionRequestListDto[]>> {
    return this.http.get<ApiResponse<ConnectionRequestListDto[]>>(`${this.apiUrl}/my-requests`);
  }

  cancelRequest(id: number): Observable<ApiResponse<ConnectionRequestDto>> {
    return this.http.post<ApiResponse<ConnectionRequestDto>>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getById(id: number): Observable<ApiResponse<ConnectionRequestDto>> {
    return this.http.get<ApiResponse<ConnectionRequestDto>>(`${this.apiUrl}/${id}`);
  }

  // Admin endpoints
  getAll(params?: PaginationParams & { status?: string }): Observable<PagedResponse<ConnectionRequestListDto>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (params?.status) httpParams = httpParams.set('Status', params.status);
    return this.http.get<PagedResponse<ConnectionRequestListDto>>(this.apiUrl, { params: httpParams });
  }

  getPendingRequests(): Observable<ApiResponse<ConnectionRequestListDto[]>> {
    return this.http.get<ApiResponse<ConnectionRequestListDto[]>>(`${this.apiUrl}/pending`);
  }

  processRequest(id: number, payload: ProcessConnectionRequestDto): Observable<ApiResponse<ConnectionRequestDto>> {
    return this.http.post<ApiResponse<ConnectionRequestDto>>(`${this.apiUrl}/${id}/process`, payload);
  }
}
