import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingCyclesService } from '../../core/services/billing-cycles.service';
import { BillingCycle, CreateBillingCycleRequest } from '../../core/models';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-billing-cycles-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatIconModule, MatSnackBarModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Billing Cycles</h1>
          <p>Manage billing periods</p>
        </div>
        <button mat-raised-button color="primary" (click)="toggleForm()">
          <mat-icon>{{ showCreateForm ? 'close' : 'add' }}</mat-icon> {{ showCreateForm ? 'Cancel' : 'Add Billing Cycle' }}
        </button>
      </div>

      <!-- Create/Edit Form -->
      <mat-card *ngIf="showCreateForm" class="create-form-card">
        <mat-card-header>
          <mat-card-title>{{ editingCycle ? 'Edit Billing Cycle' : 'Create New Billing Cycle' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Month</mat-label>
              <mat-select [(ngModel)]="newCycle.month" required>
                <mat-option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Year</mat-label>
              <input matInput type="number" [(ngModel)]="newCycle.year" min="2020" max="2100" required />
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="newCycle.startDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="newCycle.endDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Due Date</mat-label>
              <input matInput [matDatepicker]="duePicker" [(ngModel)]="newCycle.dueDate" required>
              <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
              <mat-datepicker #duePicker></mat-datepicker>
            </mat-form-field>
          </div>
          <div class="form-actions">
            <button mat-raised-button color="primary" (click)="editingCycle ? updateCycle() : createCycle()" [disabled]="creating">
              <mat-icon>save</mat-icon> {{ creating ? 'Saving...' : (editingCycle ? 'Update Cycle' : 'Create Cycle') }}
            </button>
            <button mat-button (click)="toggleForm()">Cancel</button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div class="filter-bar">
            <mat-form-field appearance="outline">
              <mat-label>Month</mat-label>
              <input matInput type="number" [(ngModel)]="month" min="1" max="12" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Year</mat-label>
              <input matInput type="number" [(ngModel)]="year" min="2000" max="2100" />
            </mat-form-field>
            <button mat-stroked-button color="primary" (click)="loadByMonthYear()">Find</button>
            <button mat-stroked-button color="accent" (click)="loadCurrent()">Current (Open)</button>
            <button mat-stroked-button (click)="loadAll()">All</button>
          </div>

          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <table mat-table [dataSource]="cycles" class="mat-elevation-z1" *ngIf="!loading && cycles.length">
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Period</th>
              <td mat-cell *matCellDef="let c">{{ getMonthName(c.month) }} {{ c.year }}</td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Date Range</th>
              <td mat-cell *matCellDef="let c">{{ formatDisplayDate(c.startDate) }} - {{ formatDisplayDate(c.endDate) }}</td>
            </ng-container>
            <ng-container matColumnDef="dueDate">
              <th mat-header-cell *matHeaderCellDef>Due Date</th>
              <td mat-cell *matCellDef="let c">{{ formatDisplayDate(c.dueDate) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let c">
                <mat-chip [ngClass]="getStatusClass(c.status)">{{ c.status }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button color="primary" (click)="editCycle(c)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-button color="primary" (click)="setStatus(c, 'Open')" *ngIf="c.status !== 'Open'">
                  <mat-icon>lock_open</mat-icon> Open
                </button>
                <button mat-button color="warn" (click)="setStatus(c, 'Closed')" *ngIf="c.status !== 'Closed'">
                  <mat-icon>lock</mat-icon> Close
                </button>
                <button mat-icon-button color="warn" (click)="deleteCycle(c)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="!loading && !cycles.length" class="no-data">
            <mat-icon>event_busy</mat-icon>
            <p>No billing cycles found</p>
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

    .create-form-card {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    table { width: 100%; }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #64748b;
      
      mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }
    }

    mat-chip {
      font-size: 0.75rem;
      &.status-open { background-color: #dcfce7 !important; color: #166534 !important; }
      &.status-closed { background-color: #fee2e2 !important; color: #dc2626 !important; }
      &.status-pending { background-color: #fef9c3 !important; color: #854d0e !important; }
      &.status-active { background-color: #dcfce7 !important; color: #166534 !important; }
      &.status-inactive { background-color: #fee2e2 !important; color: #dc2626 !important; }
    }
  `]
})
export class BillingCyclesListComponent implements OnInit {
  cycles: BillingCycle[] = [];
  displayedColumns = ['period', 'dates', 'dueDate', 'status', 'actions'];
  month?: number;
  year?: number;
  loading = false;
  creating = false;
  showCreateForm = false;
  editingCycle: BillingCycle | null = null;

  // New cycle form
  newCycle: CreateBillingCycleRequest = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    dueDate: ''
  };

  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthOptions = this.months.map((label, i) => ({ value: i + 1, label }));

  constructor(
    private svc: BillingCyclesService, 
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  getMonthName(month: number): string {
    return this.months[month - 1] || '';
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    // Parse the date string as local date to avoid timezone shift
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Open': return 'status-open';
      case 'Closed': return 'status-closed';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  }

  toggleForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetNewCycle();
    }
  }

  loadAll(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.svc.list().subscribe({
      next: (res) => {
        console.log('Raw API response:', res);
        console.log('Cycles data:', res.data);
        if (res.data && res.data.length > 0) {
          console.log('First cycle startDate:', res.data[0].startDate);
        }
        this.cycles = res.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading cycles:', err);
        this.snackBar.open('Failed to load billing cycles', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCurrent(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.svc.getCurrent().subscribe({
      next: (res) => {
        // Current returns the open billing cycle
        this.cycles = res.data ? [res.data] : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading current cycle:', err);
        // If no current cycle, show empty
        this.cycles = [];
        this.snackBar.open('No open billing cycle found', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadByMonthYear(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.svc.list(this.year).subscribe({
      next: (res) => {
        let cycles = res.data || [];
        if (this.month) {
          cycles = cycles.filter((c: BillingCycle) => c.month === this.month);
        }
        this.cycles = cycles;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error finding cycles:', err);
        this.snackBar.open('Failed to find billing cycles', 'Close', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createCycle(): void {
    if (!this.newCycle.month || !this.newCycle.year || !this.newCycle.startDate || !this.newCycle.endDate || !this.newCycle.dueDate) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.creating = true;
    const payload: CreateBillingCycleRequest = {
      month: this.newCycle.month,
      year: this.newCycle.year,
      startDate: this.formatDate(this.newCycle.startDate),
      endDate: this.formatDate(this.newCycle.endDate),
      dueDate: this.formatDate(this.newCycle.dueDate)
    };

    this.svc.create(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Billing cycle created successfully', 'Close', { duration: 3000 });
          this.showCreateForm = false;
          this.resetNewCycle();
          this.loadAll();
        } else {
          this.snackBar.open(res.message || 'Failed to create billing cycle', 'Close', { duration: 3000 });
        }
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creating cycle:', err);
        this.snackBar.open(err.error?.message || 'Failed to create billing cycle', 'Close', { duration: 3000 });
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteCycle(cycle: BillingCycle): void {
    if (!confirm(`Are you sure you want to delete the ${this.getMonthName(cycle.month)} ${cycle.year} billing cycle?`)) {
      return;
    }

    this.svc.delete(cycle.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open('Billing cycle deleted', 'Close', { duration: 3000 });
          this.loadAll();
        } else {
          this.snackBar.open(res.message || 'Failed to delete', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to delete', 'Close', { duration: 3000 });
      }
    });
  }

  setStatus(cycle: BillingCycle, status: BillingCycle['status']): void {
    console.log('Updating cycle', cycle.id, 'to status', status);
    this.svc.updateStatus(cycle.id, { status }).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        if (response.success) {
          cycle.status = status;
          this.snackBar.open(`Billing cycle ${status === 'Open' ? 'opened' : 'closed'}`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(response.message || 'Failed to update status', 'Close', { duration: 3000 });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.snackBar.open(err.error?.message || 'Failed to update status', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private resetNewCycle(): void {
    this.newCycle = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      dueDate: ''
    };
    this.editingCycle = null;
  }

  editCycle(cycle: BillingCycle): void {
    this.editingCycle = cycle;
    this.newCycle = {
      month: cycle.month,
      year: cycle.year,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      dueDate: cycle.dueDate || ''
    };
    this.showCreateForm = true;
    this.cdr.detectChanges();
  }

  updateCycle(): void {
    if (!this.editingCycle) return;

    this.creating = true;
    const payload = {
      month: this.newCycle.month,
      year: this.newCycle.year,
      startDate: this.formatDate(this.newCycle.startDate || ''),
      endDate: this.formatDate(this.newCycle.endDate || ''),
      dueDate: this.formatDate(this.newCycle.dueDate || ''),
      status: this.editingCycle.status
    };

    console.log('Updating cycle with payload:', payload);
    console.log('Cycle ID:', this.editingCycle.id);

    this.svc.update(this.editingCycle.id, payload).subscribe({
      next: (res) => {
        console.log('Update response:', res);
        console.log('Updated cycle data:', res.data);
        if (res.success) {
          this.snackBar.open('Billing cycle updated successfully', 'Close', { duration: 3000 });
          this.showCreateForm = false;
          this.resetNewCycle();
          this.loadAll();
        } else {
          this.snackBar.open(res.message || 'Failed to update billing cycle', 'Close', { duration: 3000 });
        }
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating cycle:', err);
        console.error('Error details:', err.error);
        this.snackBar.open(err.error?.message || 'Failed to update billing cycle', 'Close', { duration: 3000 });
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  private formatDate(date: string | Date): string {
    if (!date) return '';
    if (typeof date === 'string') {
      // If already in ISO format, return as is
      if (date.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date.split('T')[0];
      }
      return date;
    }
    // For Date objects
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
