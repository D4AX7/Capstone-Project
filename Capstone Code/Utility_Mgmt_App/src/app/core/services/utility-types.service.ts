import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, UtilityType, CreateUtilityTypeRequest, UpdateUtilityTypeRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class UtilityTypesService {
  private apiUrl = `${environment.apiUrl}/utilitytypes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<UtilityType[]>> {
    return this.http.get<ApiResponse<UtilityType[]>>(this.apiUrl);
  }

  // Unused - commented out
  // getById(id: number): Observable<ApiResponse<UtilityType>> {
  //   return this.http.get<ApiResponse<UtilityType>>(`${this.apiUrl}/${id}`);
  // }

  create(payload: CreateUtilityTypeRequest): Observable<ApiResponse<UtilityType>> {
    return this.http.post<ApiResponse<UtilityType>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateUtilityTypeRequest): Observable<ApiResponse<UtilityType>> {
    return this.http.put<ApiResponse<UtilityType>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
