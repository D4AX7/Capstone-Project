import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsumersService } from '../../../core/services/consumers.service';
import { AuthService } from '../../../core/services/auth.service';
import { Consumer } from '../../../core/models';

@Component({
  selector: 'app-consumer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/consumers" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 *ngIf="consumer">{{ consumer.firstName }} {{ consumer.lastName }}</h1>
          <p *ngIf="consumer">Consumer #{{ consumer.consumerNumber }}</p>
        </div>
        <div class="header-actions" *ngIf="consumer && canEdit">
          <button mat-stroked-button [routerLink]="['/consumers', consumer.id, 'edit']">
            <mat-icon>edit</mat-icon>
            Edit
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading && consumer" class="detail-content">
        <div class="detail-grid">
          <!-- Basic Info Card -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Basic Information</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Status</span>
                  <mat-chip [color]="consumer.isActive ? 'primary' : 'warn'" selected>
                    {{ consumer.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </div>
                <div class="info-item">
                  <span class="label">Email</span>
                  <span class="value">{{ consumer.email }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Phone</span>
                  <span class="value">{{ consumer.phone || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Registration Date</span>
                  <span class="value">{{ consumer.registrationDate | date:'mediumDate' }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Address Card -->
          <mat-card class="address-card">
            <mat-card-header>
              <mat-card-title>Address</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="address-text">
                <p>{{ consumer.address }}</p>
                <p>{{ consumer.city }}, {{ consumer.state }} {{ consumer.postalCode }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Connections Card -->
        <mat-card class="connections-card">
          <mat-card-header>
            <mat-card-title>Connections ({{ consumer.connections.length }})</mat-card-title>
            <button mat-stroked-button [routerLink]="['/connections/new']" [queryParams]="{consumerId: consumer.id}" *ngIf="canEdit">
              <mat-icon>add</mat-icon>
              Add Connection
            </button>
          </mat-card-header>
          <mat-card-content>
            <mat-list *ngIf="consumer.connections.length > 0">
              <mat-list-item *ngFor="let conn of consumer.connections" [routerLink]="['/connections', conn.id]" class="connection-item">
                <mat-icon matListItemIcon>electrical_services</mat-icon>
                <div matListItemTitle>{{ conn.connectionNumber }} - {{ conn.meterNumber }}</div>
                <div matListItemLine>{{ conn.utilityType }} | {{ conn.tariffPlan }}</div>
                <mat-chip matListItemMeta [ngClass]="conn.status === 'Active' ? 'status-active' : 'status-inactive'">
                  {{ conn.status }}
                </mat-chip>
              </mat-list-item>
            </mat-list>
            <div *ngIf="consumer.connections.length === 0" class="no-connections">
              <mat-icon>info</mat-icon>
              <p>No connections found for this consumer</p>
            </div>
          </mat-card-content>
        </mat-card>
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

      .back-btn {
        margin-top: 0.25rem;
      }

      .header-content {
        flex: 1;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        p {
          margin: 0.25rem 0 0;
          color: #64748b;
        }
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

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
        letter-spacing: 0.5px;
      }

      .value {
        font-size: 0.95rem;
        color: #1e293b;
      }
    }

    .address-text p {
      margin: 0 0 0.25rem;
      color: #1e293b;
    }

    .connections-card {
      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        button {
          margin-left: auto;
        }
      }

      mat-card-content {
        padding: 0 !important;
      }
    }

    .connection-item {
      cursor: pointer;
      &:hover {
        background: #f8fafc;
      }
    }

    .no-connections {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      color: #64748b;
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
export class ConsumerDetailComponent implements OnInit {
  consumer: Consumer | null = null;
  loading = true;
  error: string | null = null;
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consumersService: ConsumersService,
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
      this.loadConsumer(id);
    } else {
      this.error = 'Invalid consumer ID';
      this.loading = false;
    }
  }

  loadConsumer(id: number): void {
    this.consumersService.getById(id).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.consumer = response.data;
        } else {
          this.error = response.message || 'Consumer not found';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load consumer';
        this.cdr.detectChanges();
      }
    });
  }
}
