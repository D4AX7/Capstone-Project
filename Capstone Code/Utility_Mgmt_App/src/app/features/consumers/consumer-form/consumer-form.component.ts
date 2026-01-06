import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsumersService } from '../../../core/services/consumers.service';
import { CreateConsumerRequest, UpdateConsumerRequest } from '../../../core/models';

@Component({
  selector: 'app-consumer-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/consumers" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>{{ isEdit ? 'Edit Consumer' : 'New Consumer' }}</h1>
          <p>{{ isEdit ? 'Update consumer information' : 'Register a new consumer' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="section-title">Personal Information</div>
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
                <mat-error *ngIf="form.get('firstName')?.hasError('required')">First name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
                <mat-error *ngIf="form.get('lastName')?.hasError('required')">Last name is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" />
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Please enter a valid email</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('lowercase')">Email must be lowercase only</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width" *ngIf="!isEdit">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">Min 6 characters</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('pattern')">Must have uppercase, lowercase, number & special char</mat-error>
            </mat-form-field>

            <div class="section-title">Address</div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Street Address</mat-label>
              <input matInput formControlName="address" />
              <mat-error *ngIf="form.get('address')?.hasError('required')">Address is required</mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
                <mat-error *ngIf="form.get('city')?.hasError('required')">City is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>State</mat-label>
                <input matInput formControlName="state" />
                <mat-error *ngIf="form.get('state')?.hasError('required')">State is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Postal Code</mat-label>
                <input matInput formControlName="postalCode" />
                <mat-error *ngIf="form.get('postalCode')?.hasError('required')">Postal code is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row" *ngIf="isEdit">
              <mat-slide-toggle formControlName="isActive" color="primary">
                Active Status
              </mat-slide-toggle>
            </div>

            <div *ngIf="error" class="error-message">{{ error }}</div>

            <div class="form-actions">
              <button mat-stroked-button type="button" routerLink="/consumers">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">{{ isEdit ? 'Update' : 'Create' }}</span>
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

    .form-card {
      max-width: 700px;
    }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 1.5rem 0 1rem;

      &:first-child {
        margin-top: 0;
      }
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.25rem;

      mat-form-field {
        flex: 1;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 1.25rem;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      position: relative;
      min-height: 1.25rem;
    }

    .error-message {
      color: #ef4444;
      margin-bottom: 1rem;
      text-align: center;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class ConsumerFormComponent implements OnInit {
  isEdit = false;
  loading = false;
  error: string | null = null;
  private consumerId?: number;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consumersService: ConsumersService,
    private cdr: ChangeDetectorRef
  ) {
    // Custom lowercase email validator
    const lowercaseEmailValidator = (control: any) => {
      if (!control.value) return null;
      return control.value !== control.value.toLowerCase() 
        ? { lowercase: true } 
        : null;
    };

    // Password pattern: at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]).{6,}$/;

    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, lowercaseEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(passwordPattern)]],
      phone: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit = true;
      this.consumerId = Number(id);
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadConsumer();
    }
  }

  loadConsumer(): void {
    if (!this.consumerId) return;
    
    this.consumersService.getById(this.consumerId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.form.patchValue(response.data);
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load consumer';
      }
    });
  }

  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();
    this.cdr.detectChanges();
    
    if (this.form.invalid) return;
    
    this.loading = true;
    this.error = null;

    if (this.isEdit && this.consumerId) {
      const payload: UpdateConsumerRequest = {
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        phone: this.form.value.phone || undefined,
        address: this.form.value.address,
        city: this.form.value.city,
        state: this.form.value.state,
        postalCode: this.form.value.postalCode,
        isActive: this.form.value.isActive
      };

      this.consumersService.update(this.consumerId, payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.router.navigate(['/consumers', this.consumerId]);
          } else {
            this.error = response.message || 'Failed to update consumer';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to update consumer';
          this.cdr.detectChanges();
        }
      });
    } else {
      const payload: CreateConsumerRequest = {
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        email: this.form.value.email,
        password: this.form.value.password,
        phone: this.form.value.phone || undefined,
        address: this.form.value.address,
        city: this.form.value.city,
        state: this.form.value.state,
        postalCode: this.form.value.postalCode
      };

      this.consumersService.create(payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.router.navigate(['/consumers', response.data.id]);
          } else {
            this.error = response.message || 'Failed to create consumer';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to create consumer';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
