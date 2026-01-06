import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>group</mat-icon>
          </div>
          <div class="header-content">
            <h1>User Management</h1>
            <p>Manage system users and their roles</p>
          </div>
        </div>
        <button class="add-user-btn" (click)="openDialog()">
          <mat-icon>person_add</mat-icon>
          ADD USER
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon users-icon">
            <mat-icon>group</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalRecords }}</div>
            <div class="stat-label">TOTAL USERS</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activeUsersCount }}</div>
            <div class="stat-label">ACTIVE USERS</div>
          </div>
        </div>
      </div>

      <!-- Users List Card -->
      <div class="users-list-card">
        <div class="card-header">
          <h2>Users List</h2>
          <span class="records-count">{{ dataSource.data.length }} of {{ totalRecords }} shown</span>
        </div>

        <div *ngIf="loading" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-container" *ngIf="!loading">
          <table class="users-table" matSort (matSortChange)="sortData($event)">
            <thead>
              <tr>
                <th class="col-user" mat-sort-header="fullName">USER</th>
                <th class="col-role" mat-sort-header="role">ROLE</th>
                <th class="col-status" mat-sort-header="isActive">STATUS</th>
                <th class="col-actions">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of dataSource.data">
                <td class="col-user">
                  <div class="user-info">
                    <div class="user-name">{{ row.firstName }} {{ row.lastName }}</div>
                    <div class="user-email">{{ row.email }}</div>
                  </div>
                </td>
                <td class="col-role">
                  <span class="role-badge" [ngClass]="getRoleClass(row.role)">
                    <mat-icon class="role-icon">{{ getRoleIcon(row.role) }}</mat-icon>
                    {{ getRoleLabel(row.role) }}
                  </span>
                </td>
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
                <td colspan="4" class="no-data">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <mat-paginator
          [length]="totalRecords"
          [pageIndex]="pageNumber - 1"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
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

    .add-user-btn {
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

      &.users-icon {
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

    /* Users List Card */
    .users-list-card {
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

    .users-table {
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
          cursor: pointer;
          
          &:hover {
            background: #f0f0ee;
          }
          
          &[mat-sort-header] {
            cursor: pointer;
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
        }
      }

      .col-user { width: 35%; }
      .col-role { width: 25%; }
      .col-status { width: 20%; }
      .col-actions { 
        width: 20%; 
        text-align: center;
        
        &:last-child {
          padding-right: 1.5rem;
        }
      }

      thead .col-actions {
        text-align: center;
      }

      tbody .col-actions {
        text-align: center;
      }
    }

    .user-info {
      .user-name {
        font-weight: 500;
        color: #5c5a4d;
        font-size: 0.95rem;
      }
      .user-email {
        font-size: 0.875rem;
        color: #2d8a7b;
        margin-top: 0.25rem;
      }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;

      .role-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      &.role-admin {
        background: #d4c4a8;
        color: #5c4d2e;
      }

      &.role-billing {
        background: #e3e8ef;
        color: #3d5a80;
      }

      &.role-account {
        background: #d4c4a8;
        color: #5c4d2e;
      }

      &.role-consumer {
        background: #f0ebe3;
        color: #6b6b6b;
      }
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

    mat-paginator {
      border-top: 1px solid #e8e8e8;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns = ['name', 'role', 'isActive', 'actions'];
  loading = false;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  activeUsersCount = 0;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.authService.getUsers({ pageNumber: this.pageNumber, pageSize: this.pageSize }).subscribe({
      next: (response: any) => {
        this.loading = false;
        // Handle both paged response and array response
        const users = response.data || response || [];
        this.dataSource.data = users;
        this.totalRecords = response.totalRecords || response.totalCount || users.length || 0;
        this.activeUsersCount = users.filter((u: User) => u.isActive).length;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  sortData(sort: any): void {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a: User, b: User) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'fullName':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          // Lowercase first letter comes before uppercase
          const firstCharA = `${a.firstName}`.charAt(0);
          const firstCharB = `${b.firstName}`.charAt(0);
          const isLowerA = firstCharA === firstCharA.toLowerCase() && firstCharA !== firstCharA.toUpperCase();
          const isLowerB = firstCharB === firstCharB.toLowerCase() && firstCharB !== firstCharB.toUpperCase();
          if (nameA === nameB) return 0;
          if (nameA.charAt(0) === nameB.charAt(0)) {
            if (isLowerA && !isLowerB) return isAsc ? -1 : 1;
            if (!isLowerA && isLowerB) return isAsc ? 1 : -1;
          }
          return (nameA < nameB ? -1 : 1) * (isAsc ? 1 : -1);
        case 'role':
          return (a.role < b.role ? -1 : 1) * (isAsc ? 1 : -1);
        case 'isActive':
          return (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1) * (isAsc ? 1 : -1);
        default:
          return 0;
      }
    });
    this.cdr.detectChanges();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  getInitials(user: User): string {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleLabel(role: UserRole | string): string {
    switch (role) {
      case 'Admin': return 'Admin';
      case 'BillingOfficer': return 'Billing Officer';
      case 'AccountOfficer': return 'Account Officer';
      case 'Consumer': return 'Consumer';
      default: return String(role);
    }
  }

  getRoleIcon(role: UserRole | string): string {
    switch (role) {
      case 'Admin': return 'admin_panel_settings';
      case 'BillingOfficer': return 'receipt_long';
      case 'AccountOfficer': return 'business';
      case 'Consumer': return 'person';
      default: return 'person';
    }
  }

  getRoleClass(role: UserRole | string): string {
    switch (role) {
      case 'Admin': return 'role-admin';
      case 'BillingOfficer': return 'role-billing';
      case 'AccountOfficer': return 'role-account';
      case 'Consumer': return 'role-consumer';
      default: return '';
    }
  }

  openDialog(user?: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: user || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.load();
      }
    });
  }

  delete(user: User): void {
    if (confirm(`Are you sure you want to permanently delete "${user.firstName} ${user.lastName}"?\n\nThis action cannot be undone. If you just want to deactivate the user, use the Edit option instead.`)) {
      this.authService.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User permanently deleted', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Error deleting user', 'Close', { duration: 5000 });
        }
      });
    }
  }
}

