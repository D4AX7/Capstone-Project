import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { BillsService } from '../../../core/services/bills.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill } from '../../../core/models';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/billing">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>Bill #{{ bill?.billNumber }}</h1>
          <p>View bill details</p>
        </div>
        <div class="header-actions" *ngIf="bill">
          <button mat-stroked-button [routerLink]="['/payments/new']" [queryParams]="{billId: bill.id}" 
                  *ngIf="canRecordPayment && bill.status !== 'Paid'">
            <mat-icon>payment</mat-icon>
            Record Payment
          </button>
          <button mat-raised-button color="accent" [routerLink]="['/payments/new']" [queryParams]="{billId: bill.id}" 
                  *ngIf="isConsumer && bill.status !== 'Paid'">
            <mat-icon>payment</mat-icon>
            Pay Now
          </button>
          <button mat-raised-button color="primary" (click)="printBill()">
            <mat-icon>print</mat-icon>
            Print
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading bill details...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error }}</p>
        <button mat-stroked-button routerLink="/billing">Back to Bills</button>
      </div>

      <div class="detail-grid" *ngIf="!loading && !error && bill">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Bill Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Bill Number</span>
                <span class="value">{{ bill.billNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Bill Date</span>
                <span class="value">{{ bill.billDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Due Date</span>
                <span class="value" [class.overdue]="isOverdue()">{{ bill.dueDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Billing Period</span>
                <span class="value">{{ bill.billingMonth }}/{{ bill.billingYear }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status</span>
                <mat-chip [ngClass]="getStatusClass(bill.status)">{{ bill.status }}</mat-chip>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-title>Consumer & Connection</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Consumer</span>
                <span class="link">{{ bill.consumerName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Connection</span>
                <a [routerLink]="['/connections', bill.connectionId]" class="link">{{ bill.connectionNumber }}</a>
              </div>
              <div class="info-item">
                <span class="label">Utility Type</span>
                <span class="value">{{ bill.utilityType }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tariff Plan</span>
                <span class="value">{{ bill.tariffPlan }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card consumption-card">
          <mat-card-header>
            <mat-card-title>Consumption Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="consumption-summary">
              <div class="meter-readings">
                <div class="reading-box">
                  <span class="label">Previous Reading</span>
                  <span class="value">{{ bill.previousReading | number:'1.2-2' }}</span>
                </div>
                <mat-icon class="arrow">arrow_forward</mat-icon>
                <div class="reading-box">
                  <span class="label">Current Reading</span>
                  <span class="value">{{ bill.currentReading | number:'1.2-2' }}</span>
                </div>
              </div>
              <div class="units-consumed">
                <span class="label">Units Consumed</span>
                <span class="value">{{ bill.unitsConsumed | number:'1.2-2' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="info-card amount-card">
          <mat-card-header>
            <mat-card-title>Amount Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="amount-breakdown">
              <div class="amount-row">
                <span>Energy Charges ({{ bill.unitsConsumed | number:'1.2-2' }} × ₹{{ bill.ratePerUnit | number:'1.2-4' }})</span>
                <span>₹{{ bill.energyCharges | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row" *ngIf="bill.fixedCharges">
                <span>Fixed Charges</span>
                <span>₹{{ bill.fixedCharges | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row" *ngIf="bill.taxAmount">
                <span>Tax</span>
                <span>₹{{ bill.taxAmount | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row" *ngIf="bill.penaltyAmount">
                <span>Late Fee</span>
                <span class="late-fee">₹{{ bill.penaltyAmount | number:'1.2-2' }}</span>
              </div>
              <mat-divider></mat-divider>
              <div class="amount-row total">
                <span>Total Amount</span>
                <span>₹{{ bill.totalAmount | number:'1.2-2' }}</span>
              </div>
              <div class="amount-row paid">
                <span>Amount Paid</span>
                <span>₹{{ bill.amountPaid | number:'1.2-2' }}</span>
              </div>
              <mat-divider></mat-divider>
              <div class="amount-row due">
                <span>Amount Due</span>
                <span>₹{{ bill.outstandingBalance | number:'1.2-2' }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1.5rem;

      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.25rem 0 0; color: #64748b; }
      .header-content { flex: 1; }
      .header-actions { display: flex; gap: 0.5rem; }
    }

    .loading { 
      display: flex; 
      flex-direction: column;
      align-items: center;
      justify-content: center; 
      padding: 3rem; 
      gap: 1rem;
      p { color: #64748b; margin: 0; }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      text-align: center;
      mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #dc2626; }
      p { color: #64748b; margin: 0; font-size: 1rem; }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-card { 
      mat-card-title { font-size: 1rem; font-weight: 600; }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      .label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }
      .value { font-weight: 500; color: #1e293b; }
    }

    .link { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .overdue { color: #dc2626; }

    .consumption-card { grid-column: span 2; }
    .consumption-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .meter-readings {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .reading-box {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      min-width: 120px;

      .label { display: block; font-size: 0.75rem; color: #64748b; }
      .value { font-size: 1.5rem; font-weight: 600; color: #1e293b; }
    }

    .arrow { color: #64748b; }

    .units-consumed {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-align: center;

      .label { display: block; font-size: 0.875rem; opacity: 0.9; }
      .value { font-size: 2rem; font-weight: 700; }
    }

    .amount-card { grid-column: span 2; }
    .amount-breakdown {
      max-width: 400px;
      margin-left: auto;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;

      &.total { font-weight: 600; font-size: 1.125rem; }
      &.paid span:last-child { color: #16a34a; }
      &.due { font-weight: 700; font-size: 1.25rem; color: #dc2626; }
      .late-fee { color: #dc2626; }
    }

    mat-divider { margin: 0.5rem 0; }

    mat-chip {
      font-size: 0.75rem;
      &.status-paid { background-color: #dcfce7 !important; color: #166534 !important; }
      &.status-due { background-color: #fef9c3 !important; color: #854d0e !important; }
      &.status-overdue { background-color: #fee2e2 !important; color: #dc2626 !important; }
    }

    .payment-table { width: 100%; }
  `]
})
export class BillDetailComponent implements OnInit {
  bill: Bill | null = null;
  loading = false;
  error: string | null = null;
  paymentColumns = ['paymentDate', 'amount', 'method', 'paymentNumber'];
  canRecordPayment = false;
  isConsumer = false;

  constructor(
    private route: ActivatedRoute,
    private billsService: BillsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // BillingOfficer can only generate bills, not record payments
    // AccountOfficer is view-only - only Admin can record payments
    this.canRecordPayment = this.authService.hasRole(['Admin']);
    this.isConsumer = this.authService.hasRole(['Consumer']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBill(+id);
    }
  }

  loadBill(id: number): void {
    this.loading = true;
    this.error = null;
    console.log('Loading bill with id:', id);
    
    // Use different endpoint based on user role
    const request$ = this.isConsumer 
      ? this.billsService.getMyBillById(id)
      : this.billsService.getById(id);

    request$.subscribe({
      next: (response) => {
        console.log('Bill response:', response);
        this.loading = false;
        if (response.success && response.data) {
          this.bill = response.data;
          console.log('Bill set:', this.bill);
        } else {
          this.error = response.message || 'Failed to load bill';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading bill:', err);
        this.loading = false;
        this.error = err.error?.message || 'Failed to load bill. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  isOverdue(): boolean {
    if (!this.bill) return false;
    return new Date(this.bill.dueDate) < new Date() && this.bill.status !== 'Paid';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Due': return 'status-due';
      case 'Overdue': return 'status-overdue';
      default: return '';
    }
  }

  printBill(): void {
    window.print();
  }
}
