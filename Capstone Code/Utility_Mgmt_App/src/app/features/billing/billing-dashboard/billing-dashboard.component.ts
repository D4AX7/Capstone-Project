import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { ConnectionsService } from '../../../core/services/connections.service';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { BillsService } from '../../../core/services/bills.service';
import { UtilityType, ConnectionListItem, CreateMeterReadingRequest, GenerateBillRequest, MeterReading } from '../../../core/models';
import { forkJoin } from 'rxjs';

// Extended ConnectionListItem with lastReading info
interface ConnectionWithReading extends ConnectionListItem {
  lastReading?: number;
}

interface UtilityWithConnections extends UtilityType {
  connections: ConnectionWithReading[];
  loadingConnections: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Billing Dashboard</h1>
          <p>Manage meter readings and generate bills by utility type</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading utilities...</p>
      </div>

      <div *ngIf="!loading" class="utilities-container">
        <mat-accordion multi>
          <mat-expansion-panel *ngFor="let utility of utilities" 
                               (opened)="loadConnections(utility)"
                               [expanded]="utility.expanded">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="utility-icon">{{ getIcon(utility.name) }}</mat-icon>
                <span class="utility-name">{{ utility.name }}</span>
              </mat-panel-title>
              <mat-panel-description>
                <mat-chip-set>
                  <mat-chip class="cycle-chip">
                    {{ getBillingCycleLabel(utility.billingCycleMonths) }}
                  </mat-chip>
                  <mat-chip class="connections-chip" [matBadge]="utility.connectionCount" matBadgeColor="primary">
                    Connections
                  </mat-chip>
                </mat-chip-set>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <!-- Loading state for connections -->
              <div *ngIf="utility.loadingConnections" class="loading-connections">
                <mat-spinner diameter="30"></mat-spinner>
                <span>Loading connections...</span>
              </div>

              <!-- No connections -->
              <div *ngIf="!utility.loadingConnections && utility.connections.length === 0" class="no-connections">
                <mat-icon>info</mat-icon>
                <p>No active connections for this utility type.</p>
              </div>

              <!-- Connections table -->
              <div *ngIf="!utility.loadingConnections && utility.connections.length > 0" class="connections-section">
                <table mat-table [dataSource]="utility.connections" class="connections-table">
                  
                  <ng-container matColumnDef="connectionNumber">
                    <th mat-header-cell *matHeaderCellDef>Connection No.</th>
                    <td mat-cell *matCellDef="let conn">{{ conn.connectionNumber }}</td>
                  </ng-container>

