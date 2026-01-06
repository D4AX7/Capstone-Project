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
import { MatMenuModule } from '@angular/material/menu';
import { BillsService } from '../../../core/services/bills.service';
import { AuthService } from '../../../core/services/auth.service';
import { BillListItem, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-bill-list',
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
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>{{ isConsumer ? 'My Bills' : 'Bills' }}</h1>
          <p>{{ isConsumer ? 'View your utility bills' : 'Manage utility bills' }}</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/billing/generate" *ngIf="canGenerateBill">
          <mat-icon>receipt_long</mat-icon>
          Generate Bill
        </button>
      </div>

      <mat-card class="list-card">
        <mat-card-content>
          <div class="filter-bar" *ngIf="!isConsumer">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search by bill # or consumer">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="selectedStatus" (selectionChange)="search()">
                <mat-option [value]="null">All</mat-option>
                <mat-option value="Due">Due</mat-option>
                <mat-option value="Paid">Paid</mat-option>
                <mat-option value="Overdue">Overdue</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="clearFilters()">Clear</button>
          </div>

          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="billNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Bill #</th>
                <td mat-cell *matCellDef="let row">
                  <a [routerLink]="['/billing', row.id]" class="link">{{ row.billNumber }}</a>
                </td>
              </ng-container>

              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Consumer</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>

              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="billingPeriod">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let row">{{ row.billingPeriod }}</td>
              </ng-container>

              <ng-container matColumnDef="dueAmount">
                <th mat-header-cell *matHeaderCellDef>Due</th>
                <td mat-cell *matCellDef="let row" class="amount-cell">₹{{ row.dueAmount | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="penaltyAmount">
                <th mat-header-cell *matHeaderCellDef>Penalty</th>
                <td mat-cell *matCellDef="let row" class="penalty-cell">₹{{ row.penaltyAmount | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="outstandingBalance">
                <th mat-header-cell *matHeaderCellDef>Outstanding</th>
                <td mat-cell *matCellDef="let row" class="due-cell">₹{{ row.outstandingBalance | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Due Date</th>
                <td mat-cell *matCellDef="let row" [class.overdue]="isOverdue(row)">
                  {{ row.dueDate | date:'mediumDate' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [ngClass]="getStatusClass(row.status)">
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/billing', row.id]">
                      <mat-icon>visibility</mat-icon> View
                    </button>
                    <button mat-menu-item [routerLink]="['/payments/new']" [queryParams]="{billId: row.id}" *ngIf="canRecordPayment && row.status !== 'Paid'">
                      <mat-icon>payment</mat-icon> Record Payment
                    </button>
                    <button mat-menu-item [routerLink]="['/payments/new']" [queryParams]="{billId: row.id}" *ngIf="isConsumer && row.status !== 'Paid'">
                      <mat-icon>payment</mat-icon> Pay Now
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  No bills found
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

    .amount-cell { font-weight: 600; }
    .penalty-cell { font-weight: 600; color: #f59e0b; }
    .due-cell { font-weight: 600; color: #dc2626; }
    .overdue { color: #dc2626; font-weight: 500; }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-align: center;
    }

    .status-badge.status-paid {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }

    .status-badge.status-due {
      background-color: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde047;
    }

    .status-badge.status-overdue {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }
  `]
})
export class BillListComponent implements OnInit {
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<BillListItem>([]);
  displayedColumns = ['billNumber', 'consumerName', 'utilityType', 'billingPeriod', 'dueAmount', 'penaltyAmount', 'outstandingBalance', 'dueDate', 'status', 'actions'];

  loading = false;
  searchTerm = '';
  selectedStatus: string | null = null;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canRecordPayment = false;
  canGenerateBill = false;
  isConsumer = false;

  constructor(
    private billsService: BillsService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // BillingOfficer can only generate bills, not record payments
    // AccountOfficer is view-only - only Admin can record payments
    this.canRecordPayment = this.authService.hasRole(['Admin']);
    this.canGenerateBill = this.authService.hasRole(['Admin', 'BillingOfficer']);
    this.isConsumer = this.authService.hasRole(['Consumer']);
  }

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    
    // Consumer uses a different API endpoint
    if (this.isConsumer) {
      this.billsService.getMyBills().subscribe({
        next: (response) => {
          this.loading = false;
          console.log('My Bills API response:', response);
          // Map the response data to include dueAmount (totalAmount - penaltyAmount)
          const bills = (response.data || []).map(bill => ({
            ...bill,
            dueAmount: bill.dueAmount ?? (bill.totalAmount - (bill.penaltyAmount || 0))
          }));
          this.dataSource.data = bills;
          this.totalRecords = bills.length;
          this.cdr.detectChanges();
        },
        error: (err) => { 
          console.error('Error loading my bills:', err);
          this.loading = false; 
          this.cdr.detectChanges(); 
        }
      });
      return;
    }

    // Staff uses paginated endpoint
    const params: PaginationParams & { status?: string } = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      status: this.selectedStatus ?? undefined
    };

    this.billsService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Bills API response:', response);
        if (response.data && response.data.length > 0) {
          console.log('First bill data:', response.data[0]);
        }
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadBills();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBills();
  }

  isOverdue(bill: BillListItem): boolean {
    return new Date(bill.dueDate) < new Date() && bill.status !== 'Paid';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Due': return 'status-due';
      case 'Overdue': return 'status-overdue';
      default: return '';
    }
  }
}
