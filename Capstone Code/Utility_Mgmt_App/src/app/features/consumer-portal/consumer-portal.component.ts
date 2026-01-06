import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { ConsumersService } from '../../core/services/consumers.service';
import { Consumer } from '../../core/models';

@Component({
  selector: 'app-consumer-portal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule
  ],
  template: `
    <div class="my-account-container">
      <div class="page-header">
        <h1>My Account</h1>
        <p class="subtitle">View and manage your account information</p>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading your profile...</p>
      </div>

      <div *ngIf="error && !loading" class="error-container">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadProfile()">Retry</button>
      </div>

      <div *ngIf="consumer && !loading" class="profile-content">
        <!-- Profile Overview Card -->
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="avatar">
              <mat-icon>account_circle</mat-icon>
            </div>
            <mat-card-title>{{ consumer.firstName }} {{ consumer.lastName }}</mat-card-title>
            <mat-card-subtitle>Consumer #{{ consumer.consumerNumber }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="profile-info">
              <div class="info-item">
                <mat-icon>email</mat-icon>
                <span>{{ consumer.email }}</span>
              </div>
              <div class="info-item" *ngIf="consumer.phone">
                <mat-icon>phone</mat-icon>
                <span>{{ consumer.phone }}</span>
              </div>
              <div class="info-item">
                <mat-icon>location_on</mat-icon>
                <span>{{ consumer.address }}, {{ consumer.city }}, {{ consumer.state }} - {{ consumer.postalCode }}</span>
              </div>
              <div class="info-item">
                <mat-icon>calendar_today</mat-icon>
                <span>Member since {{ consumer.registrationDate | date:'mediumDate' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Edit Profile Card -->
        <mat-card class="edit-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit</mat-icon>
              Edit Profile
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" placeholder="Enter first name">
                  <mat-icon matPrefix>person</mat-icon>
                  <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" placeholder="Enter last name">
                  <mat-icon matPrefix>person</mat-icon>
                  <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Phone Number</mat-label>
                  <input matInput formControlName="phone" placeholder="Enter phone number">
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>
              </div>

              <mat-divider></mat-divider>
              <h3 class="section-title">Address Information</h3>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address</mat-label>
                  <input matInput formControlName="address" placeholder="Enter address">
                  <mat-icon matPrefix>home</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row three-cols">
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput formControlName="city" placeholder="Enter city">
                  <mat-icon matPrefix>location_city</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>State</mat-label>
                  <input matInput formControlName="state" placeholder="Enter state">
                  <mat-icon matPrefix>map</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Postal Code</mat-label>
                  <input matInput formControlName="postalCode" placeholder="Enter postal code">
                  <mat-icon matPrefix>markunread_mailbox</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-button type="button" (click)="resetForm()" [disabled]="saving">
                  <mat-icon>refresh</mat-icon>
                  Reset
                </button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                  <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
                  <mat-icon *ngIf="!saving">save</mat-icon>
                  {{ saving ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Connections Card -->
        <mat-card class="connections-card" *ngIf="consumer.connections && consumer.connections.length > 0">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>electrical_services</mat-icon>
              My Connections
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let conn of consumer.connections" class="connection-item">
                <mat-icon matListItemIcon>{{ getUtilityIcon(conn.utilityType) }}</mat-icon>
                <div matListItemTitle>{{ conn.utilityType }} - {{ conn.connectionNumber }}</div>
                <div matListItemLine>
                  Meter: {{ conn.meterNumber }} | Plan: {{ conn.tariffPlan }}
                </div>
                <div matListItemMeta>
                  <mat-chip [class]="conn.status === 'Active' ? 'status-active' : 'status-inactive'">
                    {{ conn.status }}
                  </mat-chip>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .my-account-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.025em;
      }

      .subtitle {
        margin: 0.5rem 0 0;
        color: var(--text-tertiary);
        font-size: 1rem;
      }
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--error-500);
      }
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-card {
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      background: var(--bg-surface);
      border-top: 4px solid var(--primary-500);
      
      .avatar {
        background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: var(--radius-lg);

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: white;
        }
      }

      .profile-info {
        margin-top: 16px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-light);

          &:last-child {
            border-bottom: none;
          }

          mat-icon {
            color: var(--primary-600);
          }
          
          span {
            color: var(--text-secondary);
          }
        }
      }
    }

    .edit-card {
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      background: var(--bg-surface);
      
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-600);
        }
      }

      form {
        margin-top: 16px;
      }

      .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;

        mat-form-field {
          flex: 1;
        }

        &.three-cols mat-form-field {
          flex: 1;
        }

        .full-width {
          width: 100%;
        }
      }

      .section-title {
        margin: 24px 0 16px;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      mat-divider {
        margin: 16px 0;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid var(--border-light);

        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        mat-spinner {
          margin-right: 8px;
        }
      }
    }

    .connections-card {
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      background: var(--bg-surface);
      
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: var(--text-primary);

        mat-icon {
          color: var(--primary-600);
        }
      }

      .connection-item {
        margin-bottom: 8px;

        mat-icon {
          color: var(--primary-600);
        }
      }

      .status-active {
        background-color: var(--success-500) !important;
        color: white !important;
      }

      .status-inactive {
        background-color: var(--text-muted) !important;
        color: white !important;
      }
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;

        &.three-cols {
          flex-direction: column;
        }
      }
    }
  `]
})
export class ConsumerPortalComponent implements OnInit {
  consumer: Consumer | null = null;
  loading = false;
  saving = false;
  error = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private consumersService: ConsumersService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      postalCode: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';
    
    this.consumersService.getMyProfile().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.consumer = response.data;
          this.populateForm();
        } else {
          this.error = response.message || 'Failed to load profile';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load profile. Please try again.';
        this.cdr.detectChanges();
        console.error('Error loading profile:', err);
      }
    });
  }

  populateForm(): void {
    if (this.consumer) {
      this.form.patchValue({
        firstName: this.consumer.firstName,
        lastName: this.consumer.lastName,
        phone: this.consumer.phone || '',
        address: this.consumer.address,
        city: this.consumer.city,
        state: this.consumer.state,
        postalCode: this.consumer.postalCode
      });
    }
  }

  resetForm(): void {
    this.populateForm();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const payload = this.form.value;

    this.consumersService.updateMyProfile(payload).subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success && response.data) {
          this.consumer = response.data;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          this.snackBar.open(response.message || 'Failed to update profile', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error updating profile:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getUtilityIcon(utilityType: string): string {
    const type = utilityType.toLowerCase();
    if (type.includes('electric')) return 'bolt';
    if (type.includes('water')) return 'water_drop';
    if (type.includes('gas')) return 'local_fire_department';
    return 'electrical_services';
  }
}
