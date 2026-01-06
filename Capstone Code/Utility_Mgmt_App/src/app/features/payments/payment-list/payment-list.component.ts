import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentsService } from '../../../core/services/payments.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentListItem, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>{{ isConsumer ? 'My Payments' : 'Payments' }}</h1>
          <p>{{ isConsumer ? 'View your payment history' : 'Track and manage payments' }}</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/payments/new" *ngIf="canRecordPayment">
          <mat-icon>add</mat-icon>
          Record Payment
        </button>
      </div>

      <mat-card class="list-card">
        <mat-card-content>
          <div class="filter-bar" *ngIf="!isConsumer">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search by reference, consumer, bill...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="!isAccountOfficer">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="search()">
                <mat-option [value]="null">All</mat-option>
                <mat-option value="Completed">Completed</mat-option>
                <mat-option value="Pending">Pending</mat-option>
                <mat-option value="Failed">Failed</mat-option>
                <mat-option value="Refunded">Refunded</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Method</mat-label>
              <mat-select [(ngModel)]="selectedMethod" (selectionChange)="search()">
                <mat-option [value]="null">All</mat-option>
                <mat-option value="Cash" *ngIf="!isConsumer">Cash</mat-option>
                <mat-option value="CreditCard">Credit Card</mat-option>
                <mat-option value="DebitCard">Debit Card</mat-option>
                <mat-option value="UPI">UPI</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="clearFilters()">Clear</button>
          </div>

          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="paymentNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Payment #</th>
                <td mat-cell *matCellDef="let row">{{ row.paymentNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Consumer</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>

              <ng-container matColumnDef="billNumber">
                <th mat-header-cell *matHeaderCellDef>Bill #</th>
                <td mat-cell *matCellDef="let row">
                  <a [routerLink]="['/billing', row.billId]" class="link">{{ row.billNumber }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row" class="amount-cell">₹{{ row.amount | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="paymentMethod">
                <th mat-header-cell *matHeaderCellDef>Method</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip class="method-chip">{{ row.paymentMethod }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.paymentDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip [ngClass]="getStatusClass(row.status)">
                    {{ row.status }}
                  </mat-chip>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  No payments found
                </td>
              </tr>
            </table>

            <mat-paginator
              [length]="totalRecords"
              [pageIndex]="pageNumber - 1"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .search-field { flex: 1; min-width: 250px; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .no-data { text-align: center; padding: 2rem; color: #64748b; }

    .link { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }

    .amount-cell { font-weight: 600; color: #16a34a; }

    mat-chip {
      font-size: 0.75rem;
      &.status-completed { background-color: #dcfce7 !important; color: #166534 !important; }
      &.status-pending { background-color: #fef9c3 !important; color: #854d0e !important; }
      &.status-failed { background-color: #fee2e2 !important; color: #991b1b !important; }
      &.status-refunded { background-color: #dbeafe !important; color: #1e40af !important; }
      &.method-chip { background-color: #f1f5f9 !important; color: #475569 !important; }
    }
  `]
})
export class PaymentListComponent implements OnInit {
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<PaymentListItem>([]);
  displayedColumns: string[] = [];

  loading = false;
  searchTerm = '';
  selectedStatus: string | null = null;
  selectedMethod: string | null = null;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  
  // Role-based flags
  isConsumer = false;
  isAccountOfficer = false;
  canRecordPayment = false;

  constructor(
    private paymentsService: PaymentsService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isConsumer = this.authService.hasRole(['Consumer']);
    this.isAccountOfficer = this.authService.hasRole(['AccountOfficer']);
    // Only Admin can record payments - AccountOfficer is view-only
    this.canRecordPayment = this.authService.hasRole(['Admin']);
    
    // Set columns based on role - AccountOfficer doesn't see status column
    if (this.isAccountOfficer) {
      this.displayedColumns = ['paymentNumber', 'consumerName', 'billNumber', 'amount', 'paymentMethod', 'paymentDate'];
    } else {
      this.displayedColumns = ['paymentNumber', 'consumerName', 'billNumber', 'amount', 'paymentMethod', 'paymentDate', 'status'];
    }
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    
    // Consumer uses different API endpoint
    if (this.isConsumer) {
      this.paymentsService.getMyPayments().subscribe({
        next: (response) => {
          this.loading = false;
          console.log('My Payments API response:', response);
          this.dataSource.data = response.data || [];
          this.totalRecords = response.data?.length || 0;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading my payments:', err);
          this.loading = false; 
          this.cdr.detectChanges(); 
        }
      });
      return;
    }
    
    // Staff uses paginated endpoint
    const params: PaginationParams & { status?: string; paymentMethod?: string } = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus ?? undefined,
      paymentMethod: this.selectedMethod ?? undefined
    };

    this.paymentsService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadPayments();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedMethod = null;
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPayments();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'Pending': return 'status-pending';
      case 'Failed': return 'status-failed';
      case 'Refunded': return 'status-refunded';
      default: return '';
    }
  }
}
