import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConnectionsService } from '../../../core/services/connections.service';
import { AuthService } from '../../../core/services/auth.service';
import { Connection } from '../../../core/models';

@Component({
  selector: 'app-connection-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/connections" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 *ngIf="connection">Connection {{ connection.connectionNumber }}</h1>
          <p *ngIf="connection">Meter: {{ connection.meterNumber }}</p>
        </div>
        <div class="header-actions" *ngIf="connection && canEdit">
          <button mat-stroked-button [routerLink]="['/connections', connection.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading && connection" class="detail-content">
        <div class="detail-grid">
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Connection Details</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Status</span>
                  <mat-chip [ngClass]="connection.status === 'Active' ? 'status-active' : 'status-inactive'">
                    {{ connection.status }}
                  </mat-chip>
                </div>
                <div class="info-item">
                  <span class="label">Utility Type</span>
                  <span class="value">{{ connection.utilityTypeName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Tariff Plan</span>
                  <span class="value">{{ connection.tariffPlanName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Connection Date</span>
                  <span class="value">{{ connection.connectionDate | date:'mediumDate' }}</span>
                </div>
                <div class="info-item" *ngIf="connection.loadSanctioned">
                  <span class="label">Load Sanctioned</span>
                  <span class="value">{{ connection.loadSanctioned }} kW</span>
                </div>
                <div class="info-item" *ngIf="connection.installationAddress">
                  <span class="label">Installation Address</span>
                  <span class="value">{{ connection.installationAddress }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="consumer-card">
            <mat-card-header>
              <mat-card-title>Consumer Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Consumer Name</span>
                  <span class="value">{{ connection.consumerName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Consumer Number</span>
                  <span class="value">{{ connection.consumerNumber }}</span>
                </div>
              </div>
              <button mat-stroked-button [routerLink]="['/consumers', connection.consumerId]" class="view-consumer-btn">
                View Consumer Profile
              </button>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        <mat-icon>error</mat-icon>
        <span>{{ error }}</span>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;

      .header-content {
        flex: 1;
        h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
        p { margin: 0.25rem 0 0; color: #64748b; }
      }
    }

    .loading { display: flex; justify-content: center; padding: 3rem; }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
      }

      .value {
        font-size: 0.95rem;
        color: #1e293b;
      }
    }

    .view-consumer-btn {
      margin-top: 1rem;
    }

    .reading-info {
      margin-bottom: 1rem;

      .reading-value {
        font-size: 2rem;
        font-weight: 700;
        color: #3b82f6;
      }

      .reading-date {
        color: #64748b;
      }
    }

    .no-reading {
      color: #64748b;
      margin-bottom: 1rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #ef4444;
      padding: 1rem;
      background: #fef2f2;
      border-radius: 8px;
    }

    mat-chip {
      font-size: 0.75rem;
      &.status-active { background-color: #dcfce7 !important; color: #166534 !important; }
      &.status-inactive { background-color: #fee2e2 !important; color: #dc2626 !important; }
    }
  `]
})
export class ConnectionDetailComponent implements OnInit {
  connection: Connection | null = null;
  loading = true;
  error: string | null = null;
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private connectionsService: ConnectionsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Only Admin can edit - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadConnection(id);
    } else {
      this.error = 'Invalid connection ID';
      this.loading = false;
    }
  }

  loadConnection(id: number): void {
    this.connectionsService.getById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.connection = response.data;
        } else {
          this.error = response.message || 'Connection not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load connection';
        this.cdr.detectChanges();
      }
    });
  }
}
