import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ApiResponse, 
  PagedResponse,
  PaginationParams,
  DateRangeParams,
  Payment, 
  PaymentListItem,
  PaymentSummary,
  CreatePaymentRequest, 
  UpdatePaymentStatusRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getAll(params?: PaginationParams & DateRangeParams & { paymentMethod?: string }): Observable<PagedResponse<PaymentListItem>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('PageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('PageSize', params.pageSize.toString());
    if (params?.searchTerm) httpParams = httpParams.set('SearchTerm', params.searchTerm);
    if (params?.sortBy) httpParams = httpParams.set('SortBy', params.sortBy);
    if (params?.sortDescending) httpParams = httpParams.set('SortDescending', params.sortDescending.toString());
    if (params?.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<PagedResponse<PaymentListItem>>(this.apiUrl, { params: httpParams });
  }

  // Unused - commented out
  // getById(id: number): Observable<ApiResponse<Payment>> {
  //   return this.http.get<ApiResponse<Payment>>(`${this.apiUrl}/${id}`);
  // }

  // Unused - commented out
  // getByBill(billId: number): Observable<ApiResponse<Payment[]>> {
  //   return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/bill/${billId}`);
  // }

  // Unused - commented out
  // getByConsumer(consumerId: number): Observable<ApiResponse<PaymentListItem[]>> {
  //   return this.http.get<ApiResponse<PaymentListItem[]>>(`${this.apiUrl}/consumer/${consumerId}`);
  // }

  getMyPayments(): Observable<ApiResponse<PaymentListItem[]>> {
    return this.http.get<ApiResponse<PaymentListItem[]>>(`${this.apiUrl}/my-payments`);
  }

  getSummary(params?: DateRangeParams): Observable<ApiResponse<PaymentSummary>> {
    let httpParams = new HttpParams();
    if (params?.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params?.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get<ApiResponse<PaymentSummary>>(`${this.apiUrl}/summary`, { params: httpParams });
  }

  create(payload: CreatePaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(this.apiUrl, payload);
  }

  // Consumer pays their own bill
  payMyBill(payload: CreatePaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(`${this.apiUrl}/pay-my-bill`, payload);
  }

  // Unused - commented out
  // updateStatus(id: number, payload: UpdatePaymentStatusRequest): Observable<ApiResponse<Payment>> {
  //   return this.http.put<ApiResponse<Payment>>(`${this.apiUrl}/${id}/status`, payload);
  // }

  // Unused - commented out
  // delete(id: number): Observable<ApiResponse<boolean>> {
  //   return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  // }
}
