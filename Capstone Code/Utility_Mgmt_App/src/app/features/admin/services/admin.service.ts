import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PagedResponse } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private usersUrl = `${environment.apiUrl}/auth/users`;
  private utilityTypesUrl = `${environment.apiUrl}/utilitytypes`;
  private tariffPlansUrl = `${environment.apiUrl}/tariffplans`;
  private billingCyclesUrl = `${environment.apiUrl}/billingcycles`;

  constructor(private http: HttpClient) {}

  getUsers(pageNumber = 1, pageSize = 10): Observable<PagedResponse<any>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResponse<any>>(this.usersUrl, { params });
  }

  getUser(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.usersUrl}/${id}`);
  }

  createUser(user: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.usersUrl, user);
  }

  updateUser(id: number, user: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.usersUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.usersUrl}/${id}`);
  }

  getUtilityTypes(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.utilityTypesUrl);
  }

  createUtilityType(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.utilityTypesUrl, payload);
  }

  updateUtilityType(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.utilityTypesUrl}/${id}`, payload);
  }

  deleteUtilityType(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.utilityTypesUrl}/${id}`);
  }

  getTariffPlans(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.tariffPlansUrl);
  }

  createTariffPlan(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.tariffPlansUrl, payload);
  }

  updateTariffPlan(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.tariffPlansUrl}/${id}`, payload);
  }

  deleteTariffPlan(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.tariffPlansUrl}/${id}`);
  }

  getBillingCycles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(this.billingCyclesUrl);
  }

  getCurrentBillingCycle(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.billingCyclesUrl}/current`);
  }

  createBillingCycle(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.billingCyclesUrl, payload);
  }

  updateBillingCycle(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.billingCyclesUrl}/${id}`, payload);
  }
}