// Dialog Component
@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} User</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName">
            <mat-error *ngIf="form.get('firstName')?.hasError('required')">Required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName">
            <mat-error *ngIf="form.get('lastName')?.hasError('required')">Required</mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="new-email">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('lowercase')">Email must be lowercase only</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!data">
          <mat-label>Password</mat-label>
          <input matInput formControlName="password" type="password" autocomplete="new-password">
          <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 6 characters</mat-error>
          <mat-error *ngIf="form.get('password')?.hasError('pattern')">Must have uppercase, lowercase, number & special char</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone Number</mat-label>
          <input matInput formControlName="phoneNumber">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Admin">Admin</mat-option>
            <mat-option value="BillingOfficer">Billing Officer</mat-option>
            <mat-option value="AccountOfficer">Account Officer</mat-option>
            <mat-option value="Consumer" *ngIf="data">Consumer</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('role')?.hasError('required')">Role is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="data">
          <mat-label>Status</mat-label>
          <mat-select formControlName="isActive">
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button class="create-btn" (click)="save()" [disabled]="form.invalid || saving">
        <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
        <span *ngIf="!saving">{{ data ? 'UPDATE' : 'CREATE' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    .full-width { 
      width: 100%; 
      margin-bottom: 1.25rem; 
    }

    .form-row { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 1rem;
      margin-bottom: 1.25rem;

      mat-form-field {
        width: 100%;
      }
    }

    mat-dialog-content {
      min-width: 450px;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      overflow: visible;
    }

    ::ng-deep .mat-mdc-dialog-content {
      overflow: visible !important;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      position: relative;
      min-height: 1.25rem;
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
export class UserDialogComponent {
  form: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: User | null
  ) {
    // Custom lowercase email validator
    const lowercaseEmailValidator = (control: any) => {
      if (!control.value) return null;
      return control.value !== control.value.toLowerCase() 
        ? { lowercase: true } 
        : null;
    };

    // Password pattern: at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{6,}$/;

    this.form = this.fb.group({
      firstName: [data?.firstName || '', Validators.required],
      lastName: [data?.lastName || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email, lowercaseEmailValidator]],
      password: ['', data ? [] : [Validators.required, Validators.minLength(6), Validators.pattern(passwordPattern)]],
      phoneNumber: [data?.phoneNumber || ''],
      role: [data?.role || 'BillingOfficer', Validators.required],
      isActive: [data?.isActive ?? true]
    });

    // Disable email for existing users
    if (data) {
      this.form.get('email')?.disable();
    }
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.getRawValue();

    if (this.data) {
      // Update existing user
      this.authService.updateUser(this.data.id, {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phoneNumber,
        role: formValue.role,
        isActive: formValue.isActive
      }).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.success) {
            this.snackBar.open('User updated', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response.message || 'Error updating', 'Close', { duration: 5000 });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(err.error?.message || 'Error updating', 'Close', { duration: 5000 });
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new user
      const request = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        password: formValue.password,
        phoneNumber: formValue.phoneNumber,
        role: formValue.role
      };

      this.authService.registerStaff(request).subscribe({
        next: (response) => {
          this.saving = false;
          if (response.success) {
            this.snackBar.open('User created', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(response.message || 'Error creating', 'Close', { duration: 5000 });
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(err.error?.message || 'Error creating', 'Close', { duration: 5000 });
          this.cdr.detectChanges();
        }
      });
    }
  }
}
