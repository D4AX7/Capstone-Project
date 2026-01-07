import { Component, OnInit, ChangeDetectorRef, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { ConnectionRequestsService } from '../../../core/services/connection-requests.service';
import {
  ConnectionRequestListDto,
  ConnectionRequestDto,
  ProcessConnectionRequestDto
} from '../../../core/models';

@Component({
  selector: 'app-manage-requests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Connection Requests</h1>
          <p>Review and process consumer connection requests</p>
        </div>
        <div class="header-stats">
          <div class="stat-card pending">
            <mat-icon>pending_actions</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ pendingCount }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <!-- Filters -->
          <div class="filters">
            <mat-form-field appearance="outline" class="status-filter">
              <mat-label>Status Filter</mat-label>
              <mat-select [(value)]="statusFilter" (selectionChange)="onStatusFilterChange()">
                <mat-option value="">All Requests</mat-option>
                <mat-option value="Pending">Pending</mat-option>
                <mat-option value="Approved">Approved</mat-option>
                <mat-option value="Rejected">Rejected</mat-option>
                <mat-option value="Cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput placeholder="Search by request number, consumer..." 
                     [(ngModel)]="searchTerm" (keyup.enter)="search()">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <button mat-stroked-button (click)="loadRequests()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading && dataSource.data.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>No Requests Found</h3>
            <p>There are no connection requests matching your criteria.</p>
          </div>

          <!-- Table -->
          <table mat-table [dataSource]="dataSource" *ngIf="!loading && dataSource.data.length > 0">
            <ng-container matColumnDef="requestNumber">
              <th mat-header-cell *matHeaderCellDef>Request #</th>
              <td mat-cell *matCellDef="let row">
                <span class="request-number">{{ row.requestNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="consumerName">
              <th mat-header-cell *matHeaderCellDef>Consumer</th>
              <td mat-cell *matCellDef="let row">
                <div class="consumer-cell">
                  <strong>{{ row.consumerName }}</strong>
                  <span class="consumer-num">{{ row.consumerNumber }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="utilityTypeName">
              <th mat-header-cell *matHeaderCellDef>Utility</th>
              <td mat-cell *matCellDef="let row">
                <div class="utility-cell">
                  <mat-icon>{{ getUtilityIcon(row.utilityTypeName) }}</mat-icon>
                  {{ row.utilityTypeName }}
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="tariffPlanName">
              <th mat-header-cell *matHeaderCellDef>Plan</th>
              <td mat-cell *matCellDef="let row">{{ row.tariffPlanName }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip [ngClass]="getStatusClass(row.status)">
                  {{ row.status }}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Requested</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'M/d/yy, h:mm a' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button matTooltip="View Details" (click)="viewDetails(row)">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Process Request" color="primary"
                        *ngIf="row.status === 'Pending'" (click)="openProcessDialog(row)">
                  <mat-icon>task_alt</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                [class.pending-row]="row.status === 'Pending'"></tr>
          </table>

          <!-- Paginator -->
          <mat-paginator *ngIf="!loading && totalRecords > 0"
            [length]="totalRecords"
            [pageSize]="pageSize"
            [pageIndex]="pageNumber - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
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

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      background: #f8fafc;

      &.pending {
        background: #fef3c7;
        mat-icon { color: #d97706; }
        .stat-value { color: #92400e; }
      }

      mat-icon { font-size: 28px; width: 28px; height: 28px; }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;

      .status-filter { width: 180px; }
      .search-field { flex: 1; max-width: 300px; }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      text-align: center;
      color: #64748b;

      mat-icon { font-size: 64px; width: 64px; height: 64px; margin-bottom: 1rem; opacity: 0.5; }
      h3 { margin: 0 0 0.5rem; color: #1e293b; }
      p { margin: 0; }
    }

    table { width: 100%; }

    .request-number {
      font-family: monospace;
      font-weight: 600;
      color: #3b82f6;
    }

    .consumer-cell {
      display: flex;
      flex-direction: column;
      
      strong { color: #1e293b; }
      .consumer-num { font-size: 0.8rem; color: #64748b; }
    }

    .utility-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      mat-icon { color: #3b82f6; font-size: 20px; }
    }

    mat-chip {
      &.pending { background-color: #fef3c7 !important; color: #92400e !important; }
      &.approved { background-color: #dcfce7 !important; color: #166534 !important; }
      &.rejected { background-color: #fee2e2 !important; color: #991b1b !important; }
      &.cancelled { background-color: #e2e8f0 !important; color: #475569 !important; }
    }

    .pending-row {
      background-color: #fffbeb;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
  `]
})
export class ManageRequestsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<ConnectionRequestListDto>([]);
  displayedColumns = ['requestNumber', 'consumerName', 'utilityTypeName', 'tariffPlanName', 'status', 'createdAt', 'actions'];

  loading = false;
  pendingCount = 0;
  totalRecords = 0;
  pageNumber = 1;
  pageSize = 10;
  statusFilter = '';
  searchTerm = '';

  constructor(
    private connectionRequestsService: ConnectionRequestsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadPendingCount();
  }

  loadRequests(): void {
    this.loading = true;
    this.connectionRequestsService.getAll({
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      status: this.statusFilter
    }).subscribe({
      next: (response) => {
        // Convert UTC dates to local time
        const data = (response.data || []).map(item => ({
          ...item,
          createdAt: this.convertUtcToLocal(item.createdAt)
        }));
        this.dataSource.data = data;
        this.totalRecords = response.totalRecords;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingCount(): void {
    this.connectionRequestsService.getPendingRequests().subscribe({
      next: (response) => {
        this.pendingCount = response.data?.length || 0;
        this.cdr.detectChanges();
      }
    });
  }

  onStatusFilterChange(): void {
    this.pageNumber = 1;
    this.loadRequests();
  }

  search(): void {
    this.pageNumber = 1;
    this.loadRequests();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRequests();
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    return 'settings';
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  convertUtcToLocal(utcDateString: string): string {
    if (!utcDateString) return utcDateString;
    // If the date string doesn't end with 'Z', append it to treat as UTC
    const dateStr = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z';
    return new Date(dateStr).toISOString();
  }

  viewDetails(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        this.dialog.open(AdminRequestDetailsDialogComponent, {
          width: '550px',
          data: response.data
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }

  openProcessDialog(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(ProcessRequestDialogComponent, {
          width: '550px',
          data: response.data
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.loadRequests();
            this.loadPendingCount();
          }
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }
}

// Dialog to view request details (Admin view)
@Component({
  selector: 'app-admin-request-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>
      Request Details
      <mat-chip [ngClass]="getStatusClass(data.status)" class="status-chip">{{ data.status }}</mat-chip>
    </h2>
    <mat-dialog-content>
      <div class="detail-section">
        <h4>Request Information</h4>
        <div class="detail-row">
          <span>Request Number:</span>
          <strong class="request-num">{{ data.requestNumber }}</strong>
        </div>
        <div class="detail-row">
          <span>Requested On:</span>
          <strong>{{ getLocalDate(data.createdAt) | date:'medium' }}</strong>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Consumer Details</h4>
        <div class="detail-row">
          <span>Consumer Name:</span>
          <strong>{{ data.consumerName }}</strong>
        </div>
        <div class="detail-row">
          <span>Consumer Number:</span>
          <strong>{{ data.consumerNumber }}</strong>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="detail-section">
        <h4>Utility Details</h4>
        <div class="detail-row">
          <span>Utility Type:</span>
          <strong>{{ data.utilityTypeName }}</strong>
        </div>
        <div class="detail-row">
          <span>Tariff Plan:</span>
          <strong>{{ data.tariffPlanName }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.loadSanctioned">
          <span>Load Sanctioned:</span>
          <strong>{{ data.loadSanctioned }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.installationAddress">
          <span>Installation Address:</span>
          <strong>{{ data.installationAddress }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.remarks">
          <span>Consumer Remarks:</span>
          <strong>{{ data.remarks }}</strong>
        </div>
      </div>

      <mat-divider *ngIf="data.processedAt"></mat-divider>

      <div class="detail-section" *ngIf="data.processedAt">
        <h4>Processing Information</h4>
        <div class="detail-row">
          <span>Processed On:</span>
          <strong>{{ getLocalDate(data.processedAt) | date:'medium' }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.processedByUserName">
          <span>Processed By:</span>
          <strong>{{ data.processedByUserName }}</strong>
        </div>
        <div class="detail-row" *ngIf="data.adminRemarks">
          <span>Admin Remarks:</span>
          <strong>{{ data.adminRemarks }}</strong>
        </div>
        <div class="detail-row success" *ngIf="data.createdConnectionNumber">
          <span>Connection Number:</span>
          <strong>{{ data.createdConnectionNumber }}</strong>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-chip {
      font-size: 0.75rem;
      &.pending { background-color: #fef3c7 !important; color: #92400e !important; }
      &.approved { background-color: #dcfce7 !important; color: #166534 !important; }
      &.rejected { background-color: #fee2e2 !important; color: #991b1b !important; }
      &.cancelled { background-color: #e2e8f0 !important; color: #475569 !important; }
    }

    .detail-section {
      padding: 1rem 0;

      h4 {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;

      span { color: #64748b; }
      strong { color: #1e293b; text-align: right; max-width: 60%; }

      &.success strong { color: #059669; }
    }

    .request-num {
      font-family: monospace;
      color: #3b82f6 !important;
    }

    mat-divider { margin: 0.5rem 0; }
  `]
})
export class AdminRequestDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto) {}

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  getLocalDate(utcDateString: string): Date {
    if (!utcDateString) return new Date();
    const dateStr = utcDateString.endsWith('Z') ? utcDateString : utcDateString + 'Z';
    return new Date(dateStr);
  }
}

// Dialog to process (approve/reject) a request
@Component({
  selector: 'app-process-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">task_alt</mat-icon>
      Process Connection Request
    </h2>
    <mat-dialog-content>
      <div class="request-summary">
        <div class="summary-header">
          <span class="request-num">{{ data.requestNumber }}</span>
          <mat-chip class="pending">Pending</mat-chip>
        </div>
        <div class="summary-details">
          <div class="detail">
            <span class="label">Consumer:</span>
            <span class="value">{{ data.consumerName }} ({{ data.consumerNumber }})</span>
          </div>
          <div class="detail">
            <span class="label">Utility:</span>
            <span class="value">{{ data.utilityTypeName }}</span>
          </div>
          <div class="detail">
            <span class="label">Plan:</span>
            <span class="value">{{ data.tariffPlanName }}</span>
          </div>
          <div class="detail" *ngIf="data.loadSanctioned">
            <span class="label">Load:</span>
            <span class="value">{{ data.loadSanctioned }}</span>
          </div>
          <div class="detail" *ngIf="data.remarks">
            <span class="label">Remarks:</span>
            <span class="value">{{ data.remarks }}</span>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <form [formGroup]="form" class="process-form">
        <h4>Your Decision</h4>

        <div class="decision-buttons">
          <button mat-stroked-button type="button"
                  [class.selected]="decision === 'approve'"
                  class="approve-btn"
                  (click)="setDecision('approve')">
            <mat-icon>check_circle</mat-icon>
            Approve
          </button>
          <button mat-stroked-button type="button"
                  [class.selected]="decision === 'reject'"
                  class="reject-btn"
                  (click)="setDecision('reject')">
            <mat-icon>cancel</mat-icon>
            Reject
          </button>
        </div>

        <mat-form-field appearance="outline" class="full-width" *ngIf="decision === 'approve'">
          <mat-label>Meter Number</mat-label>
          <input matInput formControlName="meterNumber" placeholder="e.g., ELE-M005">
          <mat-icon matPrefix>speed</mat-icon>
          <mat-hint>Enter the meter number to assign to this connection</mat-hint>
          <mat-error *ngIf="form.get('meterNumber')?.hasError('required')">
            Meter number is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Admin Remarks {{ decision === 'reject' ? '(Required)' : '(Optional)' }}</mat-label>
          <textarea matInput formControlName="adminRemarks" rows="3"
                    [placeholder]="decision === 'reject' ? 'Please provide reason for rejection' : 'Add any remarks...'"></textarea>
          <mat-error *ngIf="form.get('adminRemarks')?.hasError('required')">
            Please provide a reason for rejection
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button 
              [color]="decision === 'approve' ? 'primary' : 'warn'"
              [disabled]="!decision || form.invalid || submitting"
              (click)="submit()">
        <mat-icon>{{ decision === 'approve' ? 'check' : 'close' }}</mat-icon>
        {{ submitting ? 'Processing...' : (decision === 'approve' ? 'Approve Request' : 'Reject Request') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #3b82f6;
    }

    .request-summary {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;

      .summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .request-num {
        font-family: monospace;
        font-weight: 600;
        font-size: 1rem;
        color: #3b82f6;
      }

      .summary-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .detail {
        display: flex;
        gap: 0.5rem;
        font-size: 0.875rem;

        .label { color: #64748b; min-width: 80px; }
        .value { color: #1e293b; font-weight: 500; }
      }
    }

    mat-chip.pending { background-color: #fef3c7 !important; color: #92400e !important; }

    .process-form {
      padding-top: 1rem;

      h4 {
        margin: 0 0 1rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .decision-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;

      button {
        flex: 1;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 8px;
        transition: all 0.2s;

        &.approve-btn {
          &:hover, &.selected {
            background-color: #dcfce7;
            border-color: #16a34a;
            color: #16a34a;
          }
        }

        &.reject-btn {
          &:hover, &.selected {
            background-color: #fee2e2;
            border-color: #dc2626;
            color: #dc2626;
          }
        }

        &.selected {
          border-width: 2px;
        }
      }
    }

    .full-width { width: 100%; margin-bottom: 1rem; }

    mat-divider { margin: 1rem 0; }
  `]
})
export class ProcessRequestDialogComponent {
  form: FormGroup;
  decision: 'approve' | 'reject' | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProcessRequestDialogComponent>,
    private connectionRequestsService: ConnectionRequestsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto
  ) {
    this.form = this.fb.group({
      meterNumber: [''],
      adminRemarks: ['']
    });
  }

  setDecision(decision: 'approve' | 'reject'): void {
    this.decision = decision;
    
    // Update validation based on decision
    const remarksControl = this.form.get('adminRemarks');
    const meterNumberControl = this.form.get('meterNumber');
    
    if (decision === 'reject') {
      remarksControl?.setValidators([Validators.required]);
      meterNumberControl?.clearValidators();
      meterNumberControl?.setValue(''); // Clear meter number when rejecting
    } else {
      // Meter number required for approval
      meterNumberControl?.setValidators([Validators.required]);
      remarksControl?.clearValidators();
    }
    remarksControl?.updateValueAndValidity();
    meterNumberControl?.updateValueAndValidity();
  }

  submit(): void {
    if (!this.decision || this.form.invalid) return;

    this.submitting = true;
    const payload: ProcessConnectionRequestDto = {
      approve: this.decision === 'approve',
      adminRemarks: this.form.value.adminRemarks,
      meterNumber: this.form.value.meterNumber
    };

    this.connectionRequestsService.processRequest(this.data.id, payload).subscribe({
      next: () => {
        const message = this.decision === 'approve' 
          ? 'Request approved! Connection created successfully.' 
          : 'Request rejected successfully.';
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Failed to process request', 'Close', { duration: 3000 });
      }
    });
  }
}
