import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReportsService } from '../../core/services/reports.service';
import { AuthService } from '../../core/services/auth.service';
import { BillsService } from '../../core/services/bills.service';
import { PaymentsService } from '../../core/services/payments.service';
import { MeterReadingsService } from '../../core/services/meter-readings.service';
import { ConnectionsService } from '../../core/services/connections.service';
import { UtilityTypesService } from '../../core/services/utility-types.service';
import { TariffPlansService } from '../../core/services/tariff-plans.service';
import { BillingCyclesService } from '../../core/services/billing-cycles.service';
import { DashboardSummary, User, RecentActivity, UtilityType, TariffPlan, BillingCycle, UtilityRevenue } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard">
      <div *ngIf="error" class="error-banner">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error }}</span>
        <button mat-icon-button (click)="error = null"><mat-icon>close</mat-icon></button>
      </div>

      <div *ngIf="loading" class="loading-overlay">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading && summary" class="dashboard-compact">
        <!-- Header Row -->
        <header class="dash-header" *ngIf="!isConsumer">
          <div class="header-left">
            <span class="greeting-text">{{ getGreeting() }},</span>
            <h1 class="user-name">{{ currentUser?.firstName || 'User' }}</h1>
          </div>
          <div class="header-right">
            <span class="role-badge">{{ getRoleSubtitle() }}</span>
            <button class="refresh-btn" (click)="refresh()" [disabled]="loading">
              <mat-icon [class.spinning]="loading">sync</mat-icon>
            </button>
          </div>
        </header>

        <!-- Stats Row - All key numbers at a glance -->
        <section class="stats-row" *ngIf="!isConsumer">
          <div class="stat-card" *ngIf="isAdmin">
            <mat-icon>group</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ getTotalUsers() }}</span>
              <span class="stat-label">Users</span>
            </div>
          </div>
          <div class="stat-card" *ngIf="isAccountOfficer">
            <mat-icon>people_outline</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ summary.totalConsumers }}</span>
              <span class="stat-label">Consumers</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon>electrical_services</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ summary.activeConnections }}</span>
              <span class="stat-label">Connections</span>
            </div>
          </div>
          <div class="stat-card" *ngIf="!isAdmin && !isAccountOfficer">
            <mat-icon>receipt_long</mat-icon>
            <div class="stat-content">
              <span class="stat-value warning">{{ summary.pendingBills }}</span>
              <span class="stat-label">Pending Bills</span>
            </div>
          </div>
          <div class="stat-card" *ngIf="!isAdmin && !isAccountOfficer">
            <mat-icon>warning_amber</mat-icon>
            <div class="stat-content">
              <span class="stat-value danger">{{ summary.overdueBills }}</span>
              <span class="stat-label">Overdue</span>
            </div>
          </div>
          <div class="stat-card revenue" *ngIf="!isAdmin && (isAccountOfficer)">
            <mat-icon>trending_up</mat-icon>
            <div class="stat-content">
              <span class="stat-value success">₹{{ summary.totalRevenueThisMonth | number:'1.0-0' }}</span>
              <span class="stat-label">Revenue</span>
            </div>
          </div>
          <div class="stat-card" *ngIf="!isAdmin && (isAccountOfficer)">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="stat-content">
              <span class="stat-value danger">₹{{ summary.totalOutstanding | number:'1.0-0' }}</span>
              <span class="stat-label">Outstanding</span>
            </div>
          </div>
        </section>

        <!-- Main 2x2 Grid -->
        <section class="cards-grid" *ngIf="isAdmin || isAccountOfficer">
          <!-- Row 1: Admin Management Cards -->
          <!-- Card 1: User Management Overview with Donut Chart -->
          <div class="dashboard-card admin-users-card" *ngIf="isAdmin">
            <div class="card-header">
              <h2>User Distribution</h2>
              <span class="card-subtitle">Team overview</span>
            </div>
            <div class="admin-users-content-v2">
              <div class="donut-section">
                <div class="donut-chart">
                  <svg viewBox="0 0 36 36" class="circular-chart">
                    <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="circle admin-segment" [attr.stroke-dasharray]="getAdminPercentage() + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="circle billing-segment" [attr.stroke-dasharray]="getBillingPercentage() + ', 100'" [attr.stroke-dashoffset]="-getAdminPercentage()" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="circle account-segment" [attr.stroke-dasharray]="getAccountPercentage() + ', 100'" [attr.stroke-dashoffset]="-(getAdminPercentage() + getBillingPercentage())" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="circle consumer-segment" [attr.stroke-dasharray]="getConsumerPercentage() + ', 100'" [attr.stroke-dashoffset]="-(getAdminPercentage() + getBillingPercentage() + getAccountPercentage())" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  </svg>
                  <div class="donut-center">
                    <span class="donut-total">{{ getTotalUsers() }}</span>
                    <span class="donut-label">Total</span>
                  </div>
                </div>
              </div>
              <div class="legend-section">
                <a class="legend-row" routerLink="/admin/users">
                  <div class="legend-left">
                    <span class="legend-dot admin-dot"></span>
                    <span class="legend-name">Admins</span>
                  </div>
                  <div class="legend-right">
                    <span class="legend-count">{{ adminStats.adminCount }}</span>
                  </div>
                </a>
                <a class="legend-row" routerLink="/admin/users">
                  <div class="legend-left">
                    <span class="legend-dot billing-dot"></span>
                    <span class="legend-name">Billing Officers</span>
                  </div>
                  <div class="legend-right">
                    <span class="legend-count">{{ adminStats.billingOfficerCount }}</span>
                  </div>
                </a>
                <a class="legend-row" routerLink="/admin/users">
                  <div class="legend-left">
                    <span class="legend-dot account-dot"></span>
                    <span class="legend-name">Account Officers</span>
                  </div>
                  <div class="legend-right">
                    <span class="legend-count">{{ adminStats.accountOfficerCount }}</span>
                  </div>
                </a>
                <a class="legend-row" routerLink="/consumers">
                  <div class="legend-left">
                    <span class="legend-dot consumer-dot"></span>
                    <span class="legend-name">Consumers</span>
                  </div>
                  <div class="legend-right">
                    <span class="legend-count">{{ summary.totalConsumers || 0 }}</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Card 2: System Configuration -->
          <div class="dashboard-card admin-config-card" *ngIf="isAdmin">
            <div class="card-header">
              <h2>System Configuration</h2>
              <span class="card-subtitle">Manage system settings</span>
            </div>
            <div class="admin-config-content">
              <a class="config-item" routerLink="/admin/utility-types">
                <div class="config-icon utility-icon">
                  <mat-icon>electrical_services</mat-icon>
                </div>
                <div class="config-info">
                  <span class="config-title">Utility Types</span>
                  <span class="config-count">{{ utilityTypes.length }} active</span>
                </div>
                <mat-icon class="config-arrow">chevron_right</mat-icon>
              </a>
              <a class="config-item" routerLink="/admin/tariff-plans">
                <div class="config-icon tariff-icon">
                  <mat-icon>price_change</mat-icon>
                </div>
                <div class="config-info">
                  <span class="config-title">Tariff Plans</span>
                  <span class="config-count">{{ adminStats.tariffPlansCount }} plans</span>
                </div>
                <mat-icon class="config-arrow">chevron_right</mat-icon>
              </a>
              <a class="config-item" routerLink="/admin/billing-cycles">
                <div class="config-icon cycle-icon">
                  <mat-icon>event_repeat</mat-icon>
                </div>
                <div class="config-info">
                  <span class="config-title">Billing Cycles</span>
                  <span class="config-count">{{ adminStats.billingCyclesCount }} cycles</span>
                </div>
                <mat-icon class="config-arrow">chevron_right</mat-icon>
              </a>
              <a class="config-item" routerLink="/connections">
                <div class="config-icon connection-icon">
                  <mat-icon>cable</mat-icon>
                </div>
                <div class="config-info">
                  <span class="config-title">Connections</span>
                  <span class="config-count">{{ summary.activeConnections || 0 }} active</span>
                </div>
                <mat-icon class="config-arrow">chevron_right</mat-icon>
              </a>
            </div>
          </div>

          <!-- Row 2: Revenue Overview (Left) + Recent Activity (Right) -->
          <!-- Card 3: Revenue Overview (AccountOfficer only) -->
          <div class="dashboard-card revenue-card" *ngIf="isAccountOfficer">
            <div class="card-header">
              <h2>Revenue Overview</h2>
              <span class="card-subtitle">Billing & Collection by Utility</span>
            </div>
            <div class="revenue-content">
              <div class="revenue-summary">
                <div class="revenue-item">
                  <span class="revenue-label">TOTAL BILLED</span>
                  <span class="revenue-value">₹{{ getTotalBilled() | number:'1.0-0' }}</span>
                </div>
                <div class="revenue-item">
                  <span class="revenue-label">COLLECTED</span>
                  <span class="revenue-value">₹{{ summary.totalCollected | number:'1.0-0' }}</span>
                </div>
                <div class="revenue-item">
                  <span class="revenue-label">RATE</span>
                  <span class="revenue-value">{{ getCollectionRate() }}%</span>
                </div>
              </div>
              <div class="revenue-table">
                <div class="revenue-table-header">
                  <span>UTILITY</span>
                  <span>BILLED</span>
                  <span>COLLECTED</span>
                  <span>RATE</span>
                  <span>PROGRESS</span>
                </div>
                <div class="revenue-table-row" *ngFor="let item of summary.consumptionByUtilityType">
                  <div class="utility-cell">
                    <span class="utility-emoji-small">{{ getUtilityEmoji(item.utilityType) }}</span>
                    <span>{{ item.utilityType }}</span>
                    <span class="connection-badge">{{ item.connectionCount }}</span>
                  </div>
                  <span>₹{{ getUtilityBilled(item.utilityType) | number:'1.0-0' }}</span>
                  <span>₹{{ getUtilityCollected(item.utilityType) | number:'1.0-0' }}</span>
                  <span [ngClass]="getUtilityRateClass(item.utilityType)">{{ getUtilityRate(item.utilityType) }}%</span>
                  <div class="progress-bar-container">
                    <div class="progress-bar" [style.width.%]="getUtilityRate(item.utilityType)"></div>
                  </div>
                </div>
                <div class="revenue-table-row empty" *ngIf="summary.consumptionByUtilityType.length === 0">
                  <span>No utility data available</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 4: Recent Activity (AccountOfficer only) -->
          <div class="dashboard-card activity-card-premium" *ngIf="isAccountOfficer">
            <div class="card-header-premium">
              <div class="header-left">
                <h3>Recent Activity</h3>
                <span class="header-subtitle">Latest updates</span>
              </div>
              <span class="live-indicator">
                <span class="live-dot-pulse"></span>
                Live
              </span>
            </div>
            <div class="activity-timeline">
              <div class="timeline-item" *ngFor="let activity of recentActivities.slice(0, 8)">
                <div class="timeline-dot" [ngClass]="'dot-' + activity.type"></div>
                <div class="timeline-line"></div>
                <div class="timeline-content">
                  <p class="timeline-text">{{ activity.description }}</p>
                  <span class="timeline-time">{{ activity.timestamp | date:'MMM d, h:mm a' }}</span>
                </div>
              </div>
              <div class="timeline-item empty" *ngIf="recentActivities.length === 0">
                <div class="empty-state">
                  <mat-icon>history</mat-icon>
                  <p>No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Quick Actions (for Billing Officer) -->
        <section class="quick-actions-section" *ngIf="isBillingOfficer">
          <h2 class="section-title">Quick Actions</h2>
          <div class="quick-actions-grid two-columns">
            <a class="quick-action-card" routerLink="/meter-readings/new">
              <div class="action-icon-wrapper">
                <img src="assets/icons/meter-reading.png" alt="Enter Reading" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="action-icon-fallback" style="display: none;">
                  <mat-icon>speed</mat-icon>
                </div>
              </div>
              <span class="action-title">Enter Reading</span>
              <span class="action-subtitle">Record meter data</span>
            </a>
            <a class="quick-action-card" routerLink="/billing">
              <div class="action-icon-wrapper">
                <img src="assets/icons/view-bills.png" alt="View Bills" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="action-icon-fallback" style="display: none;">
                  <mat-icon>receipt_long</mat-icon>
                </div>
              </div>
              <span class="action-title">View Bills</span>
              <span class="action-subtitle">Manage invoices</span>
            </a>
          </div>
        </section>

        <!-- Billing Cycles Section (for Billing Officer) -->
        <section class="billing-cycles-section" *ngIf="isBillingOfficer">
          <h2 class="section-title">Billing Cycles</h2>
          <div class="billing-cycles-grid">
            <div class="billing-cycle-card" *ngFor="let utility of utilityTypes">
              <div class="cycle-left">
                <span class="utility-emoji">{{ getUtilityEmoji(utility.name) }}</span>
                <div class="cycle-info">
                  <span class="cycle-name">{{ utility.name }}</span>
                  <span class="cycle-unit">{{ utility.unitOfMeasurement }}</span>
                </div>
              </div>
              <div class="cycle-right">
                <span class="cycle-badge">Monthly</span>
                <span class="cycle-count">{{ getConnectionCountForUtility(utility.name) }} active</span>
              </div>
            </div>
            <div class="billing-cycle-card empty" *ngIf="utilityTypes.length === 0">
              <p>No utility types available</p>
            </div>
          </div>
        </section>

        <!-- Billing Officer: Bill Status + Recent Activity Grid -->
        <section class="cards-grid cards-grid-2col cards-compact" *ngIf="isBillingOfficer">
          <!-- Bill Status Distribution for Billing Officer -->
          <div class="dashboard-card bill-status-card bill-status-compact">
            <div class="card-header">
              <h2>Bill Status Distribution</h2>
              <span class="card-subtitle">Current billing status breakdown</span>
            </div>
            <div class="bill-status-content">
              <div class="total-bills">
                <span class="total-value">{{ getTotalBills() }}</span>
                <span class="total-label">TOTAL BILLS</span>
              </div>
              <div class="status-bar">
                <div class="bar-segment paid" [style.width.%]="getPaidPercentage()"></div>
                <div class="bar-segment due" [style.width.%]="getDuePercentage()"></div>
                <div class="bar-segment overdue" [style.width.%]="getOverduePercentage()"></div>
              </div>
              <div class="status-legend">
                <div class="legend-item">
                  <span class="legend-dot paid"></span>
                  <span class="legend-label">Paid</span>
                  <div class="legend-bar-container">
                    <div class="legend-bar paid" [style.width.%]="getPaidPercentage()"></div>
                  </div>
                  <span class="legend-value">{{ getPaidBills() }}</span>
                  <span class="legend-percent">{{ getPaidPercentage() }}%</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot due"></span>
                  <span class="legend-label">Due</span>
                  <div class="legend-bar-container">
                    <div class="legend-bar due" [style.width.%]="getDuePercentage()"></div>
                  </div>
                  <span class="legend-value">{{ summary.pendingBills }}</span>
                  <span class="legend-percent">{{ getDuePercentage() }}%</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot overdue"></span>
                  <span class="legend-label">Overdue</span>
                  <div class="legend-bar-container">
                    <div class="legend-bar overdue" [style.width.%]="getOverduePercentage()"></div>
                  </div>
                  <span class="legend-value">{{ summary.overdueBills }}</span>
                  <span class="legend-percent">{{ getOverduePercentage() }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity for Billing Officer -->
          <div class="dashboard-card activity-card-premium activity-compact">
            <div class="card-header-premium">
              <div class="header-left">
                <h3>Recent Activity</h3>
                <span class="header-subtitle">Latest updates</span>
              </div>
              <span class="live-indicator">
                <span class="live-dot-pulse"></span>
                Live
              </span>
            </div>
            <div class="activity-timeline">
              <div class="timeline-item" *ngFor="let activity of recentActivities">
                <div class="timeline-dot" [ngClass]="'dot-' + activity.type"></div>
                <div class="timeline-line"></div>
                <div class="timeline-content">
                  <p class="timeline-text">{{ activity.description }}</p>
                  <span class="timeline-time">{{ activity.timestamp | date:'MMM d, h:mm a' }}</span>
                </div>
              </div>
              <div class="timeline-item empty" *ngIf="recentActivities.length === 0">
                <div class="empty-state">
                  <mat-icon>history</mat-icon>
                  <p>No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ========== CONSUMER DASHBOARD ========== -->
        <section class="consumer-dashboard" *ngIf="isConsumer">
          <!-- Consumer Header -->
          <header class="consumer-header">
            <div class="header-left">
              <span class="greeting-text">{{ getGreeting() }},</span>
              <h1 class="user-name">{{ currentUser?.firstName || 'User' }}</h1>
            </div>
            <div class="header-right">
              <span class="role-badge">YOUR ACCOUNT</span>
              <button class="refresh-btn" (click)="refresh()" [disabled]="loading">
                <mat-icon [class.spinning]="loading">sync</mat-icon>
              </button>
            </div>
          </header>

          <!-- Consumer Stats Row -->
          <div class="consumer-stats-row">
            <div class="consumer-stat-card">
              <mat-icon>electrical_services</mat-icon>
              <div class="stat-content">
                <span class="stat-value">{{ summary.activeConnections }}</span>
                <span class="stat-label">Connections</span>
              </div>
            </div>
            <div class="consumer-stat-card">
              <mat-icon>receipt_long</mat-icon>
              <div class="stat-content">
                <span class="stat-value" [class.warning]="summary.pendingBills > 0">{{ summary.pendingBills }}</span>
                <span class="stat-label">Pending Bills</span>
              </div>
            </div>
            <div class="consumer-stat-card" *ngIf="summary.totalOutstanding > 0">
              <mat-icon>account_balance_wallet</mat-icon>
              <div class="stat-content">
                <span class="stat-value danger">₹{{ summary.totalOutstanding | number:'1.0-0' }}</span>
                <span class="stat-label">Outstanding</span>
              </div>
            </div>
          </div>

          <!-- Consumer Quick Actions -->
          <div class="quick-actions-section">
            <h3 class="section-title">Quick Actions</h3>
            <div class="consumer-quick-actions">
              <a class="consumer-action-card" routerLink="/billing">
                <div class="action-icon bills-icon">
                  <mat-icon>receipt_long</mat-icon>
                </div>
                <div class="action-content">
                  <span class="action-title">View Bills</span>
                  <span class="action-desc">Check & pay your bills</span>
                </div>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
              <a class="consumer-action-card" routerLink="/payments">
                <div class="action-icon payments-icon">
                  <mat-icon>payment</mat-icon>
                </div>
                <div class="action-content">
                  <span class="action-title">Payment History</span>
                  <span class="action-desc">View past transactions</span>
                </div>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
              <a class="consumer-action-card" routerLink="/reports/my-consumption">
                <div class="action-icon consumption-icon">
                  <mat-icon>bar_chart</mat-icon>
                </div>
                <div class="action-content">
                  <span class="action-title">My Consumption</span>
                  <span class="action-desc">View usage reports</span>
                </div>
                <mat-icon class="action-arrow">chevron_right</mat-icon>
              </a>
            </div>
          </div>

          <!-- Consumer Cards Grid -->
          <div class="consumer-cards-grid">
            <!-- Consumption by Utility Card -->
            <div class="dashboard-card consumption-card">
              <div class="card-header">
                <h2>Consumption by Utility</h2>
                <span class="card-subtitle">Usage across service types</span>
              </div>
              <div class="utility-cards">
                <div class="utility-card no-click" 
                     *ngFor="let item of summary.consumptionByUtilityType">
                  <div class="utility-emoji">{{ getUtilityEmoji(item.utilityType) }}</div>
                  <div class="utility-value">{{ item.totalConsumption | number:'1.0-0' }}</div>
                  <div class="utility-unit">{{ item.unit | uppercase }}</div>
                  <div class="utility-name">{{ item.utilityType }}</div>
                  <div class="card-accent"></div>
                </div>
                <div class="utility-card empty" *ngIf="summary.consumptionByUtilityType.length === 0">
                  <p>No consumption data</p>
                </div>
              </div>
            </div>

            <!-- Recent Activity Card -->
            <div class="consumer-card activity-card-premium">
              <div class="card-header-premium">
                <div class="header-left">
                  <h3>Recent Activity</h3>
                  <span class="header-subtitle">Latest updates on your account</span>
                </div>
                <span class="live-indicator">
                  <span class="live-dot-pulse"></span>
                  Live
                </span>
              </div>
              <div class="activity-timeline">
                <div class="timeline-item" *ngFor="let activity of recentActivities.slice(0, 6)">
                  <div class="timeline-dot" [ngClass]="'dot-' + activity.type"></div>
                  <div class="timeline-line"></div>
                  <div class="timeline-content">
                    <p class="timeline-text">{{ activity.description }}</p>
                    <span class="timeline-time">{{ activity.timestamp | date:'MMM d, h:mm a' }}</span>
                  </div>
                </div>
                <div class="timeline-item empty" *ngIf="recentActivities.length === 0">
                  <div class="empty-state">
                    <mat-icon>history</mat-icon>
                    <p>No recent activity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100%;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    /* Error Banner */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      margin-bottom: 1rem;
      color: #991B1B;

      mat-icon:first-child { font-size: 20px; }
      span { flex: 1; font-size: 0.875rem; }
      button { margin-left: auto; color: #991B1B; }
    }

    /* Loading Overlay */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;

      p {
        margin: 0;
        color: var(--text-tertiary);
        font-size: 0.875rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    /* ========== COMPACT DASHBOARD LAYOUT ========== */
    
    .dashboard-compact {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Header Row */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .header-left {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .greeting-text {
      font-size: 1.5rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-tertiary);
    }

    .user-name {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .role-badge {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      background: var(--bg-secondary);
      border-radius: 4px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--border-default);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--text-tertiary);
      }

      &.revenue mat-icon { color: #059669; }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
      line-height: 1;

      &.warning { color: #D97706; }
      &.danger { color: #DC2626; }
      &.success { color: #059669; }
    }

    .stat-label {
      font-size: 0.6875rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    /* ========== CARDS GRID - 2x2 Layout ========== */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .cards-grid-2col {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .cards-compact {
      .bill-status-compact,
      .activity-compact {
        max-height: 380px;
        display: flex;
        flex-direction: column;
      }

      .bill-status-compact {
        overflow: hidden;
      }

      .bill-status-compact .bill-status-content {
        padding: 1rem 1.5rem;
      }

      .bill-status-compact .total-bills {
        margin-bottom: 1rem;
      }

      .bill-status-compact .total-value {
        font-size: 2.5rem;
      }

      .bill-status-compact .status-legend {
        margin-top: 1rem;
        gap: 0.5rem;
      }

      .activity-compact .activity-timeline {
        padding: 1rem 1.5rem;
        overflow-y: auto;
        flex: 1;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;

          &:hover {
            background: #aaa;
          }
        }
      }

      .activity-compact .timeline-item {
        padding-bottom: 0.75rem;
      }
    }

    .dashboard-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .dashboard-card .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
        font-family: var(--font-serif);
        font-style: italic;
        color: var(--text-primary);
      }
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: var(--text-tertiary);
      font-style: italic;
    }

    /* ========== ADMIN USER MANAGEMENT CARD ========== */
    .admin-users-card {
      background: #F8F7F5;
    }

    .admin-users-content {
      padding: 1.5rem;
    }

    .user-role-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .user-role-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
    }

    .role-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      &.admin-icon { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      &.billing-icon { background: linear-gradient(135deg, #10b981, #059669); }
      &.account-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
      &.consumer-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    }

    .role-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .role-count {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .role-name {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .manage-users-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: var(--primary-600);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-700);
        transform: translateY(-1px);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* ========== ADMIN DONUT CHART STYLES ========== */
    .admin-users-content-v2 {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .donut-section {
      flex-shrink: 0;
    }

    .donut-chart {
      position: relative;
      width: 160px;
      height: 160px;
    }

    .circular-chart {
      display: block;
      width: 100%;
      height: 100%;
    }

    .circle-bg {
      fill: none;
      stroke: #e5e7eb;
      stroke-width: 3;
    }

    .circle {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      transform: rotate(-90deg);
      transform-origin: center;
      transition: stroke-dasharray 0.6s ease;
    }

    .circle.admin-segment { stroke: var(--primary-600); }
    .circle.billing-segment { stroke: var(--success-600); }
    .circle.account-segment { stroke: var(--warning-600); }
    .circle.consumer-segment { stroke: var(--info-600); }

    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .donut-total {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .donut-label {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.125rem;
    }

    .legend-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .legend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1rem;
      background: white;
      border-radius: 10px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
      }
    }

    .legend-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;

      &.admin-dot { background: var(--primary-600); }
      &.billing-dot { background: var(--success-600); }
      &.account-dot { background: var(--warning-600); }
      &.consumer-dot { background: var(--info-600); }
    }

    .legend-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .legend-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .legend-count {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
      min-width: 28px;
      text-align: right;
    }

    .legend-percent {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
      min-width: 40px;
      text-align: right;
    }

    /* ========== ADMIN CONFIG CARD ========== */
    .admin-config-card {
      background: #F8F7F5;
    }

    .admin-config-content {
      padding: 1rem;
    }

    .config-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      margin-bottom: 0.75rem;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

        .config-arrow {
          opacity: 1;
          transform: translateX(4px);
        }
      }
    }

    .config-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }

      &.utility-icon { background: linear-gradient(135deg, var(--warning-500), var(--warning-600)); }
      &.tariff-icon { background: linear-gradient(135deg, var(--success-500), var(--success-600)); }
      &.cycle-icon { background: linear-gradient(135deg, var(--primary-500), var(--primary-600)); }
      &.connection-icon { background: linear-gradient(135deg, var(--info-500), var(--info-600)); }
    }

    .config-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .config-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .config-count {
      font-size: 0.8125rem;
      color: var(--text-tertiary);
    }

    .config-arrow {
      color: var(--text-tertiary);
      opacity: 0.5;
      transition: all 0.2s ease;
    }

    /* ========== CONSUMPTION CARD ========== */
    .consumption-card {
      background: #F8F7F5;
    }

    .consumption-card .utility-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1.5rem;
    }

    .utility-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem 1rem 1.25rem;
      background: white;
      border: 1px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s ease;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }

      &.no-click {
        cursor: default;
      }

      &.active {
        border-color: var(--text-primary);
        border-width: 2px;
      }

      &.empty {
        grid-column: 1 / -1;
        padding: 2rem;
        color: var(--text-tertiary);
        cursor: default;
        box-shadow: none;

        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
    }

    .utility-emoji {
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 0.75rem;
    }

    .utility-value {
      font-size: 2rem;
      font-weight: 400;
      font-family: var(--font-serif);
      color: var(--text-primary);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .utility-unit {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.08em;
      margin-top: 0.25rem;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
    }

    .utility-name {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .card-accent {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40%;
      height: 4px;
      background: #1A1A1A;
      border-radius: 4px 4px 0 0;
    }

    /* ========== BILL STATUS CARD ========== */
    .bill-status-card .bill-status-content {
      padding: 1.5rem;
    }

    .total-bills {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .total-value {
      display: block;
      font-size: 3rem;
      font-weight: 400;
      font-family: var(--font-serif);
      color: var(--text-primary);
      line-height: 1;
    }

    .total-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.1em;
      margin-top: 0.5rem;
    }

    .status-bar {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: #f0f0f0;
      margin-bottom: 1.5rem;
    }

    .bar-segment {
      height: 100%;
      transition: width 0.3s ease;

      &.paid { background: #1A1A1A; }
      &.due { background: #9CA3AF; }
      &.overdue { background: #EF4444; }
    }

    .status-legend {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .legend-item {
      display: grid;
      grid-template-columns: 12px 60px 1fr auto auto;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;

      &.paid { background: #1A1A1A; }
      &.due { background: #9CA3AF; }
      &.overdue { background: #EF4444; }
    }

    .legend-label {
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .legend-bar-container {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .legend-bar {
      height: 100%;
      border-radius: 4px;

      &.paid { background: #1A1A1A; }
      &.due { background: #9CA3AF; }
      &.overdue { background: #EF4444; }
    }

    .legend-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      min-width: 24px;
      text-align: right;
    }

    .legend-percent {
      font-size: 0.875rem;
      color: var(--text-tertiary);
      min-width: 40px;
      text-align: right;
    }

    /* Bill Status Card Large (for Billing Officer - in place of Revenue) */
    .bill-status-card-large .bill-status-content {
      padding: 1.5rem;
    }

    /* ========== REVENUE CARD ========== */
    .revenue-card {
      /* Removed max-width to allow card to fill grid column */
      width: 100%;
    }

    .revenue-card .revenue-content {
      padding: 1.25rem;
    }

    .revenue-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .revenue-item {
      text-align: center;
    }

    .revenue-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.05em;
      margin-bottom: 0.375rem;
    }

    .revenue-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 400;
      font-family: var(--font-serif);
      color: var(--text-primary);
    }

    .revenue-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .revenue-table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 0.75fr 1.5fr;
      gap: 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-tertiary);
      letter-spacing: 0.05em;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .revenue-table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 0.75fr 1.5fr;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;
      color: var(--text-primary);
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8f8f8;

      &:last-child {
        border-bottom: none;
      }
    }

    .utility-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .utility-emoji-small {
      font-size: 1rem;
    }

    .connection-badge {
      font-size: 0.7rem;
      background: #f0f0f0;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      color: var(--text-tertiary);
    }

    .rate-high { color: #059669; }
    .rate-medium { color: #D97706; }
    .rate-low { color: #DC2626; }

    .progress-bar-container {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #1A1A1A;
      border-radius: 3px;
    }

    /* ========== ACTIVITY CARD ========== */
    .activity-card .activity-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid #f8f8f8;

      &:last-child { border-bottom: none; }

      &.empty {
        justify-content: center;
        color: var(--text-tertiary);
        padding: 2rem;
      }
    }

    .activity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ddd;
      margin-top: 0.375rem;
      flex-shrink: 0;

      &.dot-bill { background: #3B82F6; }
      &.dot-payment { background: #10B981; }
      &.dot-reading { background: #F59E0B; }
      &.dot-connection { background: #8B5CF6; }
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-primary);
        line-height: 1.4;
      }
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ========== ACTIONS SECTION ========== */
    .actions-section {
      margin-top: 1.25rem;
    }

    /* ========== QUICK ACTIONS SECTION (Card Style) ========== */
    .quick-actions-section {
      margin-bottom: 1.5rem;
    }

    .quick-actions-section .section-title {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      &.two-columns {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .quick-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1.5rem;
      background: white;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        border-color: #e0e0e0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        transform: translateY(-2px);
      }
    }

    .action-icon-wrapper {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      border-radius: 12px;
      background: #f8f9fa;

      img {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }
    }

    .action-icon-fallback {
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #6366f1;
      }
    }

    .action-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .action-subtitle {
      font-size: 0.8rem;
      color: var(--text-tertiary);
    }

    /* ========== BILLING CYCLES SECTION ========== */
    .billing-cycles-section {
      margin-bottom: 1.5rem;
    }

    .billing-cycles-section .section-title {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .billing-cycles-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .billing-cycle-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: white;
      border: 1px solid #f0f0f0;
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #e0e0e0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      &.empty {
        grid-column: span 4;
        justify-content: center;
        color: var(--text-tertiary);
      }
    }

    .cycle-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cycle-left .utility-emoji {
      font-size: 1.5rem;
    }

    .cycle-info {
      display: flex;
      flex-direction: column;
    }

    .cycle-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .cycle-unit {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    .cycle-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .cycle-badge {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      color: var(--text-secondary);
    }

    .cycle-count {
      font-size: 0.75rem;
      color: var(--text-tertiary);
    }

    /* ========== ACTIONS CARD ========== */
    .actions-card .actions-list {
      display: flex;
      flex-direction: column;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      color: var(--text-primary);
      text-decoration: none;
      border-bottom: 1px solid #f8f8f8;
      transition: all 0.2s ease;

      &:last-child { border-bottom: none; }

      &:hover {
        background: #f8f8f8;
        color: var(--primary-600);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--primary-600);
      }

      span {
        font-size: 0.9rem;
        font-weight: 500;
      }
    }

    /* Responsive */
    @media (max-width: 1100px) {
      .cards-grid {
        grid-template-columns: 1fr;
      }

      .consumption-card .utility-cards {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (max-width: 768px) {
      .consumption-card .utility-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .revenue-summary {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .revenue-table-header,
      .revenue-table-row {
        grid-template-columns: 1.5fr 1fr 1fr;
      }

      .revenue-table-header span:nth-child(4),
      .revenue-table-header span:nth-child(5),
      .revenue-table-row span:nth-child(4),
      .revenue-table-row .progress-bar-container {
        display: none;
      }
    }

    @media (max-width: 600px) {
      .dash-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .header-left {
        flex-direction: column;
        gap: 0.125rem;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .legend-item {
        grid-template-columns: 12px 50px 1fr auto;
      }

      .legend-percent {
        display: none;
      }
    }

    /* ========== CONSUMER DASHBOARD STYLES ========== */
    .consumer-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Consumer Header */
    .consumer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .consumer-header .header-left {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .consumer-header .greeting-text {
      font-size: 1.5rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-tertiary);
    }

    .consumer-header .user-name {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
    }

    .consumer-header .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .consumer-header .role-badge {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      background: var(--bg-secondary);
      border-radius: 4px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .consumer-header .refresh-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        border-color: var(--border-default);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Consumer Stats Row */
    .consumer-stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .consumer-stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      background: white;
      border: 1px solid var(--border-light);
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--border-default);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: var(--text-tertiary);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 500;
        font-family: var(--font-serif);
        color: var(--text-primary);
        line-height: 1;

        &.warning { color: #D97706; }
        &.danger { color: #DC2626; }
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
    }

    /* Quick Actions Section */
    .quick-actions-section {
      margin-bottom: 1.5rem;

      .section-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        margin: 0 0 1rem 0;
      }
    }

    /* Consumer Quick Actions */
    .consumer-quick-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .consumer-action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: white;
      border-radius: 16px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid #f5f5f5;
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        border-color: #e0e0e0;

        .action-arrow {
          transform: translateX(4px);
          opacity: 1;
        }
      }
    }

    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      &.bills-icon { background: linear-gradient(135deg, #92734e, #b08d5b); }
      &.payments-icon { background: linear-gradient(135deg, #059669, #34d399); }
      &.connections-icon { background: linear-gradient(135deg, #6366f1, #818cf8); }
      &.consumption-icon { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
      &.request-icon { background: linear-gradient(135deg, #14b8a6, #2dd4bf); }
    }

    .action-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .consumer-action-card .action-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .action-desc {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin-top: 0.125rem;
    }

    .action-arrow {
      color: var(--text-tertiary);
      opacity: 0.5;
      transition: all 0.25s ease;
    }

    /* Consumer Cards Grid */
    .consumer-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .consumer-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }

    .card-header-premium {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #f5f5f5;
    }

    .card-header-premium .header-left h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
    }

    .header-subtitle {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin-top: 0.25rem;
    }

    .header-badge {
      width: 40px;
      height: 40px;
      background: #faf8f5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.7rem;
      font-weight: 500;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .live-dot-pulse {
      width: 8px;
      height: 8px;
      background: #059669;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* Consumption Grid */
    .consumption-grid {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .consumption-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #faf8f5;
      border-radius: 14px;
      border-left: 4px solid #92734e;
      transition: all 0.2s ease;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      &.electric-type { border-left-color: #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
      &.water-type { border-left-color: #3b82f6; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
      &.gas-type { border-left-color: #ef4444; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }

      &.empty {
        padding: 3rem;
        justify-content: center;
        background: #f9f9f9;
        border-left: none;
      }
    }

    .consumption-icon {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .consumption-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .consumption-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .consumption-connections {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      margin-top: 0.125rem;
    }

    .consumption-value {
      text-align: right;
      display: flex;
      flex-direction: column;
    }

    .value-number {
      font-size: 1.75rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
      line-height: 1;
    }

    .value-unit {
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #d1d5db;
      }

      p {
        margin: 0;
        color: var(--text-tertiary);
        font-size: 0.9rem;
      }

      .empty-action {
        font-size: 0.85rem;
        font-weight: 500;
        color: #92734e;
        text-decoration: none;
        padding: 0.5rem 1rem;
        background: rgba(146, 115, 78, 0.1);
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(146, 115, 78, 0.2);
        }
      }
    }

    /* Activity Card for Account Officer */
    .activity-card-premium {
      max-height: 480px;
      display: flex;
      flex-direction: column;
    }

    /* Activity Timeline */
    .activity-timeline {
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex: 1;
      max-height: 400px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-default);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: var(--border-strong);
      }
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 1rem;
      padding-bottom: 1.25rem;

      &:last-child {
        padding-bottom: 0;

        .timeline-line { display: none; }
      }

      &.empty {
        padding: 2rem;
        justify-content: center;
      }
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
      z-index: 1;
      background: #9ca3af;

      &.dot-bill { background: #92734e; }
      &.dot-payment { background: #059669; }
      &.dot-reading { background: #6366f1; }
    }

    .timeline-line {
      position: absolute;
      left: 5px;
      top: 18px;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-text {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .timeline-time {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      margin-top: 0.25rem;
      display: block;
    }

    /* Consumer Footer Alert */
    .consumer-footer {
      margin-top: 0.5rem;
    }

    .footer-alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #fef3cd 0%, #ffeaa7 100%);
      border: 1px solid #f6e58d;
      border-radius: 14px;

      > mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #92734e;
      }
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .alert-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #92734e;
    }

    .alert-subtitle {
      font-size: 0.8rem;
      color: #a67c52;
    }

    .alert-action {
      font-size: 0.85rem;
      font-weight: 600;
      color: white;
      background: #92734e;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        background: #7d6142;
        transform: translateY(-1px);
      }
    }

    /* Consumer Dashboard Responsive */
    @media (max-width: 1000px) {
      .hero-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .hero-stats {
        width: 100%;
        justify-content: flex-start;
      }

      .consumer-cards-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .consumer-quick-actions {
        grid-template-columns: 1fr;
      }

      .hero-stats {
        flex-direction: column;
        gap: 0.75rem;
      }

      .hero-stat {
        width: 100%;
        justify-content: flex-start;
      }

      .consumer-hero-card {
        padding: 1.5rem;
      }

      .hero-avatar {
        width: 52px;
        height: 52px;
        font-size: 1.25rem;
      }

      .hero-info h2 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  summary: DashboardSummary | null = null;
  currentUser: User | null = null;
  lastUpdated: Date | null = null;
  recentActivities: RecentActivity[] = [];
  utilityTypes: UtilityType[] = [];
  selectedUtilityIndex = 0;
  paidBillsCount = 0;
  totalBillsCount = 0;
  
  // Admin stats
  adminStats = {
    adminCount: 0,
    billingOfficerCount: 0,
    accountOfficerCount: 0,
    tariffPlansCount: 0,
    billingCyclesCount: 0
  };
  
  // Role flags
  isAdmin = false;
  isBillingOfficer = false;
  isAccountOfficer = false;
  isConsumer = false;
  
  private refreshSubscription: Subscription | null = null;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService,
    private billsService: BillsService,
    private paymentsService: PaymentsService,
    private meterReadingsService: MeterReadingsService,
    private connectionsService: ConnectionsService,
    private utilityTypesService: UtilityTypesService,
    private tariffPlansService: TariffPlansService,
    private billingCyclesService: BillingCyclesService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.isAdmin = this.currentUser.role === 'Admin';
      this.isBillingOfficer = this.currentUser.role === 'BillingOfficer';
      this.isAccountOfficer = this.currentUser.role === 'AccountOfficer';
      this.isConsumer = this.currentUser.role === 'Consumer';
    }
  }

  getRoleSubtitle(): string {
    if (this.isAdmin) return 'System overview';
    if (this.isBillingOfficer) return 'Meter & bills';
    if (this.isAccountOfficer) return 'Revenue mgmt';
    if (this.isConsumer) return 'Your account';
    return 'Overview';
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getCollectionRate(): number {
    if (!this.summary) return 0;
    const billed = this.summary.totalBilled || 0;
    const collected = this.summary.totalCollected || 0;
    if (billed === 0) return 0;
    return Math.round((collected / billed) * 100 * 10) / 10;
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.startAutoRefresh();
    if (this.isBillingOfficer || this.isAdmin) {
      this.loadUtilityTypes();
    }
    if (this.isAdmin) {
      this.loadAdminStats();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.loadDashboard(true);
    });
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }

  refresh(): void {
    this.loadDashboard();
  }

  loadDashboard(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = null;
      this.cdr.detectChanges();
    }

    if (this.isConsumer) {
      this.loadConsumerDashboard(silent);
      return;
    }

    forkJoin({
      dashboard: this.reportsService.getDashboard().pipe(
        catchError(() => of({ success: false, data: null, message: '' }))
      ),
      billSummary: this.billsService.getSummary().pipe(
        catchError(() => of({ success: false, data: null, message: '' }))
      ),
      bills: this.billsService.getAll({ pageNumber: 1, pageSize: 5, sortBy: 'CreatedAt', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      payments: this.paymentsService.getAll({ pageNumber: 1, pageSize: 5, sortBy: 'PaymentDate', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      readings: this.meterReadingsService.getAll({ pageNumber: 1, pageSize: 5, sortBy: 'ReadingDate', sortDescending: true }).pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      )
    }).subscribe({
      next: (results) => {
        this.loading = false;
        this.lastUpdated = new Date();
        
        if (results.dashboard.success && results.dashboard.data) {
          this.summary = results.dashboard.data;
        } else {
          this.summary = {
            totalConsumers: 0,
            activeConnections: 0,
            pendingBills: 0,
            overdueBills: 0,
            totalRevenueThisMonth: 0,
            totalOutstanding: 0,
            recentActivities: [],
            consumptionByUtilityType: []
          };
        }

        // Get bill counts from summary
        if (results.billSummary.success && results.billSummary.data) {
          this.paidBillsCount = results.billSummary.data.paidBills || 0;
          this.totalBillsCount = results.billSummary.data.totalBills || 0;
        }

        // Use recentActivities from dashboard summary (from backend with proper timestamps)
        if (this.summary?.recentActivities && this.summary.recentActivities.length > 0) {
          this.recentActivities = this.summary.recentActivities;
        } else {
          // Fallback: construct from individual API responses
          const activities: RecentActivity[] = [];

          if (results.bills.success && results.bills.data) {
            results.bills.data.forEach(bill => {
              activities.push({
                type: 'bill',
                description: `Bill #${bill.billNumber} - ₹${bill.totalAmount?.toFixed(2) || '0.00'} (${bill.status})`,
                timestamp: bill.createdAt || new Date().toISOString()
              });
            });
          }

          if (results.payments.success && results.payments.data) {
            results.payments.data.forEach(payment => {
              activities.push({
                type: 'payment',
                description: `Payment of ₹${payment.amount?.toFixed(2) || '0.00'} received via ${payment.paymentMethod || 'N/A'}`,
                timestamp: payment.createdAt || new Date().toISOString()
              });
            });
          }

          if (results.readings.success && results.readings.data) {
            results.readings.data.forEach(reading => {
              activities.push({
                type: 'reading',
                description: `Meter reading: ${reading.currentReading} units for ${reading.connectionNumber || 'Connection'}`,
                timestamp: reading.createdAt || new Date().toISOString()
              });
            });
          }

          const sortedActivities = [...activities].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          this.recentActivities = sortedActivities.slice(0, 10);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (!silent) {
          this.error = err?.error?.message || 'Failed to load dashboard data. Is the backend running?';
        }
        this.summary = {
          totalConsumers: 0,
          activeConnections: 0,
          pendingBills: 0,
          overdueBills: 0,
          totalRevenueThisMonth: 0,
          totalOutstanding: 0,
          recentActivities: [],
          consumptionByUtilityType: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  loadConsumerDashboard(silent = false): void {
    forkJoin({
      bills: this.billsService.getMyBills().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      connections: this.connectionsService.getMyConnections().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      ),
      payments: this.paymentsService.getMyPayments().pipe(
        catchError(() => of({ success: false, data: [], message: '' }))
      )
    }).subscribe({
      next: (results) => {
        this.loading = false;
        this.lastUpdated = new Date();

        const bills = results.bills.data || [];
        const connections = results.connections.data || [];
        const payments = results.payments.data || [];
        
        const pendingBills = bills.filter(b => b.status !== 'Paid').length;
        const totalOutstanding = bills.reduce((sum, b) => sum + (b.outstandingBalance || 0), 0);
        const activeConnections = connections.filter((c: any) => 
          c.status?.toLowerCase() === 'active'
        ).length;

        const consumptionMap = new Map<string, { total: number; count: number; unit: string }>();
        connections.forEach((conn: any) => {
          const utilityType = conn.utilityType || conn.utilityTypeName || 'Unknown';
          const lastReading = conn.lastReading || 0;
          const unit = this.getUnitForUtility(utilityType);
          
          if (consumptionMap.has(utilityType)) {
            const existing = consumptionMap.get(utilityType)!;
            existing.total += lastReading;
            existing.count += 1;
          } else {
            consumptionMap.set(utilityType, { total: lastReading, count: 1, unit });
          }
        });

        const consumptionByUtilityType = Array.from(consumptionMap.entries()).map(([utilityType, data]) => ({
          utilityType,
          totalConsumption: data.total,
          connectionCount: data.count,
          unit: data.unit
        }));

        const activities: RecentActivity[] = [];

        bills.slice(0, 5).forEach(bill => {
          activities.push({
            type: 'bill',
            description: `Bill #${bill.billNumber} - ₹${bill.totalAmount?.toFixed(2) || '0.00'} (${bill.status})`,
            timestamp: (bill as any).createdAt || bill.dueDate || new Date().toISOString()
          });
        });

        payments.slice(0, 5).forEach((payment: any) => {
          activities.push({
            type: 'payment',
            description: `Payment of ₹${payment.amount?.toFixed(2) || '0.00'} via ${payment.paymentMethod || 'N/A'}`,
            timestamp: payment.createdAt || payment.paymentDate || new Date().toISOString()
          });
        });

        const sortedActivities = [...activities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);

        this.summary = {
          totalConsumers: 0,
          activeConnections: activeConnections,
          pendingBills: pendingBills,
          overdueBills: bills.filter(b => b.status === 'Overdue').length,
          totalRevenueThisMonth: 0,
          totalOutstanding: totalOutstanding,
          recentActivities: sortedActivities,
          consumptionByUtilityType: consumptionByUtilityType
        };

        this.recentActivities = sortedActivities;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        if (!silent) {
          this.error = 'Failed to load your dashboard data.';
        }
        this.summary = {
          totalConsumers: 0,
          activeConnections: 0,
          pendingBills: 0,
          overdueBills: 0,
          totalRevenueThisMonth: 0,
          totalOutstanding: 0,
          recentActivities: [],
          consumptionByUtilityType: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  getUnitForUtility(utilityType: string): string {
    const lower = utilityType.toLowerCase();
    if (lower.includes('electric')) return 'kWh';
    if (lower.includes('water')) return 'KL';
    if (lower.includes('gas')) return 'SCM';
    return 'units';
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'bill': 'receipt',
      'payment': 'payment',
      'reading': 'speed',
      'connection': 'electrical_services',
      'consumer': 'person_add'
    };
    return icons[type.toLowerCase()] || 'info';
  }

  loadUtilityTypes(): void {
    this.utilityTypesService.getAll().pipe(
      catchError(() => of({ success: false, data: [], message: '' }))
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilityTypes = response.data.filter(u => u.isActive);
        }
        this.cdr.detectChanges();
      }
    });
  }

  getBillingCycleLabel(months: number): string {
    switch (months) {
      case 1: return 'Monthly';
      case 2: return 'Bi-Monthly';
      case 3: return 'Quarterly';
      default: return `${months} Months`;
    }
  }

  getUtilityIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getUtilityIconClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'icon-electricity';
    if (lower.includes('water')) return 'icon-water';
    if (lower.includes('gas')) return 'icon-gas';
    if (lower.includes('internet')) return 'icon-internet';
    return 'icon-default';
  }

  getUtilityEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return '⚡';
    if (lower.includes('water')) return '💧';
    if (lower.includes('gas')) return '🔥';
    if (lower.includes('internet')) return '📡';
    if (lower.includes('cng')) return '⛽';
    return '⚙️';
  }

  getUtilityColorClass(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'electric-type';
    if (lower.includes('water')) return 'water-type';
    if (lower.includes('gas') || lower.includes('cng')) return 'gas-type';
    return '';
  }

  getConnectionCountForUtility(utilityName: string): number {
    if (!this.summary?.consumptionByUtilityType) return 0;
    const utility = this.summary.consumptionByUtilityType.find(
      u => u.utilityType.toLowerCase() === utilityName.toLowerCase()
    );
    return utility?.connectionCount || 0;
  }

  getTotalBills(): number {
    if (!this.summary) return 0;
    // Total bills = paid + pending + overdue
    return this.paidBillsCount + this.summary.pendingBills + this.summary.overdueBills;
  }

  getPaidBills(): number {
    return this.paidBillsCount;
  }

  getPaidPercentage(): number {
    const total = this.getTotalBills();
    if (total === 0) return 0;
    return Math.round((this.getPaidBills() / total) * 100);
  }

  getDuePercentage(): number {
    if (!this.summary) return 0;
    const total = this.getTotalBills();
    if (total === 0) return 0;
    return Math.round((this.summary.pendingBills / total) * 100);
  }

  getOverduePercentage(): number {
    if (!this.summary) return 0;
    const total = this.getTotalBills();
    if (total === 0) return 0;
    return Math.round((this.summary.overdueBills / total) * 100);
  }

  getTotalBilled(): number {
    if (!this.summary) return 0;
    return this.summary.totalBilled || 0;
  }

  getUtilityBilled(utilityType: string): number {
    if (!this.summary) return 0;
    const revenue = this.summary.revenueByUtilityType?.find(
      (r: UtilityRevenue) => r.utilityType.toLowerCase() === utilityType.toLowerCase()
    );
    if (revenue) return revenue.billedAmount || 0;
    return 0;
  }

  getUtilityCollected(utilityType: string): number {
    if (!this.summary) return 0;
    const revenue = this.summary.revenueByUtilityType?.find(
      (r: UtilityRevenue) => r.utilityType.toLowerCase() === utilityType.toLowerCase()
    );
    if (revenue) return revenue.collected || 0;
    return 0;
  }

  getUtilityRate(utilityType: string): number {
    const billed = this.getUtilityBilled(utilityType);
    const collected = this.getUtilityCollected(utilityType);
    if (billed === 0) return 0;
    return Math.round((collected / billed) * 100);
  }

  getUtilityRateClass(utilityType: string): string {
    const rate = this.getUtilityRate(utilityType);
    if (rate >= 70) return 'rate-high';
    if (rate >= 40) return 'rate-medium';
    return 'rate-low';
  }

  // User distribution chart methods
  getTotalUsers(): number {
    return this.adminStats.adminCount + 
           this.adminStats.billingOfficerCount + 
           this.adminStats.accountOfficerCount + 
           (this.summary?.totalConsumers || 0);
  }

  getAdminPercentage(): number {
    const total = this.getTotalUsers();
    if (total === 0) return 0;
    return Math.round((this.adminStats.adminCount / total) * 100);
  }

  getBillingPercentage(): number {
    const total = this.getTotalUsers();
    if (total === 0) return 0;
    return Math.round((this.adminStats.billingOfficerCount / total) * 100);
  }

  getAccountPercentage(): number {
    const total = this.getTotalUsers();
    if (total === 0) return 0;
    return Math.round((this.adminStats.accountOfficerCount / total) * 100);
  }

  getConsumerPercentage(): number {
    const total = this.getTotalUsers();
    if (total === 0) return 0;
    return Math.round(((this.summary?.totalConsumers || 0) / total) * 100);
  }

  loadAdminStats(): void {
    // Load users to count by role
    this.authService.getUsers({ pageNumber: 1, pageSize: 1000 }).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response: any) => {
      const users = response.data || response || [];
      this.adminStats.adminCount = users.filter((u: User) => u.role === 'Admin').length;
      this.adminStats.billingOfficerCount = users.filter((u: User) => u.role === 'BillingOfficer').length;
      this.adminStats.accountOfficerCount = users.filter((u: User) => u.role === 'AccountOfficer').length;
      this.cdr.detectChanges();
    });

    // Load tariff plans count
    this.tariffPlansService.getAll().pipe(
      catchError(() => of({ data: [] }))
    ).subscribe((response: any) => {
      const plans = response.data || [];
      this.adminStats.tariffPlansCount = plans.filter((p: TariffPlan) => p.isActive).length;
      this.cdr.detectChanges();
    });

    // Load billing cycles count - showing 3 cycle types (Monthly, Bi-monthly, Quarterly)
    this.adminStats.billingCyclesCount = 3;
    this.cdr.detectChanges();
  }
}
