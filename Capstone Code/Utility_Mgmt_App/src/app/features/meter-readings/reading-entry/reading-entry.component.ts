import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { ConnectionsService } from '../../../core/services/connections.service';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { CreateMeterReadingRequest, UtilityType } from '../../../core/models';

interface BillingPeriod {
  label: string;
  month: number; // Starting month of the period
}

@Component({
  selector: 'app-reading-entry',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="page-container">
      <!-- Premium Page Header -->
      <div class="page-header-card">
        <div class="header-left">
          <button class="back-btn" routerLink="/meter-readings">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-content">
            <div class="header-badge">
              <mat-icon>speed</mat-icon>
              <span>METER READING</span>
            </div>
            <h1>{{ isEditMode ? 'Edit Reading' : 'New Reading' }}</h1>
            <p>{{ isEditMode ? 'Update meter reading details' : 'Record a new meter reading for billing' }}</p>
          </div>
        </div>
        <div class="header-right" *ngIf="selectedUtilityType">
          <div class="utility-indicator">
            <div class="utility-icon-wrap" [ngClass]="getUtilityColorClass(selectedUtilityType.name)">
              <mat-icon>{{ getUtilityIcon(selectedUtilityType.name) }}</mat-icon>
            </div>
            <div class="utility-info">
              <span class="utility-name">{{ selectedUtilityType.name }}</span>
              <span class="utility-cycle">{{ getBillingCycleLabel(selectedUtilityType.billingCycleMonths) }} Billing</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Form Card -->
      <div class="form-card">
        <div *ngIf="loading" class="loading-state">
          <div class="loading-spinner">
            <mat-spinner diameter="48"></mat-spinner>
          </div>
          <p>Loading meter reading data...</p>
        </div>

        <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Step 1: Connection Selection -->
          <div class="form-section">
            <div class="section-header">
              <div class="step-indicator">
                <span class="step-number">1</span>
              </div>
              <div class="section-info">
                <h3>Select Connection</h3>
                <p>Choose the utility connection for this reading</p>
              </div>
            </div>
            
            <mat-form-field appearance="outline" class="full-width premium-select">
              <mat-label>Connection</mat-label>
              <mat-select formControlName="connectionId" (selectionChange)="onConnectionChange($event.value)">
                <mat-option *ngFor="let conn of connections" [value]="conn.id">
                  <div class="connection-option-content">
                    <span class="conn-number">{{ conn.connectionNumber }}</span>
                    <span class="conn-separator">•</span>
                    <span class="conn-name">{{ conn.consumerName }}</span>
                    <span class="conn-badge">{{ conn.utilityType }}</span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-icon matPrefix class="field-icon">electric_meter</mat-icon>
              <mat-error *ngIf="form.get('connectionId')?.hasError('required')">
                Please select a connection
              </mat-error>
            </mat-form-field>

            <!-- Selected Connection Card -->
            <div class="selected-connection-card" *ngIf="selectedConnection">
              <div class="connection-header">
                <mat-icon>check_circle</mat-icon>
                <span>Connection Selected</span>
              </div>
              <div class="connection-details">
                <div class="detail-item">
                  <div class="detail-icon"><mat-icon>person</mat-icon></div>
                  <div class="detail-content">
                    <span class="detail-label">Consumer</span>
                    <span class="detail-value">{{ selectedConnection.consumerName }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon"><mat-icon>{{ getUtilityIcon(selectedConnection.utilityType) }}</mat-icon></div>
                  <div class="detail-content">
                    <span class="detail-label">Utility Type</span>
                    <span class="detail-value">{{ selectedConnection.utilityType }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon"><mat-icon>tag</mat-icon></div>
                  <div class="detail-content">
                    <span class="detail-label">Connection #</span>
                    <span class="detail-value">{{ selectedConnection.connectionNumber }}</span>
                  </div>
                </div>
                <div class="detail-item" *ngIf="selectedConnection.address">
                  <div class="detail-icon"><mat-icon>location_on</mat-icon></div>
                  <div class="detail-content">
                    <span class="detail-label">Address</span>
                    <span class="detail-value">{{ selectedConnection.address }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-divider">
            <div class="divider-line"></div>
          </div>

          <!-- Step 2: Billing Period -->
          <div class="form-section">
            <div class="section-header">
              <div class="step-indicator">
                <span class="step-number">2</span>
              </div>
              <div class="section-info">
                <h3>Billing Period</h3>
                <p>Specify the billing month and year for this reading</p>
              </div>
            </div>

            <div class="billing-grid">
              <div class="billing-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Period</mat-label>
                  <mat-select formControlName="billingMonth">
                    <mat-option *ngFor="let period of billingPeriods" [value]="period.month">
                      {{ period.label }}
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix class="field-icon">calendar_month</mat-icon>
                </mat-form-field>
              </div>
              <div class="billing-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Year</mat-label>
                  <input matInput type="number" formControlName="billingYear">
                  <mat-icon matPrefix class="field-icon">event</mat-icon>
                </mat-form-field>
              </div>
            </div>
          </div>

          <div class="section-divider">
            <div class="divider-line"></div>
          </div>

          <!-- Step 3: Meter Readings -->
          <div class="form-section readings-section">
            <div class="section-header">
              <div class="step-indicator highlight">
                <span class="step-number">3</span>
              </div>
              <div class="section-info">
                <h3>Meter Readings</h3>
                <p>Enter the current meter reading value</p>
              </div>
            </div>

            <div class="meter-readings-container">
              <div class="reading-box previous-reading">
                <div class="reading-header">
                  <mat-icon>history</mat-icon>
                  <span>Previous Reading</span>
                </div>
                <div class="reading-display">
                  <span class="reading-number">{{ form.get('previousReading')?.value || 0 }}</span>
                  <span class="reading-unit">units</span>
                </div>
                <div class="reading-footer">
                  <span>Last recorded value</span>
                </div>
              </div>

              <div class="reading-arrow-container">
                <div class="arrow-line"></div>
                <div class="arrow-icon">
                  <mat-icon>trending_flat</mat-icon>
                </div>
                <div class="arrow-line"></div>
              </div>

              <div class="reading-box current-reading">
                <div class="reading-header">
                  <mat-icon>edit_note</mat-icon>
                  <span>Current Reading</span>
                </div>
                <div class="reading-input-container">
                  <mat-form-field appearance="outline" class="reading-field">
                    <input matInput type="number" formControlName="currentReading" placeholder="0" min="0">
                  </mat-form-field>
                  <span class="reading-unit-label">units</span>
                </div>
                <div class="reading-footer">
                  <mat-error *ngIf="form.get('currentReading')?.hasError('required') && form.get('currentReading')?.touched">
                    Required field
                  </mat-error>
                  <mat-error *ngIf="form.get('currentReading')?.hasError('min') && form.get('currentReading')?.touched">
                    Must be ≥ previous reading
                  </mat-error>
                  <span *ngIf="!form.get('currentReading')?.errors">Enter current meter value</span>
                </div>
              </div>
            </div>

            <!-- Consumption Result Card -->
            <div class="consumption-result" *ngIf="unitsConsumed !== null && unitsConsumed >= 0" 
                 [class.highlight]="unitsConsumed > 0">
              <div class="consumption-icon-wrap">
                <mat-icon>{{ unitsConsumed > 0 ? 'bolt' : 'horizontal_rule' }}</mat-icon>
              </div>
              <div class="consumption-content">
                <span class="consumption-label">{{ unitsConsumed > 0 ? 'Units Consumed' : 'No Consumption' }}</span>
                <span class="consumption-value">{{ unitsConsumed | number:'1.2-2' }}</span>
              </div>
              <div class="consumption-badge" *ngIf="unitsConsumed > 0">
                <mat-icon>check_circle</mat-icon>
                <span>Calculated</span>
              </div>
            </div>
          </div>

          <div class="section-divider">
            <div class="divider-line"></div>
          </div>

          <!-- Step 4: Reading Details -->
          <div class="form-section">
            <div class="section-header">
              <div class="step-indicator">
                <span class="step-number">4</span>
              </div>
              <div class="section-info">
                <h3>Reading Details</h3>
                <p>Date and additional notes for this reading</p>
              </div>
            </div>

            <div class="details-grid">
              <mat-form-field appearance="outline" class="date-field">
                <mat-label>Reading Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="readingDate">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-icon matPrefix class="field-icon">today</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="notes-field">
                <mat-label>Notes (Optional)</mat-label>
                <textarea matInput formControlName="notes" rows="3" 
                          placeholder="Add any relevant notes about this reading..."></textarea>
                <mat-icon matPrefix class="field-icon notes-icon">note_alt</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" routerLink="/meter-readings">
              <mat-icon>close</mat-icon>
              Cancel
            </button>
            <button type="submit" class="submit-btn" [disabled]="form.invalid || saving">
              <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
              <ng-container *ngIf="!saving">
                <mat-icon>{{ isEditMode ? 'save' : 'check_circle' }}</mat-icon>
                <span>{{ isEditMode ? 'Update Reading' : 'Save Reading' }}</span>
              </ng-container>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Premium Page Header */
    .page-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #fdfcfb 0%, #f5f0e8 100%);
      padding: 1.5rem 2rem;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(146, 115, 78, 0.1);
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .back-btn {
      width: 44px;
      height: 44px;
      border: 1px solid #e8e2d9;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        background: #f5f0e8;
        border-color: #92734e;
        transform: translateX(-2px);
      }

      mat-icon { color: #92734e; }
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      background: rgba(146, 115, 78, 0.12);
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      color: #92734e;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 0.5rem;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }

    .header-content {
      h1 {
        margin: 0;
        font-family: var(--font-serif);
        font-size: 1.75rem;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: -0.02em;
      }
      p {
        margin: 0.35rem 0 0;
        font-size: 0.9rem;
        color: #6b7280;
      }
    }

    .utility-indicator {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .utility-icon-wrap {
      width: 42px;
      height: 42px;
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

      &.electricity { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); }
      &.water { background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); }
      &.gas { background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
      &.default { background: linear-gradient(135deg, #92734e 0%, #7a6142 100%); }
    }

    .utility-info {
      display: flex;
      flex-direction: column;
    }

    .utility-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.95rem;
    }

    .utility-cycle {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Form Card */
    .form-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      border: 1px solid #f0ebe3;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;

      p {
        color: #6b7280;
        font-size: 0.9rem;
      }
    }

    /* Form Sections */
    .form-section {
      padding: 2rem;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .step-indicator {
      width: 36px;
      height: 36px;
      background: #f5f0e8;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .step-number {
        font-size: 0.875rem;
        font-weight: 700;
        color: #92734e;
      }

      &.highlight {
        background: linear-gradient(135deg, #92734e 0%, #7a6142 100%);
        box-shadow: 0 4px 12px rgba(146, 115, 78, 0.3);

        .step-number { color: white; }
      }
    }

    .section-info {
      h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
      }
      p {
        margin: 0.25rem 0 0;
        font-size: 0.8rem;
        color: #9ca3af;
      }
    }

    .section-divider {
      padding: 0 2rem;

      .divider-line {
        height: 1px;
        background: linear-gradient(90deg, transparent, #e8e2d9, transparent);
      }
    }

    .full-width { width: 100%; }

    .field-icon {
      color: #92734e !important;
      opacity: 0.7;
    }

    /* Selected Connection Card */
    .selected-connection-card {
      margin-top: 1rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      overflow: hidden;
    }

    .connection-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(22, 163, 74, 0.1);
      border-bottom: 1px solid rgba(22, 163, 74, 0.15);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #16a34a;
      }

      span {
        font-size: 0.8rem;
        font-weight: 600;
        color: #166534;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
    }

    .connection-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      padding: 1rem;
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .detail-icon {
      width: 32px;
      height: 32px;
      background: rgba(22, 163, 74, 0.15);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #16a34a;
      }
    }

    .detail-content {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 0.7rem;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #166534;
    }

    /* Billing Grid */
    .billing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Meter Readings Container */
    .readings-section {
      background: linear-gradient(180deg, #faf8f5 0%, white 100%);
    }

    .meter-readings-container {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1.5rem;
      align-items: center;
    }

    .reading-box {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }

    .previous-reading {
      border-color: #e8e2d9;

      .reading-header mat-icon { color: #9ca3af; }
    }

    .current-reading {
      border: 2px solid #92734e;
      box-shadow: 0 8px 24px rgba(146, 115, 78, 0.15);

      .reading-header mat-icon { color: #92734e; }
    }

    .reading-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      span {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .reading-display {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.5rem;
    }

    .reading-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1f2937;
      font-family: 'SF Mono', 'Monaco', monospace;
    }

    .reading-unit {
      font-size: 0.875rem;
      color: #9ca3af;
      font-weight: 500;
    }

    .reading-footer {
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: #9ca3af;

      mat-error {
        font-size: 0.75rem;
      }
    }

    .reading-input-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .reading-field {
      width: 140px;

      input {
        text-align: center;
        font-size: 1.75rem !important;
        font-weight: 700;
        font-family: 'SF Mono', 'Monaco', monospace;
      }
    }

    .reading-unit-label {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .reading-arrow-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .arrow-line {
      width: 2px;
      height: 20px;
      background: linear-gradient(180deg, #e5e7eb, #d1d5db);
      border-radius: 1px;
    }

    .arrow-icon {
      width: 40px;
      height: 40px;
      background: #f5f0e8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: #92734e;
        font-size: 20px;
      }
    }

    /* Consumption Result */
    .consumption-result {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      transition: all 0.3s ease;

      &.highlight {
        background: linear-gradient(135deg, #92734e 0%, #7a6142 100%);
        border: none;
        box-shadow: 0 8px 24px rgba(146, 115, 78, 0.25);

        .consumption-icon-wrap {
          background: rgba(255, 255, 255, 0.2);
          mat-icon { color: white; }
        }

        .consumption-label { color: rgba(255, 255, 255, 0.85); }
        .consumption-value { color: white; }
        .consumption-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
      }
    }

    .consumption-icon-wrap {
      width: 48px;
      height: 48px;
      background: #e5e7eb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: #6b7280;
      }
    }

    .consumption-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .consumption-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 0.2rem;
    }

    .consumption-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1f2937;
      font-family: 'SF Mono', 'Monaco', monospace;
    }

    .consumption-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      background: #dcfce7;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      color: #166534;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    /* Details Grid */
    .details-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .date-field {
      width: 100%;
      max-width: 280px;
    }

    .notes-field {
      width: 100%;
    }

    .notes-icon {
      align-self: flex-start;
      margin-top: 0.75rem;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: linear-gradient(180deg, #faf8f5 0%, #f5f0e8 100%);
      border-top: 1px solid #e8e2d9;
    }

    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      color: #6b7280;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #92734e 0%, #7a6142 100%);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(146, 115, 78, 0.3);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(146, 115, 78, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    @media (max-width: 768px) {
      .page-header-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-right {
        width: 100%;
      }

      .utility-indicator {
        width: 100%;
        justify-content: center;
      }

      .billing-grid,
      .meter-readings-container {
        grid-template-columns: 1fr;
      }

      .reading-arrow-container {
        flex-direction: row;
        transform: rotate(90deg);
      }

      .connection-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReadingEntryComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  loading = false;
  saving = false;
  readingId: number | null = null;

  connections: any[] = [];
  selectedConnection: any = null;
  selectedUtilityType: UtilityType | null = null;
  utilityTypes: UtilityType[] = [];
  billingPeriods: BillingPeriod[] = [];

  // Month names for labels
  private monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(
    private fb: FormBuilder,
    private meterReadingsService: MeterReadingsService,
    private connectionsService: ConnectionsService,
    private utilityTypesService: UtilityTypesService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.readingId = +id;
      this.loading = true;
      // Load dropdowns first, then load reading
      this.loadDropdownsAndReading();
    } else {
      this.loadDropdowns();
    }
  }

  initForm(): void {
    const now = new Date();
    this.form = this.fb.group({
      connectionId: [null, Validators.required],
      billingMonth: [now.getMonth() + 1, Validators.required],
      billingYear: [now.getFullYear(), Validators.required],
      previousReading: [{ value: 0, disabled: true }],
      currentReading: [null, [Validators.required, Validators.min(0)]],
      readingDate: [new Date(), Validators.required],
      notes: ['']
    });

    // Update min validator when previous reading changes
    this.form.get('previousReading')?.valueChanges.subscribe(prev => {
      this.form.get('currentReading')?.setValidators([
        Validators.required,
        Validators.min(prev || 0)
      ]);
      this.form.get('currentReading')?.updateValueAndValidity();
    });

    // Initialize with monthly billing periods (default)
    this.setBillingPeriods(1);
  }

  get unitsConsumed(): number | null {
    const prev = this.form.get('previousReading')?.value || 0;
    const curr = this.form.get('currentReading')?.value;
    if (curr !== null && curr !== undefined && curr >= prev) {
      return curr - prev;
    }
    return null;
  }

  loadDropdowns(): void {
    // Load connections
    this.connectionsService.getAll({ pageSize: 1000, pageNumber: 1 }).subscribe({
      next: (result) => {
        this.connections = result.data || [];
      }
    });

    // Load utility types for billing cycle info
    this.utilityTypesService.getAll().subscribe({
      next: (result) => {
        this.utilityTypes = result.data || [];
      }
    });
  }

  loadDropdownsAndReading(): void {
    // Load both connections and utility types first, then load reading
    forkJoin({
      connections: this.connectionsService.getAll({ pageSize: 1000, pageNumber: 1 }),
      utilityTypes: this.utilityTypesService.getAll()
    }).subscribe({
      next: (result) => {
        this.connections = result.connections.data || [];
        this.utilityTypes = result.utilityTypes.data || [];
        // Now load the reading
        this.loadReading();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
      }
    });
  }

  loadReading(): void {
    if (!this.readingId) return;
    this.loading = true;

    this.meterReadingsService.getById(this.readingId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          const reading = response.data;
          this.form.patchValue({
            connectionId: reading.connectionId,
            billingMonth: reading.billingMonth,
            billingYear: reading.billingYear,
            previousReading: reading.previousReading,
            currentReading: reading.currentReading,
            readingDate: new Date(reading.readingDate),
            notes: reading.notes || ''
          });
          // Trigger connection change to load utility type info
          this.onConnectionChange(reading.connectionId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error loading reading', 'Close', { duration: 3000 });
      }
    });
  }

  onConnectionChange(connectionId: number, skipPreviousReadingFetch: boolean = false): void {
    const conn = this.connections.find(c => c.id === connectionId);
    if (conn) {
      this.selectedConnection = conn;
      
      // Find utility type for this connection
      const utilityType = this.utilityTypes.find(u => u.id === conn.utilityTypeId);
      this.selectedUtilityType = utilityType || null;
      
      // Update billing periods based on utility's billing cycle
      if (utilityType) {
        this.setBillingPeriods(utilityType.billingCycleMonths);
        // Only set current period for new readings, not when editing
        if (!this.isEditMode) {
          const currentPeriod = this.getCurrentBillingPeriod(utilityType.billingCycleMonths);
          this.form.patchValue({ billingMonth: currentPeriod });
        }
      }

      // Only fetch last reading for NEW readings, not when editing
      // When editing, the previousReading is already loaded from the stored data
      if (!skipPreviousReadingFetch && !this.isEditMode) {
        this.meterReadingsService.getLastReading(connectionId).subscribe({
          next: (response) => {
            if (response.success && response.data !== null && response.data !== undefined) {
              // Backend returns decimal directly, not a MeterReading object
              this.form.patchValue({ previousReading: response.data });
            } else {
              this.form.patchValue({ previousReading: conn.initialMeterReading || 0 });
            }
          },
          error: () => {
            this.form.patchValue({ previousReading: conn.initialMeterReading || 0 });
          }
        });
      }
      
      this.cdr.detectChanges();
    }
  }

  setBillingPeriods(cycleMonths: number): void {
    this.billingPeriods = [];
    
    if (cycleMonths === 1) {
      // Monthly: Jan, Feb, Mar, etc.
      for (let i = 0; i < 12; i++) {
        this.billingPeriods.push({
          label: this.monthNames[i],
          month: i + 1
        });
      }
    } else if (cycleMonths === 2) {
      // Bi-Monthly: Jan-Feb, Mar-Apr, etc.
      for (let i = 0; i < 12; i += 2) {
        this.billingPeriods.push({
          label: `${this.monthNames[i]}-${this.monthNames[i + 1]}`,
          month: i + 1
        });
      }
    } else if (cycleMonths === 3) {
      // Quarterly: Q1, Q2, Q3, Q4
      const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
      for (let i = 0; i < 4; i++) {
        this.billingPeriods.push({
          label: quarters[i],
          month: i * 3 + 1
        });
      }
    }
  }

  getCurrentBillingPeriod(cycleMonths: number): number {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    if (cycleMonths === 1) {
      return currentMonth;
    } else if (cycleMonths === 2) {
      // Return the starting month of the bi-monthly period
      return currentMonth % 2 === 0 ? currentMonth - 1 : currentMonth;
    } else if (cycleMonths === 3) {
      // Return the starting month of the quarter
      return Math.floor((currentMonth - 1) / 3) * 3 + 1;
    }
    return currentMonth;
  }

  getBillingCycleLabel(months: number): string {
    switch (months) {
      case 1: return 'Monthly';
      case 2: return 'Bi-Monthly';
      case 3: return 'Quarterly';
      default: return `${months} Months`;
    }
  }

  getUtilityIcon(utilityType: string): string {
    const type = utilityType?.toLowerCase() || '';
    if (type.includes('electric')) return 'bolt';
    if (type.includes('water')) return 'water_drop';
    if (type.includes('gas')) return 'local_gas_station';
    return 'flash_on';
  }

  getUtilityColorClass(utilityType: string): string {
    const type = utilityType?.toLowerCase() || '';
    if (type.includes('electric')) return 'electricity';
    if (type.includes('water')) return 'water';
    if (type.includes('gas')) return 'gas';
    return 'default';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.getRawValue();
    
    // Format date as YYYY-MM-DD to avoid timezone issues
    const date = formValue.readingDate;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    const request: CreateMeterReadingRequest = {
      connectionId: formValue.connectionId,
      billingMonth: formValue.billingMonth,
      billingYear: formValue.billingYear,
      currentReading: formValue.currentReading,
      readingDate: formattedDate,
      notes: formValue.notes || undefined
    };

    const operation = this.isEditMode
      ? this.meterReadingsService.update(this.readingId!, {
          currentReading: request.currentReading,
          readingDate: request.readingDate,
          billingMonth: request.billingMonth,
          billingYear: request.billingYear,
          notes: request.notes
        })
      : this.meterReadingsService.create(request);

    operation.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open(
            `Reading ${this.isEditMode ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/meter-readings']);
        } else {
          this.snackBar.open(response.message || 'Error saving reading', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error saving reading', 'Close', { duration: 3000 });
      }
    });
  }
}
