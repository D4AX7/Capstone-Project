import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { UtilityType } from '../../../core/models';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-billing-cycles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
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
            <mat-icon>calendar_month</mat-icon>
          </div>
          <div class="header-content">
            <h1>Billing Cycles</h1>
            <p>Configure billing cycle duration for each utility type</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon total-icon">
            <mat-icon>category</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataSource.data.length }}</div>
            <div class="stat-label">UTILITY TYPES</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon monthly-icon">
            <mat-icon>event</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getMonthlyCount() }}</div>
            <div class="stat-label">MONTHLY</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bimonthly-icon">
            <mat-icon>date_range</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getBiMonthlyCount() }}</div>
            <div class="stat-label">BI-MONTHLY</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon quarterly-icon">
            <mat-icon>calendar_today</mat-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getQuarterlyCount() }}</div>
            <div class="stat-label">QUARTERLY</div>
          </div>
        </div>
      </div>

      <!-- Billing Cycles List Card -->
      <div class="list-card">
        <div class="card-header">
          <h2>All Utility Types</h2>
          <span class="records-count">{{ dataSource.data.length }} types</span>
        </div>

        <div *ngIf="loading$ | async" class="loading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="table-container" *ngIf="!(loading$ | async)">
          <table class="data-table">
            <thead>
              <tr>
                <th>UTILITY</th>
                <th>UNIT</th>
                <th>CONNECTIONS</th>
                <th>BILLING CYCLE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of dataSource.data">
                <td class="col-utility">
                  <div class="utility-name">
                    <span class="utility-icon" [ngClass]="getUtilityClass(row.name)">
                      <mat-icon>{{ getIcon(row.name) }}</mat-icon>
                    </span>
                    {{ row.name }}
                  </div>
                </td>
                <td class="col-unit">{{ row.unitOfMeasurement }}</td>
                <td class="col-connections">{{ row.connectionCount || 0 }}</td>
                <td class="col-cycle">
                  <div class="cycle-toggle">
                    <button 
                      class="cycle-btn" 
                      [class.active]="row.billingCycleMonths === 1"
                      (click)="setBillingCycle(row, 1)">
                      MONTHLY
                    </button>
                    <button 
                      class="cycle-btn" 
                      [class.active]="row.billingCycleMonths === 2"
                      (click)="setBillingCycle(row, 2)">
                      BI-MONTHLY
                    </button>
                    <button 
                      class="cycle-btn" 
                      [class.active]="row.billingCycleMonths === 3"
                      (click)="setBillingCycle(row, 3)">
                      QUARTERLY
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="dataSource.data.length === 0">
                <td colspan="4" class="no-data">No utility types found.</td>
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
      min-width: 160px;
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

      &.monthly-icon {
        background: #e3f2fd;
        mat-icon { color: #1976d2; }
      }

      &.bimonthly-icon {
        background: #fff3e0;
        mat-icon { color: #f57c00; }
      }

      &.quarterly-icon {
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
          padding: 1rem 2rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e8e8e8;
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
          padding: 1.25rem 2rem;
          vertical-align: middle;
          font-size: 0.9rem;
        }
      }
    }

    .col-utility {
      font-weight: 500;
      color: #1a1a1a;
      min-width: 200px;
      padding-right: 3rem !important;
    }

    .utility-name {
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

    .col-unit {
      color: #666;
      min-width: 120px;
      padding-right: 3rem !important;
    }

    .col-connections {
      font-weight: 600;
      color: #1a1a1a;
      min-width: 140px;
      padding-right: 3rem !important;
    }

    .col-cycle {
    }

    .cycle-toggle {
      display: inline-flex;
      gap: 0.75rem;
    }

    .cycle-btn {
      padding: 0.75rem 1.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: #fff;
      color: #666;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
      text-align: center;

      &:hover:not(.active) {
        background: #f5f5f5;
      }

      &.active {
        background: #333;
        color: #fff;
        border-color: #333;
      }
    }

    .no-data {
      text-align: center;
      padding: 3rem;
      color: #888;
    }
  `]
})
export class BillingCyclesComponent implements OnInit {
  dataSource = new MatTableDataSource<UtilityType>([]);
  displayedColumns = ['name', 'unit', 'connections', 'billingCycle'];
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private utilityTypesService: UtilityTypesService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading$.next(false);
        this.cdr.detectChanges();
      }
    });
  }

  getMonthlyCount(): number {
    return this.dataSource.data.filter(u => u.billingCycleMonths === 1).length;
  }

  getBiMonthlyCount(): number {
    return this.dataSource.data.filter(u => u.billingCycleMonths === 2).length;
  }

  getQuarterlyCount(): number {
    return this.dataSource.data.filter(u => u.billingCycleMonths === 3).length;
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

  setBillingCycle(utility: UtilityType, months: number): void {
    if (utility.billingCycleMonths === months) return;
    
    const previousValue = utility.billingCycleMonths;
    utility.billingCycleMonths = months;
    this.cdr.detectChanges();
    
    this.utilityTypesService.update(utility.id, { billingCycleMonths: months }).subscribe({
      next: (response) => {
        if (response.success) {
          const cycleText = months === 1 ? 'Monthly' : months === 2 ? 'Bi-Monthly' : 'Quarterly';
          this.snackBar.open(`${utility.name} billing cycle set to ${cycleText}`, 'Close', { duration: 3000 });
        } else {
          utility.billingCycleMonths = previousValue;
          this.snackBar.open(response.message || 'Error updating', 'Close', { duration: 3000 });
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        utility.billingCycleMonths = previousValue;
        this.snackBar.open(err.error?.message || 'Error updating', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }
}
