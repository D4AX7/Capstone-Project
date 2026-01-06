import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../services/storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storage: StorageService) {}
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const token = this.storage.getToken();
      const authReq = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
      return next.handle(authReq);
    }
}
