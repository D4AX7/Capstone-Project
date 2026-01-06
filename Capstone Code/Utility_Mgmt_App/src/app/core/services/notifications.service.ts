import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  Notification
} from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private unreadNotificationsSubject = new BehaviorSubject<Notification[]>([]);
  unreadNotifications$ = this.unreadNotificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(isRead?: boolean): Observable<ApiResponse<Notification[]>> {
    let params = new HttpParams();
    if (isRead !== undefined) {
      params = params.set('isRead', String(isRead));
    }
    return this.http.get<ApiResponse<Notification[]>>(this.apiUrl, { params });
  }

  getUnreadNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.getAll(false).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.unreadNotificationsSubject.next(response.data);
          this.unreadCountSubject.next(response.data.length);
        }
      })
    );
  }

  refreshUnreadCount(): void {
    this.getAll(false).subscribe(response => {
      if (response.success && response.data) {
        this.unreadNotificationsSubject.next(response.data);
        this.unreadCountSubject.next(response.data.length);
      }
    });
  }

  // Unused - commented out
  // getPaged(params: PaginationParams): Observable<PagedResponse<Notification>> {
  //   let httpParams = new HttpParams();
  //   if (params.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
  //   if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
  //   return this.http.get<PagedResponse<Notification>>(this.apiUrl, { params: httpParams });
  // }

  // Unused - no backend endpoint exists
  // getSummary(): Observable<ApiResponse<NotificationSummary>> {
  //   return this.http.get<ApiResponse<NotificationSummary>>(`${this.apiUrl}/summary`);
  // }

  // Unused - commented out
  // getById(id: number): Observable<ApiResponse<Notification>> {
  //   return this.http.get<ApiResponse<Notification>>(`${this.apiUrl}/${id}`);
  // }

  // Unused - commented out
  // create(payload: CreateNotificationRequest): Observable<ApiResponse<Notification>> {
  //   return this.http.post<ApiResponse<Notification>>(this.apiUrl, payload);
  // }

  markAsRead(id: number): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.refreshUnreadCount();
        }
      })
    );
  }

  markAllAsRead(): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(response => {
        if (response.success) {
          this.unreadCountSubject.next(0);
          this.unreadNotificationsSubject.next([]);
        }
      })
    );
  }

  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        if (response.success) {
          this.refreshUnreadCount();
        }
      })
    );
  }

  clearUnreadState(): void {
    this.unreadCountSubject.next(0);
    this.unreadNotificationsSubject.next([]);
  }
}
