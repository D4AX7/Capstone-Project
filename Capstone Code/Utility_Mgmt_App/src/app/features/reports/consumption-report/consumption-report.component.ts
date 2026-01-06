import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReportService } from '../services/report.service';
import { ConsumptionReport } from '../../../core/models';

@Component({
  selector: 'app-consumption-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="report-page">
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button routerLink="/reports" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Consumption Report</h1>
            <p>Analyze utility consumption by type and top consumers</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filter-row">
            <mat-form-field appearance="outline">
              <mat-label>Month</mat-label>
              <input matInput type="number" [(ngModel)]="month" min="1" max="12">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Year</mat-label>
              <input matInput type="number" [(ngModel)]="year" min="2000" max="2100">
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="load()" [disabled]="loading">
              <mat-icon>search</mat-icon>
              Generate Report
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- No Data or Error -->
      <mat-card *ngIf="!loading && (!data || error || !hasData())" class="no-data-card">
        <mat-card-content>
          <mat-icon>{{ error ? 'error_outline' : 'info' }}</mat-icon>
          <h3>{{ error ? 'Error Loading Report' : 'No Results Found' }}</h3>
          <p>{{ error || 'No consumption data available for ' + getMonthName(month) + ' ' + year + '.' }}</p>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div *ngIf="!loading && data && hasData()" class="report-content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon total">
                <mat-icon>bolt</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ data.totalConsumption | number:'1.2-2' }}</span>
                <span class="label">Total Consumption</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon average">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ data.averageConsumption | number:'1.2-2' }}</span>
                <span class="label">Average Consumption</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon period">
                <mat-icon>calendar_month</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ getMonthName(data.month) }} {{ data.year }}</span>
                <span class="label">Report Period</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Consumption by Utility Type -->
        <mat-card class="data-card" *ngIf="data && data.byUtilityType && data.byUtilityType.length > 0">
          <mat-card-header>
            <mat-card-title>Consumption by Utility Type</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.byUtilityType" class="full-width">
              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="totalConsumption">
                <th mat-header-cell *matHeaderCellDef>Total Consumption</th>
                <td mat-cell *matCellDef="let row">{{ row.totalConsumption | number:'1.2-2' }} {{ row.unit }}</td>
              </ng-container>

              <ng-container matColumnDef="averageConsumption">
                <th mat-header-cell *matHeaderCellDef>Average</th>
                <td mat-cell *matCellDef="let row">{{ row.averageConsumption | number:'1.2-2' }} {{ row.unit }}</td>
              </ng-container>

              <ng-container matColumnDef="minConsumption">
                <th mat-header-cell *matHeaderCellDef>Min</th>
                <td mat-cell *matCellDef="let row">{{ row.minConsumption | number:'1.2-2' }} {{ row.unit }}</td>
              </ng-container>

              <ng-container matColumnDef="maxConsumption">
                <th mat-header-cell *matHeaderCellDef>Max</th>
                <td mat-cell *matCellDef="let row">{{ row.maxConsumption | number:'1.2-2' }} {{ row.unit }}</td>
              </ng-container>

              <ng-container matColumnDef="connectionCount">
                <th mat-header-cell *matHeaderCellDef>Connections</th>
                <td mat-cell *matCellDef="let row">{{ row.connectionCount }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="utilityColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: utilityColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Top Consumers -->
        <mat-card class="data-card" *ngIf="data && data.topConsumers && data.topConsumers.length > 0">
          <mat-card-header>
            <mat-card-title>Top Consumers</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="data.topConsumers" class="full-width">
              <ng-container matColumnDef="consumerNumber">
                <th mat-header-cell *matHeaderCellDef>Consumer #</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>

              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="consumption">
                <th mat-header-cell *matHeaderCellDef>Consumption</th>
                <td mat-cell *matCellDef="let row">{{ row.consumption | number:'1.2-2' }} {{ row.unit }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="consumerColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: consumerColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .report-page {
      padding: 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .back-btn {
          margin-left: -8px;
        }

        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
        }

        p {
          margin: 0.25rem 0 0;
          color: #64748b;
        }
      }
    }

    .filter-card {
      margin-bottom: 1.5rem;

      .filter-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;

        mat-form-field {
          width: 120px;
        }
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .no-data-card {
      text-align: center;
      padding: 3rem;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
      }

      h3 {
        margin: 1rem 0 0.5rem;
        color: #1e293b;
      }

      p {
        margin: 0;
        color: #64748b;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem !important;
      }
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
      }

      &.total {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      &.average {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.period {
        background: linear-gradient(135deg, #5A7799, #4A6282);
      }
    }

    .summary-info {
      display: flex;
      flex-direction: column;

      .value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }

      .label {
        font-size: 0.875rem;
        color: #64748b;
      }
    }

    .data-card {
      margin-bottom: 1.5rem;

      mat-card-header {
        margin-bottom: 1rem;
      }

      .full-width {
        width: 100%;
      }
    }
  `]
})
export class ConsumptionReportComponent implements OnInit {
  data: ConsumptionReport | null = null;
  loading = false;
  error: string | null = null;
  month: number;
  year: number;

  utilityColumns = ['utilityType', 'totalConsumption', 'averageConsumption', 'minConsumption', 'maxConsumption', 'connectionCount'];
  consumerColumns = ['consumerNumber', 'consumerName', 'utilityType', 'consumption'];

  constructor(
    private reportService: ReportService,
    private cdr: ChangeDetectorRef
  ) {
    const now = new Date();
    this.month = now.getMonth() + 1;
    this.year = now.getFullYear();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.data = null;
    this.cdr.detectChanges();
    
    this.reportService.getConsumption(String(this.month), String(this.year))
      .pipe(
        timeout(30000),
        catchError(err => {
          console.error('Consumption report error:', err);
          return of({ success: false, data: null, message: err?.error?.message || 'Request failed' });
        })
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success && res.data) {
            this.data = res.data;
          } else {
            this.error = res.message || 'No data available for this period.';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to load consumption report. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }

  hasData(): boolean {
    if (!this.data) return false;
    return (this.data.byUtilityType?.length > 0) || (this.data.topConsumers?.length > 0) || this.data.totalConsumption > 0;
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || '';
  }
}
