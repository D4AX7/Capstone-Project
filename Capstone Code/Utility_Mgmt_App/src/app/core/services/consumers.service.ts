import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  Consumer, 
  ConsumerListItem,
  CreateConsumerRequest, 
  UpdateConsumerRequest 
} from '../models';

@Injectable({ providedIn: 'root' })
export class ConsumersService {
  private apiUrl = `${environment.apiUrl}/consumers`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams): Observable<PagedResponse<ConsumerListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    return this.http.get<PagedResponse<ConsumerListItem>>(this.apiUrl, { params: httpParams });
  }

  getById(id: number): Observable<ApiResponse<Consumer>> {
    return this.http.get<ApiResponse<Consumer>>(`${this.apiUrl}/${id}`);
  }

  // Unused - commented out
  // getByNumber(consumerNumber: string): Observable<ApiResponse<Consumer>> {
  //   return this.http.get<ApiResponse<Consumer>>(`${this.apiUrl}/number/${consumerNumber}`);
  // }

  getMyProfile(): Observable<ApiResponse<Consumer>> {
    return this.http.get<ApiResponse<Consumer>>(`${this.apiUrl}/my-profile`);
  }

  updateMyProfile(payload: UpdateConsumerRequest): Observable<ApiResponse<Consumer>> {
    return this.http.put<ApiResponse<Consumer>>(`${this.apiUrl}/my-profile`, payload);
  }

  search(term: string): Observable<ApiResponse<ConsumerListItem[]>> {
    return this.http.get<ApiResponse<ConsumerListItem[]>>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('searchTerm', term)
    });
  }

  create(payload: CreateConsumerRequest): Observable<ApiResponse<Consumer>> {
    return this.http.post<ApiResponse<Consumer>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateConsumerRequest): Observable<ApiResponse<Consumer>> {
    return this.http.put<ApiResponse<Consumer>>(`${this.apiUrl}/${id}`, payload);
  }

  // Unused - commented out
  // delete(id: number): Observable<ApiResponse<boolean>> {
  //   return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  // }
}
