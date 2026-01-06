import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { ApiResponse, LoginRequest, LoginResponse, User, ConsumerRegisterRequest, PaginationParams, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    const user = this.storage.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  login(request: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.storage.setToken(response.data.token);
          this.storage.setUser(response.data.user);
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  register(request: ConsumerRegisterRequest): Observable<ApiResponse<LoginResponse>> {
    // Don't auto-login after registration - user should log in manually
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/register`, request);
  }

  registerStaff(request: any): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl}/register-staff`, request);
  }

  logout(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  reloadUser(): void {
    const user = this.storage.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  isLoggedIn(): boolean {
    return this.storage.isLoggedIn();
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Unused - commented out
  // getMe(): Observable<ApiResponse<User>> {
  //   return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  // }

  // Unused - commented out
  // changePassword(payload: { currentPassword: string; newPassword: string }): Observable<ApiResponse<boolean>> {
  //   return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/change-password`, payload);
  // }

  // Users management (Admin)
  getUsers(params?: PaginationParams): Observable<PagedResponse<User>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
      if (params.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    }
    return this.http.get<PagedResponse<User>>(`${this.apiUrl}/users`, { params: httpParams });
  }

  // Unused - commented out
  // getUserById(id: number): Observable<ApiResponse<User>> {
  //   return this.http.get<ApiResponse<User>>(`${this.apiUrl}/users/${id}`);
  // }

  updateUser(id: number, payload: any): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/users/${id}`);
  }
}
