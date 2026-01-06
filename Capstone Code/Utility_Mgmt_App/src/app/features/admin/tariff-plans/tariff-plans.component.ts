import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TariffPlansService } from '../../../core/services/tariff-plans.service';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { TariffPlan, UtilityType, CreateTariffPlanRequest, UpdateTariffPlanRequest } from '../../../core/models';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-tariff-plans',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="header-content">
            <h1>Tariff Plans</h1>
            <p>Manage pricing plans for utility types</p>
          </div>
        </div>
        <button class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          ADD TARIFF PLAN
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon total-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataSource.data.length }}</div>
            <div class="stat-label">TOTAL PLANS</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getActivePlansCount() }}</div>
            <div class="stat-label">ACTIVE PLANS</div>
          </div>
        </div>
      </div>

      <!-- Tariff Plans List Card -->
      <div class="list-card">
        <div class="card-header">
          <h2>Tariff Plans List</h2>
          <span class="records-count">{{ dataSource.data.length }} plans</span>
        </div>

        <div *ngIf="loading$ | async" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-container" *ngIf="!(loading$ | async)">
          <table class="data-table">
            <thead>
              <tr>
                <th>PLAN NAME</th>
                <th>UTILITY TYPE</th>
                <th>BASE RATE</th>
                <th>RATE/UNIT</th>
                <th>TAX %</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of dataSource.data">
                <td class="col-name">
                  <div class="name-with-icon">
                    <span class="utility-icon" [ngClass]="getUtilityClass(row.utilityTypeName)">
                      <mat-icon>{{ getUtilityIcon(row.utilityTypeName) }}</mat-icon>
                    </span>
                    {{ row.name }}
                  </div>
                </td>
                <td class="col-utility">
                  <span class="utility-badge" [ngClass]="getUtilityClass(row.utilityTypeName)">
                    {{ row.utilityTypeName }}
                  </span>
                </td>
                <td class="col-rate">₹{{ row.fixedCharges || 0 | number:'1.2-2' }}</td>
                <td class="col-rate">₹{{ row.ratePerUnit | number:'1.2-2' }}</td>
                <td class="col-tax">{{ row.taxPercentage || 0 }}%</td>
                <td class="col-status">
                  <span class="status-badge" [ngClass]="row.isActive ? 'active' : 'inactive'">
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="col-actions">
                  <button class="action-btn edit-btn" matTooltip="Edit" (click)="openDialog(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="action-btn delete-btn" matTooltip="Delete" (click)="delete(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="dataSource.data.length === 0">
                <td colspan="7" class="no-data">No tariff plans found. Click "ADD TARIFF PLAN" to create one.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }

    /* Page Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #666;
      }
    }

    .header-content {
      h1 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a1a;
      }
      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #666;
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #8b7d5e;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: #7a6d51;
      }
    }

    /* Stats Cards */
    .stats-container {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      min-width: 180px;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      &.total-icon {
        background: #f5f5f5;
        mat-icon { color: #666; }
      }

      &.active-icon {
        background: #e8f5e9;
        mat-icon { color: #4caf50; }
      }
    }

    .stat-info {
      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
      }
      .stat-label {
        font-size: 0.75rem;
        color: #888;
        font-weight: 500;
        letter-spacing: 0.025em;
      }
    }

    /* List Card */
    .list-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;

      h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1a1a1a;
        font-style: italic;
      }

      .records-count {
        font-size: 0.8rem;
        color: #888;
        background: #f5f5f5;
        padding: 0.35rem 0.75rem;
        border-radius: 4px;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        tr {
          background: #f8f8f6;
        }
        th {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e8e8e8;

          &:last-child {
            text-align: center;
          }
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #e8e8e8;
          transition: background 0.15s;

          &:hover {
            background: #fafafa;
          }

          &:last-child {
            border-bottom: none;
          }
        }
        td {
          padding: 1.25rem 1.5rem;
          vertical-align: middle;
          font-size: 0.9rem;

          &:last-child {
            text-align: center;
          }
        }
      }
    }

    .col-name {
      font-weight: 500;
      color: #1a1a1a;
    }

    .name-with-icon {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .utility-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.electricity {
        background: #fff3e0;
        mat-icon { color: #f57c00; }
      }

      &.water {
        background: #e3f2fd;
        mat-icon { color: #1976d2; }
      }

      &.gas {
        background: #fce4ec;
        mat-icon { color: #c2185b; }
      }

      &.internet {
        background: #e8eaf6;
        mat-icon { color: #3f51b5; }
      }

      &.default {
        background: #f5f5f5;
        mat-icon { color: #666; }
      }
    }

    .utility-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;

      &.electricity {
        background: #fff3e0;
        color: #e65100;
      }

      &.water {
        background: #e3f2fd;
        color: #0d47a1;
      }

      &.gas {
        background: #fce4ec;
        color: #880e4f;
      }

      &.internet {
        background: #e8eaf6;
        color: #283593;
      }

      &.default {
        background: #f5f5f5;
        color: #666;
      }
    }

    .col-rate {
      font-weight: 500;
      color: #333;
    }

    .col-tax {
      color: #666;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;

      &.active {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
      }

      &.inactive {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
      }
    }

    .col-actions {
      text-align: center;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 0.25rem;
      transition: all 0.2s;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.edit-btn {
        background: #f5f5f5;
        color: #666;
        &:hover { background: #eee; }
      }

      &.delete-btn {
        background: #fef2f2;
        color: #b91c1c;
        &:hover { background: #fee2e2; }
      }
    }

    .no-data {
      text-align: center;
      padding: 3rem;
      color: #888;
    }
  `]
})
export class TariffPlansComponent implements OnInit {
  dataSource = new MatTableDataSource<TariffPlan>([]);
  displayedColumns = ['name', 'utilityType', 'ratePerUnit', 'fixedCharges', 'taxPercentage', 'latePaymentPenalty', 'isActive', 'actions'];
  loading$ = new BehaviorSubject<boolean>(false);
  utilityTypes: UtilityType[] = [];

  constructor(
    private tariffPlansService: TariffPlansService,
    private utilityTypesService: UtilityTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUtilityTypes();
    this.load();
  }

  loadUtilityTypes(): void {
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.utilityTypes = (response.data || []).filter((u: UtilityType) => u.isActive);
      }
    });
  }

  load(): void {
    this.loading$.next(true);
    this.tariffPlansService.getAll().subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.loading$.next(false);
      },
      error: () => { this.loading$.next(false); }
    });
  }

  openDialog(item?: TariffPlan): void {
    const dialogRef = this.dialog.open(TariffPlanDialogComponent, {
      width: '500px',
      data: { plan: item || null, utilityTypes: this.utilityTypes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  getActivePlansCount(): number {
    return this.dataSource.data.filter(p => p.isActive).length;
  }

  getUtilityIcon(utilityTypeName: string): string {
    const name = (utilityTypeName || '').toLowerCase();
    if (name.includes('electric')) return 'bolt';
    if (name.includes('water')) return 'water_drop';
    if (name.includes('gas')) return 'local_fire_department';
    if (name.includes('internet')) return 'wifi';
    return 'receipt_long';
  }

  getUtilityClass(utilityTypeName: string): string {
    const name = (utilityTypeName || '').toLowerCase();
    if (name.includes('electric')) return 'electricity';
    if (name.includes('water')) return 'water';
    if (name.includes('gas')) return 'gas';
    if (name.includes('internet')) return 'internet';
    return 'default';
  }

  delete(item: TariffPlan): void {
    if (confirm(`Delete tariff plan "${item.name}"?`)) {
      this.tariffPlansService.delete(item.id).subscribe({
        next: () => {
          this.snackBar.open('Tariff plan deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error deleting', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

// Dialog Component
@Component({
  selector: 'app-tariff-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.plan ? 'Edit' : 'Add' }} Tariff Plan</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Utility Type</mat-label>
          <mat-select formControlName="utilityTypeId">
            <mat-option *ngFor="let ut of data.utilityTypes" [value]="ut.id">{{ ut.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('utilityTypeId')?.hasError('required')">Utility type is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Plan Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Residential, Commercial">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Rate per Unit (₹)</mat-label>
            <input matInput type="number" formControlName="ratePerUnit" step="0.01">
            <mat-error *ngIf="form.get('ratePerUnit')?.hasError('required')">Required</mat-error>
            <mat-error *ngIf="form.get('ratePerUnit')?.hasError('min')">Must be >= 0</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fixed Charge (₹)</mat-label>
            <input matInput type="number" formControlName="fixedCharges" step="0.01">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tax Percentage (%)</mat-label>
          <input matInput type="number" formControlName="taxPercentage" step="0.1">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Late Payment Penalty (₹)</mat-label>
          <input matInput type="number" formControlName="latePaymentPenalty" step="0.01">
          <mat-hint>Penalty amount added when bill becomes overdue</mat-hint>
        </mat-form-field>

        <mat-checkbox formControlName="isActive" color="primary">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button class="create-btn" (click)="save()" [disabled]="form.invalid || (saving$ | async)">
        <mat-spinner *ngIf="saving$ | async" diameter="20"></mat-spinner>
        <span *ngIf="!(saving$ | async)">{{ data.plan ? 'UPDATE' : 'CREATE' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .full-width { 
      width: 100%; 
      margin-bottom: 0.5rem; 
    }

    .form-row { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 1rem;
      margin-bottom: 0.5rem;

      mat-form-field {
        width: 100%;
      }
    }

    mat-dialog-content {
      min-width: 450px;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      overflow: visible;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem;
      margin: 0;
      gap: 0.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .cancel-btn {
      min-width: 100px;
      padding: 0.625rem 1.5rem;
      border: 1px solid #d0d0d0 !important;
      border-radius: 4px;
      background: #fff !important;
      color: #333 !important;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;

      &:hover {
        background: #f5f5f5 !important;
        border-color: #bbb !important;
      }
    }

    .create-btn {
      min-width: 100px;
      padding: 0.625rem 1.5rem;
      border: none;
      border-radius: 4px;
      background: #8b7d5e !important;
      color: #fff !important;
      font-weight: 500;
      font-size: 0.875rem;
      letter-spacing: 0.025em;
      cursor: pointer;

      &:hover {
        background: #7a6d51 !important;
      }

      &:disabled {
        background: #e0e0e0 !important;
        color: #9e9e9e !important;
        cursor: not-allowed;
      }
    }
  `]
})
export class TariffPlanDialogComponent {
  form: FormGroup;
  saving$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private tariffPlansService: TariffPlansService,
    private dialogRef: MatDialogRef<TariffPlanDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { plan: TariffPlan | null; utilityTypes: UtilityType[] }
  ) {
    const plan = data.plan;
    this.form = this.fb.group({
      utilityTypeId: [plan?.utilityTypeId || null, Validators.required],
      name: [plan?.name || '', Validators.required],
      description: [plan?.description || ''],
      ratePerUnit: [plan?.ratePerUnit || 0, [Validators.required, Validators.min(0)]],
      fixedCharges: [plan?.fixedCharges || 0],
      taxPercentage: [plan?.taxPercentage || 0],
      latePaymentPenalty: [plan?.latePaymentPenalty || 0, [Validators.min(0)]],
      isActive: [plan?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving$.next(true);
    const formValue = this.form.value;

    const operation = this.data.plan
      ? this.tariffPlansService.update(this.data.plan.id, { ...formValue, id: this.data.plan.id } as UpdateTariffPlanRequest)
      : this.tariffPlansService.create(formValue as CreateTariffPlanRequest);

    operation.subscribe({
      next: (response) => {
        this.saving$.next(false);
        if (response.success) {
          this.snackBar.open(`Tariff plan ${this.data.plan ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response.message || 'Error saving', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving$.next(false);
        this.snackBar.open(err.error?.message || 'Error saving', 'Close', { duration: 3000 });
      }
    });
  }
}
