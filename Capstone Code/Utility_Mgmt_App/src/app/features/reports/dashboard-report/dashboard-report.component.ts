import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-report',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports</h1>
        <p>View and generate various reports</p>
      </div>

      <div class="reports-grid">
        <!-- My Consumption - Consumer only -->
        <mat-card class="report-card" *ngIf="isConsumer" routerLink="/reports/my-consumption">
          <mat-card-content>
            <div class="report-icon my-consumption">
              <mat-icon>bolt</mat-icon>
            </div>
            <div class="report-info">
              <h3>My Consumption</h3>
              <p>View your utility consumption history</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Revenue Report - Admin, AccountOfficer -->
        <mat-card class="report-card" *ngIf="canAccessRevenue" routerLink="/reports/revenue-report">
          <mat-card-content>
            <div class="report-icon revenue">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="report-info">
              <h3>Revenue Report</h3>
              <p>Monthly and yearly revenue analysis</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Outstanding Balance Report - Admin, AccountOfficer -->
        <mat-card class="report-card" *ngIf="canAccessOutstanding" routerLink="/reports/outstanding-report">
          <mat-card-content>
            <div class="report-icon outstanding">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="report-info">
              <h3>Outstanding Balance</h3>
              <p>View consumers with pending dues</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Consumption Report - Admin, BillingOfficer -->
        <mat-card class="report-card" *ngIf="canAccessConsumption" routerLink="/reports/consumption-report">
          <mat-card-content>
            <div class="report-icon consumption">
              <mat-icon>speed</mat-icon>
            </div>
            <div class="report-info">
              <h3>Consumption Report</h3>
              <p>Utility consumption analysis</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      padding: 0;
    }

    .page-header {
      margin-bottom: 1.5rem;

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

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .report-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem !important;
      }
    }

    .report-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      &.revenue {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      &.outstanding {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      &.consumption {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }

      &.my-consumption {
        background: linear-gradient(135deg, #5A7799, #4A6282);
      }
    }

    .report-info {
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #64748b;
      }
    }
  `]
})
export class DashboardReportComponent implements OnInit {
  canAccessRevenue = false;
  canAccessOutstanding = false;
  canAccessConsumption = false;
  isConsumer = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Consumer sees My Consumption
      this.isConsumer = user.role === 'Consumer';
      // Revenue Report - Admin, AccountOfficer
      this.canAccessRevenue = ['Admin', 'AccountOfficer'].includes(user.role);
      // Outstanding Dues - Admin, AccountOfficer
      this.canAccessOutstanding = ['Admin', 'AccountOfficer'].includes(user.role);
      // Consumption Report - Admin, BillingOfficer
      this.canAccessConsumption = ['Admin', 'BillingOfficer'].includes(user.role);
    }
  }
}
