import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  TariffPlan, 
  TariffPlanListItem,
  CreateTariffPlanRequest, 
  UpdateTariffPlanRequest 
} from '../models';

@Injectable({ providedIn: 'root' })
export class TariffPlansService {
  private apiUrl = `${environment.apiUrl}/tariffplans`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<TariffPlan[]>> {
    return this.http.get<ApiResponse<TariffPlan[]>>(this.apiUrl);
  }

  // Unused - commented out
  // getPaged(params: PaginationParams): Observable<PagedResponse<TariffPlanListItem>> {
  //   let httpParams = new HttpParams();
  //   if (params.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
  //   if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
  //   if (params.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
  //   return this.http.get<PagedResponse<TariffPlanListItem>>(`${this.apiUrl}/paged`, { params: httpParams });
  // }

  // Unused - commented out
  // getById(id: number): Observable<ApiResponse<TariffPlan>> {
  //   return this.http.get<ApiResponse<TariffPlan>>(`${this.apiUrl}/${id}`);
  // }

  getByUtilityType(utilityTypeId: number): Observable<ApiResponse<TariffPlan[]>> {
    return this.http.get<ApiResponse<TariffPlan[]>>(`${this.apiUrl}/utility-type/${utilityTypeId}`);
  }

  create(payload: CreateTariffPlanRequest): Observable<ApiResponse<TariffPlan>> {
    return this.http.post<ApiResponse<TariffPlan>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateTariffPlanRequest): Observable<ApiResponse<TariffPlan>> {
    return this.http.put<ApiResponse<TariffPlan>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
