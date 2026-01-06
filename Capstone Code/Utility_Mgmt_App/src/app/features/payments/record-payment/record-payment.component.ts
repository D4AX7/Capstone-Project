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
import { PaymentsService } from '../../../core/services/payments.service';
import { BillsService } from '../../../core/services/bills.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill, CreatePaymentRequest } from '../../../core/models';

@Component({
  selector: 'app-record-payment',
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
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/payments">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>{{ isConsumer ? 'Make Payment' : 'Record Payment' }}</h1>
          <p>{{ isConsumer ? 'Pay your utility bill' : 'Record a new payment for a bill' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()">
            <div *ngIf="selectedBill" class="bill-info">
              <div class="bill-header">
                <mat-icon>receipt</mat-icon>
                <div>
                  <h3>Bill #{{ selectedBill.billNumber }}</h3>
                  <p>{{ selectedBill.consumerName }} - {{ selectedBill.connectionNumber }}</p>
                </div>
              </div>
              <div class="bill-amounts">
                <div class="amount-item">
                  <span class="label">Total Amount</span>
                  <span class="value">₹{{ selectedBill.totalAmount | number:'1.2-2' }}</span>
                </div>
                <div class="amount-item">
                  <span class="label">Already Paid</span>
                  <span class="value paid">₹{{ selectedBill.amountPaid | number:'1.2-2' }}</span>
                </div>
                <div class="amount-item">
                  <span class="label">Due Amount</span>
                  <span class="value due">₹{{ selectedBill.outstandingBalance | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <div class="form-row" *ngIf="!billIdFromRoute">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Bill</mat-label>
                <mat-select formControlName="billId" (selectionChange)="onBillSelect($event.value)">
                  <mat-option *ngFor="let bill of unpaidBills" [value]="bill.id">
                    {{ bill.billNumber }} - {{ bill.consumerName }} (Due: ₹{{ bill.outstandingBalance | number:'1.2-2' }})
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('billId')?.hasError('required')">
                  Bill is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row two-col">
              <mat-form-field appearance="outline">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" step="0.01">
                <span matPrefix>₹&nbsp;</span>
                <mat-error *ngIf="form.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="form.get('amount')?.hasError('min')">
                  Amount must be greater than 0
                </mat-error>
                <mat-error *ngIf="form.get('amount')?.hasError('max')">
                  Amount cannot exceed due amount
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Payment Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="paymentDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="form.get('paymentDate')?.hasError('required')">
                  Payment date is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod">
                  <mat-option value="Cash">Cash</mat-option>
                  <mat-option value="UPI">UPI</mat-option>
                  <mat-option value="CreditCard">Credit Card</mat-option>
                  <mat-option value="DebitCard">Debit Card</mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('paymentMethod')?.hasError('required')">
                  Payment method is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Transaction Reference (Optional)</mat-label>
                <input matInput formControlName="transactionReference" placeholder="e.g., UPI ID, Cheque #, Card Auth">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notes (Optional)</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/payments">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
                <span *ngIf="!saving">Record Payment</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
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
    }

    .form-card { max-width: 700px; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .full-width { width: 100%; }

    .form-row { margin-bottom: 1rem; }
    .form-row.two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .bill-info {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: 1px solid #e2e8f0;
    }

    .bill-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      
      mat-icon { color: #3b82f6; font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
      h3 { margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b; }
      p { margin: 0; font-size: 0.875rem; color: #64748b; }
    }

    .bill-amounts {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .amount-item {
      text-align: center;

      .label { display: block; font-size: 0.75rem; color: #64748b; }
      .value { font-size: 1.25rem; font-weight: 600; color: #1e293b; }
      .value.paid { color: #16a34a; }
      .value.due { color: #dc2626; }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
  `]
})
export class RecordPaymentComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  
  billIdFromRoute: number | null = null;
  selectedBill: Bill | null = null;
  unpaidBills: any[] = [];
  isConsumer = false;

  constructor(
    private fb: FormBuilder,
    private paymentsService: PaymentsService,
    private billsService: BillsService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.isConsumer = this.authService.hasRole(['Consumer']);
    console.log('RecordPayment - isConsumer:', this.isConsumer);
  }

  ngOnInit(): void {
    this.initForm();

    // Check for billId from query params
    const billId = this.route.snapshot.queryParamMap.get('billId');
    if (billId) {
      this.billIdFromRoute = +billId;
      this.form.patchValue({ billId: this.billIdFromRoute });
      
      // Consumer needs to load bill from their own bills list
      if (this.isConsumer) {
        this.loadConsumerBillDetails(this.billIdFromRoute);
      } else {
        this.loadBillDetails(this.billIdFromRoute);
      }
    } else {
      this.loadUnpaidBills();
    }
  }
  
  loadConsumerBillDetails(billId: number): void {
    console.log('loadConsumerBillDetails - billId:', billId);
    this.loading = true;
    this.billsService.getMyBills().subscribe({
      next: (response) => {
        console.log('getMyBills response:', response);
        this.loading = false;
        if (response.success && response.data) {
          // Find the specific bill from consumer's bills
          const bill = response.data.find((b: any) => b.id === billId);
          console.log('Found bill:', bill);
          if (bill) {
            this.selectedBill = bill as Bill;
            const maxAmount = bill.outstandingBalance || 0;
            // Set max amount validator
            this.form.get('amount')?.setValidators([
              Validators.required,
              Validators.min(0.01),
              Validators.max(maxAmount)
            ]);
            this.form.get('amount')?.updateValueAndValidity();
            // Default to full due amount
            this.form.patchValue({ amount: maxAmount });
            
            // Also populate unpaid bills for consumer
            this.unpaidBills = response.data.filter((b: any) => 
              b.outstandingBalance > 0 && b.status !== 'Paid'
            );
          } else {
            this.snackBar.open('Bill not found', 'Close', { duration: 3000 });
            this.router.navigate(['/payments']);
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error('Error loading bills:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Error loading bill details', 'Close', { duration: 3000 });
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      billId: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date(), Validators.required],
      paymentMethod: ['Cash', Validators.required],
      transactionReference: [''],
      notes: ['']
    });
  }

  loadUnpaidBills(): void {
    this.loading = true;
    
    // Consumer uses different API endpoint
    if (this.isConsumer) {
      this.billsService.getMyBills().subscribe({
        next: (response) => {
          this.loading = false;
          this.unpaidBills = (response.data || []).filter((b: any) => 
            b.outstandingBalance > 0 && b.status !== 'Paid'
          );
        },
        error: () => { this.loading = false; }
      });
      return;
    }
    
    // Staff uses paginated endpoint - fetch unpaid bills (Generated, Due, Overdue)
    this.billsService.getAll({ pageSize: 1000, pageNumber: 1 }).subscribe({
      next: (response) => {
        this.loading = false;
        this.unpaidBills = (response.data || []).filter((b: any) => 
          b.outstandingBalance > 0 && b.status !== 'Paid'
        );
      },
      error: () => { this.loading = false; }
    });
  }

  loadBillDetails(billId: number): void {
    this.loading = true;
    this.billsService.getById(billId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.selectedBill = response.data;
          const maxAmount = response.data.outstandingBalance || 0;
          // Set max amount validator
          this.form.get('amount')?.setValidators([
            Validators.required,
            Validators.min(0.01),
            Validators.max(maxAmount)
          ]);
          this.form.get('amount')?.updateValueAndValidity();
          // Default to full due amount
          this.form.patchValue({ amount: maxAmount });
        }
      },
      error: () => { this.loading = false; }
    });
  }

  onBillSelect(billId: number): void {
    if (this.isConsumer) {
      // For consumer, find bill from unpaid bills list
      const bill = this.unpaidBills.find(b => b.id === billId);
      if (bill) {
        this.selectedBill = bill as Bill;
        const maxAmount = bill.outstandingBalance || 0;
        this.form.get('amount')?.setValidators([
          Validators.required,
          Validators.min(0.01),
          Validators.max(maxAmount)
        ]);
        this.form.get('amount')?.updateValueAndValidity();
        this.form.patchValue({ amount: maxAmount });
      }
    } else {
      this.loadBillDetails(billId);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.value;

    const request: CreatePaymentRequest = {
      billId: formValue.billId,
      amount: formValue.amount,
      paymentDate: formValue.paymentDate.toISOString(),
      paymentMethod: formValue.paymentMethod,
      transactionReference: formValue.transactionReference || undefined,
      notes: formValue.notes || undefined
    };

    // Use different endpoint for Consumer
    const paymentCall = this.isConsumer 
      ? this.paymentsService.payMyBill(request)
      : this.paymentsService.create(request);

    paymentCall.subscribe({
      next: (response) => {
        this.saving = false;
        if (response.success) {
          this.snackBar.open('Payment recorded successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/payments']);
        } else {
          this.snackBar.open(response.message || 'Error recording payment', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error recording payment', 'Close', { duration: 3000 });
      }
    });
  }
}