                  <ng-container matColumnDef="consumer">
                    <th mat-header-cell *matHeaderCellDef>Consumer</th>
                    <td mat-cell *matCellDef="let conn">{{ conn.consumerName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="meterNumber">
                    <th mat-header-cell *matHeaderCellDef>Meter No.</th>
                    <td mat-cell *matCellDef="let conn">{{ conn.meterNumber }}</td>
                  </ng-container>

                  <ng-container matColumnDef="tariff">
                    <th mat-header-cell *matHeaderCellDef>Tariff Plan</th>
                    <td mat-cell *matCellDef="let conn">{{ conn.tariffPlanName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastReading">
                    <th mat-header-cell *matHeaderCellDef>Last Reading</th>
                    <td mat-cell *matCellDef="let conn">
                      <span *ngIf="conn.lastReading">{{ conn.lastReading | number:'1.2-2' }}</span>
                      <span *ngIf="!conn.lastReading" class="no-reading">No reading</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let conn">
                      <button mat-icon-button color="primary" 
                              matTooltip="Record Meter Reading"
                              (click)="openReadingDialog(conn, utility)">
                        <mat-icon>speed</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" 
                              matTooltip="Generate Bill"
                              (click)="openBillDialog(conn, utility)">
                        <mat-icon>receipt</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>

        <div *ngIf="utilities.length === 0" class="no-utilities">
          <mat-icon>warning</mat-icon>
          <p>No active utility types available.</p>
        </div>
      </div>

      <!-- Meter Reading Dialog -->
      <div *ngIf="showReadingDialog" class="dialog-overlay" (click)="closeDialogs()">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>Record Meter Reading</mat-card-title>
            <mat-card-subtitle>{{ selectedConnection?.connectionNumber }} - {{ selectedConnection?.consumerName }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="readingForm">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Previous Reading</mat-label>
                  <input matInput type="number" formControlName="previousReading" readonly>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Current Reading</mat-label>
                  <input matInput type="number" formControlName="currentReading" required>
                  <mat-error *ngIf="readingForm.get('currentReading')?.hasError('required')">Required</mat-error>
                  <mat-error *ngIf="readingForm.get('currentReading')?.hasError('min')">Must be greater than previous reading</mat-error>
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Billing Month</mat-label>
                  <mat-select formControlName="billingMonth" required>
                    <mat-option *ngFor="let month of months" [value]="month.value">{{ month.label }}</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Billing Year</mat-label>
                  <mat-select formControlName="billingYear" required>
                    <mat-option *ngFor="let year of years" [value]="year">{{ year }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Reading Date</mat-label>
                <input matInput type="date" formControlName="readingDate" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notes (Optional)</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="closeDialogs()">Cancel</button>
            <button mat-raised-button color="primary" 
                    (click)="submitReading()" 
                    [disabled]="readingForm.invalid || submittingReading">
              <mat-spinner *ngIf="submittingReading" diameter="20"></mat-spinner>
              <span *ngIf="!submittingReading">Save Reading</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Generate Bill Dialog -->
      <div *ngIf="showBillDialog" class="dialog-overlay" (click)="closeDialogs()">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>Generate Bill</mat-card-title>
            <mat-card-subtitle>{{ selectedConnection?.connectionNumber }} - {{ selectedConnection?.consumerName }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loadingUnbilledReadings" class="loading-connections">
              <mat-spinner diameter="30"></mat-spinner>
              <span>Loading unbilled readings...</span>
            </div>

            <div *ngIf="!loadingUnbilledReadings && unbilledReadings.length === 0" class="no-readings-msg">
              <mat-icon>info</mat-icon>
              <p>No unbilled meter readings for this connection.</p>
              <p>Record a meter reading first.</p>
            </div>

            <form *ngIf="!loadingUnbilledReadings && unbilledReadings.length > 0" [formGroup]="billForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Unbilled Reading</mat-label>
                <mat-select formControlName="meterReadingId" required>
                  <mat-option *ngFor="let reading of unbilledReadings" [value]="reading.id">
                    {{ reading.billingMonth }}/{{ reading.billingYear }} - {{ reading.unitsConsumed | number:'1.2-2' }} units
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </form>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="closeDialogs()">Cancel</button>
            <button mat-raised-button color="primary" 
                    (click)="submitBill()" 
                    [disabled]="billForm.invalid || generatingBill || unbilledReadings.length === 0">
              <mat-spinner *ngIf="generatingBill" diameter="20"></mat-spinner>
              <span *ngIf="!generatingBill">Generate Bill</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;

      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: #64748b;
    }

    .utility-icon { margin-right: 0.5rem; color: #3b82f6; }
    .utility-name { font-weight: 500; }

    .cycle-chip { 
      font-size: 0.75rem !important;
      background-color: #e0f2fe !important;
      color: #0369a1 !important;
    }

    .connections-chip {
      font-size: 0.75rem !important;
    }

    .panel-content {
      padding: 1rem 0;
    }

    .loading-connections, .no-connections {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: #64748b;
    }

    .connections-table {
      width: 100%;
    }

    .no-reading {
      color: #94a3b8;
      font-style: italic;
    }

    .no-utilities {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #64748b;

      mat-icon { font-size: 3rem; height: 3rem; width: 3rem; margin-bottom: 1rem; }
    }

    /* Dialog Styles */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-card {
      width: 500px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
    }

    .form-row {
      display: flex;
      gap: 1rem;

      mat-form-field { flex: 1; }
    }

    .full-width { width: 100%; }

    .no-readings-msg {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      color: #64748b;
      text-align: center;

      mat-icon { font-size: 2rem; height: 2rem; width: 2rem; margin-bottom: 0.5rem; }
      p { margin: 0.25rem 0; }
    }

    mat-expansion-panel {
      margin-bottom: 0.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillingDashboardComponent implements OnInit {
  utilities: UtilityWithConnections[] = [];
  loading = true;
  displayedColumns = ['connectionNumber', 'consumer', 'meterNumber', 'tariff', 'lastReading', 'actions'];

  // Reading dialog
  showReadingDialog = false;
  selectedConnection: ConnectionWithReading | null = null;
  selectedUtility: UtilityWithConnections | null = null;
  readingForm: FormGroup;
  submittingReading = false;
  previousReading = 0;

  // Bill dialog
  showBillDialog = false;
  billForm: FormGroup;
  unbilledReadings: MeterReading[] = [];
  loadingUnbilledReadings = false;
  generatingBill = false;

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  years: number[] = [];

  constructor(
    private utilityTypesService: UtilityTypesService,
    private connectionsService: ConnectionsService,
    private meterReadingsService: MeterReadingsService,
    private billsService: BillsService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear, currentYear + 1];

    this.readingForm = this.fb.group({
      previousReading: [{ value: 0, disabled: true }],
      currentReading: [null, [Validators.required]],
      billingMonth: [new Date().getMonth() + 1, Validators.required],
      billingYear: [currentYear, Validators.required],
      readingDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });

    this.billForm = this.fb.group({
      meterReadingId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUtilities();
  }

  loadUtilities(): void {
    this.loading = true;
    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        this.utilities = (response.data || [])
          .filter(u => u.isActive)
          .map(u => ({
            ...u,
            connections: [],
            loadingConnections: false,
            expanded: false
          }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load utilities', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  loadConnections(utility: UtilityWithConnections): void {
    if (utility.connections.length > 0) return; // Already loaded

    utility.loadingConnections = true;
    utility.expanded = true;
    this.cdr.markForCheck();

    this.connectionsService.getAll({ pageNumber: 1, pageSize: 1000 }, utility.id, 'Active').subscribe({
      next: (response) => {
        utility.connections = (response.data || []).map(c => ({ ...c, lastReading: undefined }));
        utility.loadingConnections = false;
        this.cdr.markForCheck();
      },
      error: () => {
        utility.loadingConnections = false;
        this.snackBar.open('Failed to load connections', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  getIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('electric')) return 'bolt';
    if (lower.includes('water')) return 'water_drop';
    if (lower.includes('gas')) return 'local_fire_department';
    if (lower.includes('internet')) return 'wifi';
    return 'settings';
  }

  getBillingCycleLabel(months: number): string {
    switch (months) {
      case 1: return 'Monthly';
      case 2: return 'Bi-Monthly';
      case 3: return 'Quarterly';
      default: return `${months} Months`;
    }
  }

  openReadingDialog(conn: ConnectionWithReading, utility: UtilityWithConnections): void {
    this.selectedConnection = conn;
    this.selectedUtility = utility;
    this.previousReading = conn.lastReading || 0;
    
    // Load the last reading for this connection
    this.meterReadingsService.getLastReading(conn.id).subscribe({
      next: (response) => {
        if (response.success && response.data !== null && response.data !== undefined) {
          // Backend returns decimal directly, not a MeterReading object
          this.previousReading = response.data;
          conn.lastReading = response.data;
        }
        this.readingForm.patchValue({
          previousReading: this.previousReading,
          currentReading: null,
          readingDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        this.readingForm.get('currentReading')?.setValidators([
          Validators.required,
          Validators.min(this.previousReading + 0.01)
        ]);
        this.readingForm.get('currentReading')?.updateValueAndValidity();
        this.cdr.markForCheck();
      },
      error: () => {
        this.readingForm.patchValue({
          previousReading: 0,
          currentReading: null,
          readingDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        this.readingForm.get('currentReading')?.setValidators([Validators.required]);
        this.readingForm.get('currentReading')?.updateValueAndValidity();
        this.cdr.markForCheck();
      }
    });
    
    this.showReadingDialog = true;
    this.cdr.markForCheck();
  }

  openBillDialog(conn: ConnectionWithReading, utility: UtilityWithConnections): void {
    this.selectedConnection = conn;
    this.selectedUtility = utility;
    this.showBillDialog = true;
    this.loadingUnbilledReadings = true;
    this.unbilledReadings = [];
    this.billForm.reset();
    this.cdr.markForCheck();

    this.meterReadingsService.getByConnection(conn.id).subscribe({
      next: (response) => {
        this.unbilledReadings = (response.data || []).filter(r => !r.isBilled);
        this.loadingUnbilledReadings = false;
        if (this.unbilledReadings.length > 0) {
          this.billForm.patchValue({ meterReadingId: this.unbilledReadings[0].id });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingUnbilledReadings = false;
        this.snackBar.open('Failed to load readings', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  closeDialogs(): void {
    this.showReadingDialog = false;
    this.showBillDialog = false;
    this.selectedConnection = null;
    this.selectedUtility = null;
    this.cdr.markForCheck();
  }

  submitReading(): void {
    if (!this.readingForm.valid || !this.selectedConnection) return;

    this.submittingReading = true;
    const values = this.readingForm.getRawValue();
    
    const request: CreateMeterReadingRequest = {
      connectionId: this.selectedConnection.id,
      currentReading: values.currentReading,
      readingDate: values.readingDate,
      billingMonth: values.billingMonth,
      billingYear: values.billingYear,
      notes: values.notes || undefined
    };

    this.meterReadingsService.create(request).subscribe({
      next: (response) => {
        this.submittingReading = false;
        if (response.success) {
          this.snackBar.open('Meter reading recorded successfully', 'Close', { duration: 3000 });
          // Update the connection's last reading
          if (this.selectedConnection && this.selectedUtility) {
            const conn = this.selectedUtility.connections.find(c => c.id === this.selectedConnection!.id);
            if (conn) {
              conn.lastReading = values.currentReading;
            }
          }
          this.closeDialogs();
        } else {
          this.snackBar.open(response.message || 'Failed to record reading', 'Close', { duration: 3000 });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submittingReading = false;
        this.snackBar.open(err.error?.message || 'Failed to record reading', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }

  submitBill(): void {
    if (!this.billForm.valid) return;

    this.generatingBill = true;
    const request: GenerateBillRequest = {
      meterReadingId: this.billForm.value.meterReadingId
    };

    this.billsService.generate(request).subscribe({
      next: (response) => {
        this.generatingBill = false;
        if (response.success) {
          this.snackBar.open('Bill generated successfully', 'Close', { duration: 3000 });
          this.closeDialogs();
        } else {
          this.snackBar.open(response.message || 'Failed to generate bill', 'Close', { duration: 3000 });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.generatingBill = false;
        this.snackBar.open(err.error?.message || 'Failed to generate bill', 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      }
    });
  }
}
