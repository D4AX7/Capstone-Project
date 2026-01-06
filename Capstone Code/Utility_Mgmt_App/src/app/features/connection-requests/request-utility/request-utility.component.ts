import { Component, OnInit, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
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
import { ConnectionRequestsService } from '../../../core/services/connection-requests.service';
import {
  ConnectionRequestListDto,
  ConnectionRequestDto,
  AvailableUtilityDto,
  AvailableTariffPlanDto,
  CreateConnectionRequestDto
} from '../../../core/models';

@Component({
  selector: 'app-request-utility',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
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
    MatDividerModule
  ],
  template: `
    <div class="page-container">
      <!-- Premium Header -->
      <div class="premium-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>electrical_services</mat-icon>
          </div>
          <div class="header-text">
            <h1>Request Utility Connection</h1>
            <p>Request new utility connections and track your request status</p>
          </div>
        </div>
        <div class="header-stats" *ngIf="myRequests.length > 0">
          <div class="stat-badge">
            <span class="stat-value">{{ myRequests.length }}</span>
            <span class="stat-label">Total Requests</span>
          </div>
          <div class="stat-badge pending">
            <span class="stat-value">{{ getPendingCount() }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
      </div>

      <!-- Premium Tabs -->
      <div class="premium-tabs">
        <button class="tab-btn" [class.active]="activeTab === 0" (click)="activeTab = 0">
          <mat-icon>add_circle_outline</mat-icon>
          <span>Request New Connection</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 1" (click)="activeTab = 1">
          <mat-icon>list_alt</mat-icon>
          <span>My Requests</span>
          <span class="badge" *ngIf="getPendingCount() > 0">{{ getPendingCount() }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Request New Connection Tab -->
        <div *ngIf="activeTab === 0" class="utilities-section">
          <div *ngIf="loadingUtilities" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading available utilities...</p>
          </div>

          <div *ngIf="!loadingUtilities && availableUtilities.length === 0" class="empty-state">
            <div class="empty-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <h3>All Set!</h3>
            <p>You already have access to all available utilities or have pending requests for them.</p>
          </div>

          <div *ngIf="!loadingUtilities && availableUtilities.length > 0" class="utilities-grid">
            <div *ngFor="let utility of availableUtilities" class="utility-card-premium">
              <!-- Card Header -->
              <div class="card-top">
                <div class="utility-icon-wrapper" [ngClass]="getUtilityColorClass(utility.utilityTypeName)">
                  <span class="utility-emoji">{{ getUtilityEmoji(utility.utilityTypeName) }}</span>
                </div>
                <div class="utility-info">
                  <h3>{{ utility.utilityTypeName }}</h3>
                  <span class="unit-badge">{{ utility.unitOfMeasurement }}</span>
                </div>
              </div>

              <!-- Description -->
              <p class="utility-description">{{ utility.description || getDefaultDescription(utility.utilityTypeName) }}</p>

              <div class="card-divider"></div>

              <!-- Tariff Plans -->
              <div class="plans-section">
                <div class="plans-header">
                  <span class="plans-title">Available Plans</span>
                  <span class="plans-count">({{ utility.tariffPlans.length }})</span>
                </div>
                <div class="plan-item" *ngFor="let plan of utility.tariffPlans">
                  <div class="plan-name">{{ plan.name }}</div>
                  <div class="plan-rate">
                    <span class="rate-value">₹{{ plan.ratePerUnit }}</span>
                    <span class="rate-unit">/{{ utility.unitOfMeasurement }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Button -->
              <button class="request-btn" (click)="openRequestDialog(utility)">
                <mat-icon>send</mat-icon>
                Request Connection
              </button>
            </div>
          </div>
        </div>

        <!-- My Requests Tab -->
        <div *ngIf="activeTab === 1" class="requests-section">
          <div *ngIf="loadingRequests" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div *ngIf="!loadingRequests && myRequests.length === 0" class="empty-state">
            <div class="empty-icon">
              <mat-icon>inbox</mat-icon>
            </div>
            <h3>No Requests Yet</h3>
            <p>You haven't submitted any connection requests yet.</p>
            <button class="empty-action-btn" (click)="activeTab = 0">
              <mat-icon>add</mat-icon>
              Request New Connection
            </button>
          </div>

          <!-- Requests Cards -->
          <div *ngIf="!loadingRequests && myRequests.length > 0" class="requests-grid">
            <div *ngFor="let request of myRequests" class="request-card">
              <div class="request-header">
                <div class="request-utility">
                  <span class="utility-emoji-small">{{ getUtilityEmoji(request.utilityTypeName) }}</span>
                  <span class="utility-name">{{ request.utilityTypeName }}</span>
                </div>
                <div class="status-chip" [ngClass]="getStatusClass(request.status)">
                  {{ request.status }}
                </div>
              </div>
              <div class="request-body">
                <div class="request-detail">
                  <span class="detail-label">Request #</span>
                  <span class="detail-value mono">{{ request.requestNumber }}</span>
                </div>
                <div class="request-detail">
                  <span class="detail-label">Plan</span>
                  <span class="detail-value">{{ request.tariffPlanName }}</span>
                </div>
                <div class="request-detail">
                  <span class="detail-label">Requested On</span>
                  <span class="detail-value">{{ request.createdAt | date:'MMM d, yyyy' }}</span>
                </div>
              </div>
              <div class="request-actions">
                <button class="action-btn view" (click)="viewRequestDetails(request)">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button class="action-btn cancel" *ngIf="request.status === 'Pending'" (click)="cancelRequest(request)">
                  <mat-icon>close</mat-icon>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Premium Header */
    .premium-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #92734e 0%, #b08d5b 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .header-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
    }

    .header-text p {
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
      color: var(--text-tertiary);
    }

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: #f8f7f5;
      border-radius: 10px;
      min-width: 80px;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        font-family: var(--font-serif);
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      &.pending .stat-value { color: #D97706; }
    }

    /* Premium Tabs */
    .premium-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-tertiary);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: transparent;
        transition: background 0.2s ease;
      }

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        color: #92734e;

        &::after {
          background: #92734e;
        }
      }

      .badge {
        padding: 0.125rem 0.5rem;
        background: #D97706;
        color: white;
        border-radius: 10px;
        font-size: 0.7rem;
        font-weight: 600;
      }
    }

    /* Tab Content */
    .tab-content {
      min-height: 400px;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
      color: var(--text-tertiary);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;

      .empty-icon {
        width: 80px;
        height: 80px;
        background: #f8f7f5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: #92734e;
        }
      }

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 500;
        font-family: var(--font-serif);
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-tertiary);
        max-width: 320px;
      }
    }

    .empty-action-btn {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #92734e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #7d6142;
        transform: translateY(-1px);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Utilities Grid */
    .utilities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .utility-card-premium {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      border: 1px solid #f0f0f0;
      transition: all 0.25s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .utility-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;

      &.electric { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
      &.water { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
      &.gas { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); }
      &.internet { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); }
      &.default { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); }
    }

    .utility-info h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .unit-badge {
      display: inline-block;
      margin-top: 0.25rem;
      padding: 0.25rem 0.625rem;
      background: #f8f7f5;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .utility-description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-tertiary);
      line-height: 1.5;
    }

    .card-divider {
      height: 1px;
      background: #f0f0f0;
      margin: 1.25rem 0;
    }

    .plans-section {
      margin-bottom: 1.25rem;
    }

    .plans-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .plans-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .plans-count {
      font-size: 0.8rem;
      color: var(--text-tertiary);
    }

    .plan-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #faf8f5;
      border-radius: 8px;
      margin-bottom: 0.5rem;

      &:last-child { margin-bottom: 0; }
    }

    .plan-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .plan-rate {
      .rate-value {
        font-size: 1rem;
        font-weight: 600;
        color: #059669;
      }

      .rate-unit {
        font-size: 0.8rem;
        color: var(--text-tertiary);
      }
    }

    .request-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem;
      background: #92734e;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: #7d6142;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(146, 115, 78, 0.3);
      }
    }

    /* Requests Grid */
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1rem;
    }

    .request-card {
      background: white;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid #f0f0f0;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      }
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f5f5f5;
    }

    .request-utility {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .utility-emoji-small {
      font-size: 1.25rem;
    }

    .utility-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .status-chip {
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;

      &.pending { background: #fef3c7; color: #92400e; }
      &.approved { background: #dcfce7; color: #166534; }
      &.rejected { background: #fee2e2; color: #991b1b; }
      &.cancelled { background: #f3f4f6; color: #6b7280; }
    }

    .request-body {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-bottom: 1rem;
    }

    .request-detail {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      font-size: 0.8rem;
      color: var(--text-tertiary);
    }

    .detail-value {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary);

      &.mono {
        font-family: 'SF Mono', 'Monaco', monospace;
        color: #92734e;
      }
    }

    .request-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.view {
        background: #f8f7f5;
        color: var(--text-primary);

        &:hover { background: #f0ede8; }
      }

      &.cancel {
        background: #fee2e2;
        color: #991b1b;

        &:hover { background: #fecaca; }
      }
    }

    @media (max-width: 768px) {
      .premium-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-stats {
        width: 100%;
      }

      .stat-badge {
        flex: 1;
      }

      .utilities-grid,
      .requests-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RequestUtilityComponent implements OnInit {
  availableUtilities: AvailableUtilityDto[] = [];
  myRequests: ConnectionRequestListDto[] = [];
  requestsDataSource = new MatTableDataSource<ConnectionRequestListDto>([]);
  requestColumns = ['requestNumber', 'utilityTypeName', 'tariffPlanName', 'status', 'createdAt', 'actions'];

  loadingUtilities = false;
  loadingRequests = false;
  activeTab = 0;

  constructor(
    private connectionRequestsService: ConnectionRequestsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvailableUtilities();
    this.loadMyRequests();
  }

  getPendingCount(): number {
    return this.myRequests.filter(r => r.status === 'Pending').length;
  }

  getUtilityEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return '⚡';
    if (lower.includes('water')) return '💧';
    if (lower.includes('gas')) return '🔥';
    if (lower.includes('internet')) return '📡';
    return '⚙️';
  }

  getUtilityColorClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'electric';
    if (lower.includes('water')) return 'water';
    if (lower.includes('gas')) return 'gas';
    if (lower.includes('internet')) return 'internet';
    return 'default';
  }

  getDefaultDescription(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'Reliable electricity supply for your home or business';
    if (lower.includes('water')) return 'Clean and safe water supply service';
    if (lower.includes('gas')) return 'Natural gas supply for heating and cooking';
    if (lower.includes('internet')) return 'High-speed internet connectivity';
    return 'Utility service connection';
  }

  loadAvailableUtilities(): void {
    this.loadingUtilities = true;
    this.connectionRequestsService.getAvailableUtilities().subscribe({
      next: (response) => {
        this.availableUtilities = response.data || [];
        this.loadingUtilities = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingUtilities = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMyRequests(): void {
    this.loadingRequests = true;
    this.connectionRequestsService.getMyRequests().subscribe({
      next: (response) => {
        this.myRequests = response.data || [];
        this.requestsDataSource.data = this.myRequests;
        this.loadingRequests = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingRequests = false;
        this.cdr.detectChanges();
      }
    });
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

  openRequestDialog(utility: AvailableUtilityDto): void {
    const dialogRef = this.dialog.open(CreateRequestDialogComponent, {
      width: '500px',
      data: utility
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAvailableUtilities();
        this.loadMyRequests();
      }
    });
  }

  viewRequestDetails(request: ConnectionRequestListDto): void {
    this.connectionRequestsService.getById(request.id).subscribe({
      next: (response) => {
        this.dialog.open(RequestDetailsDialogComponent, {
          width: '500px',
          data: response.data
        });
      },
      error: () => {
        this.snackBar.open('Failed to load request details', 'Close', { duration: 3000 });
      }
    });
  }

  cancelRequest(request: ConnectionRequestListDto): void {
    if (confirm(`Are you sure you want to cancel request ${request.requestNumber}?`)) {
      this.connectionRequestsService.cancelRequest(request.id).subscribe({
        next: () => {
          this.snackBar.open('Request cancelled successfully', 'Close', { duration: 3000 });
          this.loadAvailableUtilities();
          this.loadMyRequests();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to cancel request', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

// Dialog to create a new connection request
@Component({
  selector: 'app-create-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">{{ getUtilityIcon(data.utilityTypeName) }}</mat-icon>
      Request {{ data.utilityTypeName }} Connection
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Tariff Plan</mat-label>
          <mat-select formControlName="tariffPlanId" required>
            <mat-option *ngFor="let plan of data.tariffPlans" [value]="plan.id">
              {{ plan.name }} - ₹{{ plan.ratePerUnit }}/{{ data.unitOfMeasurement }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('tariffPlanId')?.hasError('required')">
            Please select a tariff plan
          </mat-error>
        </mat-form-field>

        <div class="plan-details" *ngIf="selectedPlan">
          <h4>Plan Details</h4>
          <div class="detail-row">
            <span>Rate per Unit:</span>
            <strong>₹{{ selectedPlan.ratePerUnit }}</strong>
          </div>
          <div class="detail-row">
            <span>Fixed Charges:</span>
            <strong>₹{{ selectedPlan.fixedCharges }}</strong>
          </div>
          <div class="detail-row">
            <span>Tax:</span>
            <strong>{{ selectedPlan.taxPercentage }}%</strong>
          </div>
          <p class="plan-description" *ngIf="selectedPlan.description">{{ selectedPlan.description }}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Load Sanctioned (Optional)</mat-label>
          <input matInput type="number" formControlName="loadSanctioned" placeholder="e.g., 5 kW">
          <mat-hint>Applicable for electricity connections</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Installation Address (Optional)</mat-label>
          <textarea matInput formControlName="installationAddress" rows="2" 
                    placeholder="Enter specific installation address if different from registered address"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks (Optional)</mat-label>
          <textarea matInput formControlName="remarks" rows="2" 
                    placeholder="Any additional information or special requirements"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || submitting" (click)="submit()">
        <mat-icon>send</mat-icon>
        {{ submitting ? 'Submitting...' : 'Submit Request' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon {
      vertical-align: middle;
      margin-right: 8px;
      color: #3b82f6;
    }

    .full-width { width: 100%; margin-bottom: 1rem; }

    .plan-details {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;

      h4 { margin: 0 0 0.75rem; font-size: 0.875rem; color: #1e293b; }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.875rem;

        span { color: #64748b; }
        strong { color: #1e293b; }
      }

      .plan-description {
        margin: 0.75rem 0 0;
        padding-top: 0.75rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.8rem;
        color: #64748b;
      }
    }
  `]
})
export class CreateRequestDialogComponent {
  form: FormGroup;
  submitting = false;
  selectedPlan: AvailableTariffPlanDto | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateRequestDialogComponent>,
    private connectionRequestsService: ConnectionRequestsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: AvailableUtilityDto
  ) {
    this.form = this.fb.group({
      tariffPlanId: ['', Validators.required],
      loadSanctioned: [null],
      installationAddress: [''],
      remarks: ['']
    });

    this.form.get('tariffPlanId')?.valueChanges.subscribe(planId => {
      this.selectedPlan = this.data.tariffPlans.find(p => p.id === planId) || null;
    });
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    return 'settings';
  }

  submit(): void {
    if (this.form.invalid) return;

    this.submitting = true;
    const payload: CreateConnectionRequestDto = {
      utilityTypeId: this.data.utilityTypeId,
      tariffPlanId: this.form.value.tariffPlanId,
      loadSanctioned: this.form.value.loadSanctioned,
      installationAddress: this.form.value.installationAddress,
      remarks: this.form.value.remarks
    };

    this.connectionRequestsService.createRequest(payload).subscribe({
      next: () => {
        this.snackBar.open('Connection request submitted successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Failed to submit request', 'Close', { duration: 3000 });
      }
    });
  }
}

// Dialog to view request details
@Component({
  selector: 'app-request-details-dialog',
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
          <strong>{{ data.createdAt | date:'medium' }}</strong>
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
          <span>Your Remarks:</span>
          <strong>{{ data.remarks }}</strong>
        </div>
      </div>

      <mat-divider *ngIf="data.processedAt"></mat-divider>

      <div class="detail-section" *ngIf="data.processedAt">
        <h4>Processing Information</h4>
        <div class="detail-row">
          <span>Processed On:</span>
          <strong>{{ data.processedAt | date:'medium' }}</strong>
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
export class RequestDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConnectionRequestDto) {}

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }
}
