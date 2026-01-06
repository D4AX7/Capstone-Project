import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { BillsService } from '../../../core/services/bills.service';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { BillingCyclesService } from '../../../core/services/billing-cycles.service';
import { BillingCycle, MeterReadingListItem, GenerateBillRequest, GenerateBulkBillsRequest } from '../../../core/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-generate-bill',
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
    MatRadioModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatBadgeModule
  ],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header-card">
        <div class="header-left">
          <button class="back-btn" routerLink="/billing">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-content">
            <h1>Generate Bills</h1>
            <p>Create utility bills from meter readings</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-badge">
            <mat-icon>receipt_long</mat-icon>
            <span class="stat-value">{{ unbilledReadings.length }}</span>
            <span class="stat-label">UNBILLED</span>
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="content-card">
        <!-- Tabs -->
        <div class="tabs-header">
          <button class="tab-btn" [class.active]="activeTab === 'single'" (click)="activeTab = 'single'">
            <mat-icon>description</mat-icon>
            Single Bill
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'bulk'" (click)="activeTab = 'bulk'">
            <mat-icon>dynamic_feed</mat-icon>
            Bulk Generate
          </button>
        </div>

        <!-- Single Bill Tab Content -->
        <div class="tab-content" *ngIf="activeTab === 'single'">
          <div class="tab-description">
            <div class="desc-icon">
              <mat-icon>description</mat-icon>
            </div>
            <div class="desc-content">
              <h3>Generate Single Bill</h3>
              <p>Select an unbilled meter reading to create a bill with full preview</p>
            </div>
          </div>

          <!-- If there are unbilled readings -->
          <div *ngIf="unbilledReadings.length > 0" class="readings-section">
            <form [formGroup]="singleForm" (ngSubmit)="generateSingle()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Unbilled Reading</mat-label>
                <mat-select formControlName="meterReadingId">
                  <mat-option *ngFor="let reading of unbilledReadings" [value]="reading.id">
                    {{ reading.connectionNumber }} - {{ reading.consumerName }} 
                    [{{ reading.utilityTypeName }}] 
                    ({{ getMonthName(reading.billingMonth) }} {{ reading.billingYear }}: {{ reading.unitsConsumed | number:'1.2-2' }} units)
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="singleForm.get('meterReadingId')?.hasError('required')">
                  Please select a meter reading
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="singleForm.invalid || generatingSingle">
                  <mat-spinner *ngIf="generatingSingle" diameter="20"></mat-spinner>
                  <span *ngIf="!generatingSingle">GENERATE BILL</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Empty State -->
          <div *ngIf="unbilledReadings.length === 0" class="empty-state">
            <div class="empty-icon">
              <mat-icon>inbox</mat-icon>
            </div>
            <h3>No Unbilled Readings</h3>
            <p>Record meter readings first to generate bills</p>
            <button class="add-reading-btn" routerLink="/meter-readings/new">
              <mat-icon>add</mat-icon>
              ADD METER READING
            </button>
          </div>
        </div>

        <!-- Bulk Generate Tab Content -->
        <div class="tab-content" *ngIf="activeTab === 'bulk'">
          <div class="tab-description">
            <div class="desc-icon">
              <mat-icon>dynamic_feed</mat-icon>
            </div>
            <div class="desc-content">
              <h3>Bulk Generate Bills</h3>
              <p>Generate bills for all unbilled readings in a billing cycle</p>
            </div>
          </div>

          <div class="bulk-section">
            <form [formGroup]="bulkForm" (ngSubmit)="generateBulk()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Billing Cycle</mat-label>
                <mat-select formControlName="billingCycleId">
                  <mat-option *ngFor="let cycle of billingCycles" [value]="cycle.id">
                    {{ cycle.name }} - {{ cycle.month }}/{{ cycle.year }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="bulkForm.get('billingCycleId')?.hasError('required')">
                  Please select a billing cycle
                </mat-error>
              </mat-form-field>

              <div class="info-box">
                <mat-icon>info</mat-icon>
                <p>This will generate bills for all unbilled meter readings in the selected billing cycle.</p>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" 
                        [disabled]="bulkForm.invalid || generatingBulk">
                  <mat-spinner *ngIf="generatingBulk" diameter="20"></mat-spinner>
                  <span *ngIf="!generatingBulk">GENERATE ALL BILLS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Result Card -->
      <div class="result-card" *ngIf="generationResult" [class.success]="generationResult.success" [class.error]="!generationResult.success">
        <mat-icon>{{ generationResult.success ? 'check_circle' : 'error' }}</mat-icon>
        <div class="result-content">
          <h3>{{ generationResult.title }}</h3>
          <p>{{ generationResult.message }}</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/billing" *ngIf="generationResult.success">
          View Bills
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Page Header Card */
    .page-header-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 1.25rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      mat-icon {
        color: #6b7280;
      }
    }

    .header-content {
      h1 {
        margin: 0;
        font-family: var(--font-serif);
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
      }
      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #6b7280;
      }
    }

    .header-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #faf8f5;
      border: 1px solid #e8e2d9;
      border-radius: 8px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #92734e;
      }

      .stat-value {
        font-weight: 600;
        color: #5c4a2a;
      }

      .stat-label {
        font-size: 0.7rem;
        color: #92734e;
        letter-spacing: 0.05em;
      }
    }

    /* Content Card */
    .content-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    /* Tabs Header */
    .tabs-header {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s;

      &:hover {
        color: #374151;
        background: #f9fafb;
      }

      &.active {
        color: #5c4a2a;
        border-bottom-color: #92734e;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .tab-badge {
      background: #92734e;
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      margin-left: 0.25rem;
    }

    /* Tab Content */
    .tab-content {
      padding: 1.5rem;
    }

    .tab-description {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #faf8f5;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border: 1px solid #f0ebe3;
    }

    .desc-icon {
      width: 40px;
      height: 40px;
      background: #f0ebe3;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: #92734e;
      }
    }

    .desc-content {
      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
      }
      p {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: #6b7280;
      }
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: #f5f0e8;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #92734e;
      }
    }

    .empty-state h3 {
      margin: 0;
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .empty-state p {
      margin: 0.5rem 0 1.5rem;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .add-reading-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #92734e;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #7a6142;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    /* Form Styles */
    .readings-section,
    .bulk-section {
      padding: 1rem 0;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #eff6ff;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;

      mat-icon { color: #3b82f6; flex-shrink: 0; }
      p { margin: 0; color: #1e40af; font-size: 0.875rem; }
    }

    /* Result Card */
    .result-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-top: 1.5rem;

      &.success {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;

        mat-icon { color: #16a34a; }
        h3 { color: #166534; }
        p { color: #15803d; }
      }

      &.error {
        background: #fef2f2;
        border: 1px solid #fecaca;

        mat-icon { color: #dc2626; }
        h3 { color: #991b1b; }
        p { color: #b91c1c; }
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .result-content {
        flex: 1;

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }
        p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
        }
      }
    }
  `]
})
export class GenerateBillComponent implements OnInit {
  singleForm!: FormGroup;
  bulkForm!: FormGroup;
  
  unbilledReadings: MeterReadingListItem[] = [];
  billingCycles: BillingCycle[] = [];
  
  generatingSingle = false;
  generatingBulk = false;
  activeTab: 'single' | 'bulk' = 'single';
  
  generationResult: { success: boolean; title: string; message: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private meterReadingsService: MeterReadingsService,
    private billingCyclesService: BillingCyclesService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  initForms(): void {
    // Default due date: 14 days from today
    this.singleForm = this.fb.group({
      meterReadingId: [null, Validators.required]
    });

    this.bulkForm = this.fb.group({
      billingCycleId: [null, Validators.required]
    });
  }

  loadData(): void {
    // Fetch ALL unbilled readings (no month/year filter)
    forkJoin({
      readings: this.meterReadingsService.getUnbilled(),
      cycles: this.billingCyclesService.getAll({ pageSize: 100, pageNumber: 1 })
    }).subscribe({
      next: (result) => {
        console.log('Unbilled readings response:', result.readings);
        this.unbilledReadings = result.readings.data || [];
        this.billingCycles = result.cycles.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading data:', err);
      }
    });
  }

  getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  getUniqueCycleTypesCount(): number {
    // Extract cycle type from name (e.g., "January 2026 Monthly" -> "Monthly")
    const cycleTypes = this.billingCycles.map(c => {
      const name = c.name.toLowerCase();
      if (name.includes('quarterly')) return 'Quarterly';
      if (name.includes('bi-monthly') || name.includes('bimonthly')) return 'Bi-Monthly';
      if (name.includes('monthly')) return 'Monthly';
      return c.name;
    });
    const uniqueTypes = new Set(cycleTypes);
    return uniqueTypes.size;
  }

  generateSingle(): void {
    if (this.singleForm.invalid) return;

    this.generatingSingle = true;
    this.generationResult = null;

    const selectedReadingId = this.singleForm.value.meterReadingId;

    // First fetch the full reading details to get connectionId
    this.meterReadingsService.getById(selectedReadingId).subscribe({
      next: (readingResponse) => {
        if (!readingResponse.success || !readingResponse.data) {
          this.generationResult = {
            success: false,
            title: 'Error',
            message: 'Failed to fetch reading details'
          };
          this.generatingSingle = false;
          this.cdr.detectChanges();
          return;
        }

        const reading = readingResponse.data;
        const request: GenerateBillRequest = {
          meterReadingId: selectedReadingId,
          connectionId: reading.connectionId,
          billingMonth: reading.billingMonth,
          billingYear: reading.billingYear
        };

        console.log('Generating bill with request:', request);

        this.billsService.generate(request).subscribe({
          next: (response) => {
            this.generatingSingle = false;
            if (response.success) {
              this.generationResult = {
                success: true,
                title: 'Bill Generated Successfully',
                message: `Bill #${response.data?.billNumber} has been generated with amount ₹${response.data?.totalAmount?.toFixed(2)}`
              };
              this.loadData(); // Refresh unbilled readings
            } else {
              this.generationResult = {
                success: false,
                title: 'Generation Failed',
                message: response.message || 'Failed to generate bill'
              };
            }
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.generatingSingle = false;
            console.error('Bill generation error:', err);
            console.error('Error response:', err.error);
            this.generationResult = {
              success: false,
              title: 'Error',
              message: err.error?.message || err.error?.errors?.join(', ') || JSON.stringify(err.error) || 'An error occurred'
            };
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.generatingSingle = false;
        console.error('Error fetching reading:', err);
        this.generationResult = {
          success: false,
          title: 'Error',
          message: 'Failed to fetch reading details'
        };
        this.cdr.detectChanges();
      }
    });
  }

  generateBulk(): void {
    if (this.bulkForm.invalid) return;

    this.generatingBulk = true;
    this.generationResult = null;

    const request: GenerateBulkBillsRequest = {
      billingCycleId: this.bulkForm.value.billingCycleId
    };

    this.billsService.generateBulk(request).subscribe({
      next: (response) => {
        this.generatingBulk = false;
        if (response.success) {
          const count = response.data?.length || 0;
          this.generationResult = {
            success: true,
            title: 'Bills Generated Successfully',
            message: `${count} bill(s) have been generated for the selected billing cycle.`
          };
          this.loadData();
        } else {
          this.generationResult = {
            success: false,
            title: 'Generation Failed',
            message: response.message || 'Failed to generate bills'
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.generatingBulk = false;
        this.generationResult = {
          success: false,
          title: 'Error',
          message: err.error?.message || 'An error occurred'
        };
        this.cdr.detectChanges();
      }
    });
  }
}
