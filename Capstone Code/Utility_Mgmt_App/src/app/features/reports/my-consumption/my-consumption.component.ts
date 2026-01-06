import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BillsService } from '../../../core/services/bills.service';
import { ConnectionsService } from '../../../core/services/connections.service';

interface ConsumptionData {
  connectionNumber: string;
  utilityType: string;
  period: string;
  unitsConsumed: number;
  amount: number;
}

@Component({
  selector: 'app-my-consumption',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
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
            <h1>My Consumption</h1>
            <p>View your utility consumption history</p>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <!-- Error -->
      <mat-card *ngIf="!loading && error" class="error-card">
        <mat-card-content>
          <mat-icon>error_outline</mat-icon>
          <h3>Error Loading Data</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadData()">Try Again</button>
        </mat-card-content>
      </mat-card>

      <!-- No Data -->
      <mat-card *ngIf="!loading && !error && consumptionData.length === 0" class="no-data-card">
        <mat-card-content>
          <mat-icon>info</mat-icon>
          <h3>No Consumption Data</h3>
          <p>You don't have any billing history yet.</p>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div *ngIf="!loading && !error && consumptionData.length > 0" class="report-content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon total">
                <mat-icon>bolt</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ totalConsumption | number:'1.2-2' }}</span>
                <span class="label">Total Units Consumed</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon connections">
                <mat-icon>electrical_services</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">{{ activeConnections }}</span>
                <span class="label">Active Connections</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-icon amount">
                <mat-icon>currency_rupee</mat-icon>
              </div>
              <div class="summary-info">
                <span class="value">₹{{ totalAmount | number:'1.2-2' }}</span>
                <span class="label">Total Billed Amount</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Consumption History -->
        <mat-card class="data-card">
          <mat-card-header>
            <mat-card-title>Consumption History</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="consumptionData" class="full-width">
              <ng-container matColumnDef="connectionNumber">
                <th mat-header-cell *matHeaderCellDef>Connection</th>
                <td mat-cell *matCellDef="let row">{{ row.connectionNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="period">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let row">{{ row.period }}</td>
              </ng-container>

              <ng-container matColumnDef="unitsConsumed">
                <th mat-header-cell *matHeaderCellDef>Units Consumed</th>
                <td mat-cell *matCellDef="let row">{{ row.unitsConsumed | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row" class="amount-cell">₹{{ row.amount | number:'1.2-2' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Connections Summary -->
        <mat-card class="data-card" *ngIf="connections.length > 0">
          <mat-card-header>
            <mat-card-title>My Connections</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="connections" class="full-width">
              <ng-container matColumnDef="connectionNumber">
                <th mat-header-cell *matHeaderCellDef>Connection Number</th>
                <td mat-cell *matCellDef="let row">{{ row.connectionNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType || row.utilityTypeName }}</td>
              </ng-container>

              <ng-container matColumnDef="meterNumber">
                <th mat-header-cell *matHeaderCellDef>Meter Number</th>
                <td mat-cell *matCellDef="let row">{{ row.meterNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [class.active]="row.status === 'Active'">{{ row.status }}</span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="connectionColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: connectionColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .report-page {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;

      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem; }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .error-card, .no-data-card {
      text-align: center;
      padding: 3rem;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
      }

      h3 { margin: 1rem 0 0.5rem; color: #1e293b; }
      p { color: #64748b; margin-bottom: 1rem; }
    }

    .error-card mat-icon { color: #ef4444; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem !important;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon { color: white; }

      &.total { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
      &.connections { background: linear-gradient(135deg, #10b981, #059669); }
      &.amount { background: linear-gradient(135deg, #f59e0b, #d97706); }
    }

    .summary-info {
      display: flex;
      flex-direction: column;

      .value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
      .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
    }

    .data-card {
      margin-bottom: 1.5rem;
    }

    .full-width { width: 100%; }

    .amount-cell {
      font-weight: 600;
      color: #16a34a;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #fef3c7;
      color: #92400e;

      &.active {
        background: #dcfce7;
        color: #166534;
      }
    }

    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyConsumptionComponent implements OnInit {
  loading = true;
  error: string | null = null;
  
  consumptionData: ConsumptionData[] = [];
  connections: any[] = [];
  
  totalConsumption = 0;
  totalAmount = 0;
  activeConnections = 0;
  
  displayedColumns = ['connectionNumber', 'utilityType', 'period', 'unitsConsumed', 'amount'];
  connectionColumns = ['connectionNumber', 'utilityType', 'meterNumber', 'status'];

  constructor(
    private billsService: BillsService,
    private connectionsService: ConnectionsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      bills: this.billsService.getMyBills().pipe(
        catchError(err => {
          console.error('Error loading bills:', err);
          return of({ success: false, data: [] });
        })
      ),
      connections: this.connectionsService.getMyConnections().pipe(
        catchError(err => {
          console.error('Error loading connections:', err);
          return of({ success: false, data: [] });
        })
      )
    }).subscribe({
      next: (results) => {
        this.loading = false;

        // Process bills for consumption data
        const bills = results.bills.data || [];
        this.consumptionData = bills.map((bill: any) => ({
          connectionNumber: bill.connectionNumber || 'N/A',
          utilityType: bill.utilityType,
          period: bill.billingPeriod,
          unitsConsumed: bill.unitsConsumed || 0,
          amount: bill.totalAmount || 0
        }));

        // Calculate totals
        this.totalConsumption = bills.reduce((sum: number, b: any) => sum + (b.unitsConsumed || 0), 0);
        this.totalAmount = bills.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);

        // Process connections
        this.connections = results.connections.data || [];
        this.activeConnections = this.connections.filter((c: any) => c.status === 'Active').length;

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load your consumption data. Please try again.';
        console.error('Error loading data:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
