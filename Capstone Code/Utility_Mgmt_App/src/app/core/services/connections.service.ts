import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  Connection, 
  ConnectionListItem,
  CreateConnectionRequest, 
  UpdateConnectionRequest 
} from '../models';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  private apiUrl = `${environment.apiUrl}/connections`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams, utilityTypeId?: number, status?: string): Observable<PagedResponse<ConnectionListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (utilityTypeId) httpParams = httpParams.set('utilityTypeId', utilityTypeId.toString());
    if (status) httpParams = httpParams.set('status', status);
    return this.http.get<PagedResponse<ConnectionListItem>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<ApiResponse<Connection>> {
    return this.http.get<ApiResponse<Connection>>(`${this.apiUrl}/${id}`);
  }

  // Unused - commented out
  // getByNumber(connectionNumber: string): Observable<ApiResponse<Connection>> {
  //   return this.http.get<ApiResponse<Connection>>(`${this.apiUrl}/number/${connectionNumber}`);
  // }

  // Unused - no backend endpoint exists
  // getByConsumer(consumerId: number): Observable<ApiResponse<Connection[]>> {
  //   return this.http.get<ApiResponse<Connection[]>>(`${this.apiUrl}/consumer/${consumerId}`);
  // }

  getMyConnections(): Observable<ApiResponse<ConnectionListItem[]>> {
    return this.http.get<ApiResponse<ConnectionListItem[]>>(`${this.apiUrl}/my-connections`);
  }

  // Unused - no backend endpoint exists
  // getPendingReadings(): Observable<ApiResponse<ConnectionListItem[]>> {
  //   return this.http.get<ApiResponse<ConnectionListItem[]>>(`${this.apiUrl}/pending-readings`);
  // }

  create(payload: CreateConnectionRequest): Observable<ApiResponse<Connection>> {
    return this.http.post<ApiResponse<Connection>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateConnectionRequest): Observable<ApiResponse<Connection>> {
    return this.http.put<ApiResponse<Connection>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
