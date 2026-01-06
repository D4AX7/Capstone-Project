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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { UtilityType, CreateUtilityTypeRequest, UpdateUtilityTypeRequest } from '../../../core/models';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-utility-types',
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
            <mat-icon>category</mat-icon>
          </div>
          <div class="header-content">
            <h1>Utility Types</h1>
            <p>Manage utility types (Electricity, Water, Gas, etc.)</p>
          </div>
        </div>
        <button class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon>
          ADD UTILITY TYPE
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon total-icon">
            <mat-icon>category</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataSource.data.length }}</div>
            <div class="stat-label">TOTAL TYPES</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getActiveCount() }}</div>
            <div class="stat-label">ACTIVE</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon inactive-icon">
            <mat-icon>cancel</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getInactiveCount() }}</div>
            <div class="stat-label">INACTIVE</div>
          </div>
        </div>
      </div>

      <!-- Utility Types List Card -->
      <div class="list-card">
        <div class="card-header">
          <h2>All Utility Types</h2>
          <span class="records-count">{{ dataSource.data.length }} items</span>
        </div>

        <div *ngIf="loading$ | async" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-container" *ngIf="!(loading$ | async)">
          <table class="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>DESCRIPTION</th>
                <th>UNIT</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of dataSource.data">
                <td class="col-name">
                  <div class="name-with-icon">
                    <span class="utility-icon" [ngClass]="getUtilityClass(row.name)">
                      <mat-icon>{{ getIcon(row.name) }}</mat-icon>
                    </span>
                    {{ row.name }}
                  </div>
                </td>
                <td class="col-description">{{ row.description || '-' }}</td>
                <td class="col-unit">
                  <span class="unit-badge">{{ row.unitOfMeasurement }}</span>
                </td>
                <td class="col-status">
                  <span class="status-badge" [ngClass]="row.isActive ? 'active' : 'inactive'">
                    <span class="status-dot"></span>
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
                <td colspan="5" class="no-data">No utility types found. Click "ADD UTILITY TYPE" to create one.</td>
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

      &.inactive-icon {
        background: #fce4ec;
        mat-icon { color: #e91e63; }
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

    .col-description {
      color: #666;
    }

    .unit-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #333;
      font-family: monospace;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.active {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;

        .status-dot {
          background: #4caf50;
        }
      }

      &.inactive {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;

        .status-dot {
          background: #f44336;
        }
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
        background: #fff5f5;
        color: #c62828;
        margin-left: 4px;
        &:hover { background: #ffebee; }
      }
    }

    .no-data {
      text-align: center;
      padding: 3rem;
      color: #888;
    }
  `]
})
export class UtilityTypesComponent implements OnInit {
  dataSource = new MatTableDataSource<UtilityType>([]);
  displayedColumns = ['name', 'description', 'unitOfMeasurement', 'isActive', 'actions'];
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private utilityTypesService: UtilityTypesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading$.next(true);
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.dataSource.data = response.data || [];
        this.loading$.next(false);
      },
      error: () => { this.loading$.next(false); }
    });
  }

  getActiveCount(): number {
    return this.dataSource.data.filter(item => item.isActive).length;
  }

  getInactiveCount(): number {
    return this.dataSource.data.filter(item => !item.isActive).length;
  }

  getIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getUtilityClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'electricity';
    if (lower.includes('water')) return 'water';
    if (lower.includes('gas')) return 'gas';
    if (lower.includes('internet')) return 'internet';
    return 'default';
  }

  openDialog(item?: UtilityType): void {
    const dialogRef = this.dialog.open(UtilityTypeDialogComponent, {
      width: '450px',
      data: item || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  delete(item: UtilityType): void {
    if (confirm(`Are you sure you want to permanently delete utility type "${item.name}"? This action cannot be undone.`)) {
      this.utilityTypesService.delete(item.id).subscribe({
        next: () => {
          this.snackBar.open('Utility type deleted permanently', 'Close', { duration: 3000 });
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
  selector: 'app-utility-type-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Utility Type</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Electricity, Water">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Unit</mat-label>
          <input matInput formControlName="unitOfMeasurement" placeholder="e.g., kWh, Liters, m³">
          <mat-error *ngIf="form.get('unitOfMeasurement')?.hasError('required')">Unit is required</mat-error>
        </mat-form-field>

        <mat-checkbox formControlName="isActive" color="primary">Active</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button class="cancel-btn" mat-dialog-close>Cancel</button>
      <button class="create-btn" (click)="save()" [disabled]="form.invalid || (saving$ | async)">
        <mat-spinner *ngIf="saving$ | async" diameter="20"></mat-spinner>
        <span *ngIf="!(saving$ | async)">{{ data ? 'UPDATE' : 'CREATE' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }

    mat-dialog-content {
      padding: 1.5rem 1.5rem 1rem 1.5rem !important;
      overflow: visible;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem !important;
      gap: 0.75rem;
    }

    .cancel-btn {
      padding: 0.5rem 1.25rem;
      background: #fff;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }
    }

    .create-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      background: #8b7d5e;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      min-width: 80px;

      &:hover:not(:disabled) {
        background: #7a6d51;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  `]
})
export class UtilityTypeDialogComponent {
  form: FormGroup;
  saving$ = new BehaviorSubject<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private utilityTypesService: UtilityTypesService,
    private dialogRef: MatDialogRef<UtilityTypeDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: UtilityType | null
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      description: [data?.description || ''],
      unitOfMeasurement: [data?.unitOfMeasurement || '', Validators.required],
      isActive: [data?.isActive ?? true]
    });
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving$.next(true);
    const formValue = this.form.value;

    const operation = this.data
      ? this.utilityTypesService.update(this.data.id, { ...formValue, id: this.data.id } as UpdateUtilityTypeRequest)
      : this.utilityTypesService.create(formValue as CreateUtilityTypeRequest);

    operation.subscribe({
      next: (response) => {
        this.saving$.next(false);
        if (response.success) {
          this.snackBar.open(`Utility type ${this.data ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
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
