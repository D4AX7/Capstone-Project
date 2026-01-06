import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatStepperModule],
  template: `
    <div class="register-form">
      <div class="form-header">
        <p class="form-label">CREATE ACCOUNT</p>
        <h1 class="form-title">Register</h1>
        <p class="form-subtitle">Start managing your utilities today</p>
      </div>

      <div class="step-indicator">
        <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
          <div class="step-number">
            <mat-icon *ngIf="currentStep > 1">check</mat-icon>
            <span *ngIf="currentStep <= 1">1</span>
          </div>
          <span class="step-label">PERSONAL</span>
        </div>
        <div class="step-line" [class.active]="currentStep > 1"></div>
        <div class="step" [class.active]="currentStep === 2" [class.completed]="currentStep > 2">
          <div class="step-number">
            <mat-icon *ngIf="currentStep > 2">check</mat-icon>
            <span *ngIf="currentStep <= 2">2</span>
          </div>
          <span class="step-label">ADDRESS</span>
        </div>
        <div class="step-line" [class.active]="currentStep > 2"></div>
        <div class="step" [class.active]="currentStep === 3">
          <div class="step-number">3</div>
          <span class="step-label">SECURITY</span>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">
        <!-- Step 1: Personal Information -->
        <div class="step-content" *ngIf="currentStep === 1">
          <div class="input-row">
            <div class="input-group">
              <label class="input-label">FIRST NAME*</label>
              <input type="text" formControlName="firstName" placeholder="John" [class.error]="form.get('firstName')?.invalid && form.get('firstName')?.touched" />
              <span class="input-error" *ngIf="form.get('firstName')?.hasError('required') && form.get('firstName')?.touched">
                First name is required
              </span>
            </div>

            <div class="input-group">
              <label class="input-label">LAST NAME*</label>
              <input type="text" formControlName="lastName" placeholder="Doe" [class.error]="form.get('lastName')?.invalid && form.get('lastName')?.touched" />
              <span class="input-error" *ngIf="form.get('lastName')?.hasError('required') && form.get('lastName')?.touched">
                Last name is required
              </span>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">EMAIL ADDRESS*</label>
            <input type="email" formControlName="email" placeholder="john.doe@company.com" [class.error]="form.get('email')?.invalid && form.get('email')?.touched" />
            <span class="input-error" *ngIf="form.get('email')?.hasError('required') && form.get('email')?.touched">
              Email is required
            </span>
            <span class="input-error" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">
              Please enter a valid email
            </span>
            <span class="input-error" *ngIf="form.get('email')?.hasError('uppercase') && form.get('email')?.touched">
              Email must not contain uppercase letters
            </span>
          </div>

          <div class="input-group">
            <label class="input-label">PHONE NUMBER</label>
            <input type="tel" formControlName="phone" placeholder="+1 (555) 000-0000" />
          </div>
        </div>

        <!-- Step 2: Address Information -->
        <div class="step-content" *ngIf="currentStep === 2">
          <div class="input-group">
            <label class="input-label">STREET ADDRESS*</label>
            <input type="text" formControlName="address" placeholder="123 Main Street" [class.error]="form.get('address')?.invalid && form.get('address')?.touched" />
            <span class="input-error" *ngIf="form.get('address')?.hasError('required') && form.get('address')?.touched">
              Address is required
            </span>
          </div>

          <div class="input-row">
            <div class="input-group">
              <label class="input-label">CITY*</label>
              <input type="text" formControlName="city" placeholder="New York" [class.error]="form.get('city')?.invalid && form.get('city')?.touched" />
              <span class="input-error" *ngIf="form.get('city')?.hasError('required') && form.get('city')?.touched">
                City is required
              </span>
            </div>

            <div class="input-group">
              <label class="input-label">STATE*</label>
              <input type="text" formControlName="state" placeholder="NY" [class.error]="form.get('state')?.invalid && form.get('state')?.touched" />
              <span class="input-error" *ngIf="form.get('state')?.hasError('required') && form.get('state')?.touched">
                State is required
              </span>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">POSTAL CODE*</label>
            <input type="text" formControlName="postalCode" placeholder="10001" [class.error]="form.get('postalCode')?.invalid && form.get('postalCode')?.touched" />
            <span class="input-error" *ngIf="form.get('postalCode')?.hasError('required') && form.get('postalCode')?.touched">
              Postal code is required
            </span>
          </div>
        </div>

        <!-- Step 3: Security -->
        <div class="step-content" *ngIf="currentStep === 3">
          <div class="input-group">
            <label class="input-label">PASSWORD*</label>
            <div class="password-wrapper">
              <input [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Create a strong password" [class.error]="form.get('password')?.invalid && form.get('password')?.touched" />
              <button type="button" class="toggle-password" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <span class="input-error" *ngIf="form.get('password')?.hasError('required') && form.get('password')?.touched">
              Password is required
            </span>
            <span class="input-error" *ngIf="form.get('password')?.hasError('minlength') && form.get('password')?.touched">
              Password must be at least 6 characters
            </span>
          </div>

          <div class="password-requirements">
            <p class="requirements-title">PASSWORD MUST CONTAIN:</p>
            <div class="requirement" [class.met]="form.get('password')?.value?.length >= 6">
              <mat-icon>{{ form.get('password')?.value?.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>At least 6 characters</span>
            </div>
          </div>

          <div *ngIf="error" class="alert alert-error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" *ngIf="currentStep > 1" (click)="previousStep()">
            <mat-icon>arrow_back</mat-icon>
            <span>BACK</span>
          </button>
          <div class="spacer" *ngIf="currentStep === 1"></div>
          
          <button type="button" class="btn-primary" *ngIf="currentStep < 3" (click)="nextStep()" [disabled]="!isCurrentStepValid()">
            <span>CONTINUE</span>
            <mat-icon>arrow_forward</mat-icon>
          </button>

          <button type="submit" class="btn-primary" *ngIf="currentStep === 3" [disabled]="form.invalid || loading">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">CREATE ACCOUNT</span>
          </button>
        </div>
      </form>

      <div class="form-footer">
        <p>Already have an account? <a routerLink="/login" class="link">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [`
    .register-form {
      width: 100%;
      animation: formFadeIn 0.5s ease-out;
    }

    @keyframes formFadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin: 0 0 0.5rem 0;
    }

    .form-title {
      font-size: 2rem;
      font-weight: 500;
      font-family: var(--font-serif);
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .form-subtitle {
      font-size: 0.9375rem;
      color: var(--text-tertiary);
      margin: 0;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .step-number {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-default);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-tertiary);
        transition: all 0.2s ease;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .step-label {
        font-size: 0.625rem;
        font-weight: 500;
        color: var(--text-tertiary);
        letter-spacing: 0.08em;
        transition: color 0.2s ease;
      }

      &.active {
        .step-number {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
        }
        .step-label {
          color: var(--primary-600);
        }
      }

      &.completed {
        .step-number {
          background: var(--success-500);
          border-color: var(--success-500);
          color: white;
        }
        .step-label {
          color: var(--success-600);
        }
      }
    }

    .step-line {
      width: 32px;
      height: 1px;
      background: var(--border-default);
      margin-bottom: 1.5rem;
      transition: background 0.2s ease;

      &.active {
        background: var(--success-500);
      }
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      animation: stepSlide 0.3s ease-out;
    }

    @keyframes stepSlide {
      from { opacity: 0; transform: translateX(16px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .input-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-tertiary);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    input {
      width: 100%;
      height: 48px;
      padding: 0 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 4px;
      font-size: 0.9375rem;
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.2s ease;

      &::placeholder {
        color: var(--text-muted);
      }

      &:focus {
        border-color: var(--primary-500);
      }

      &.error {
        border-color: var(--error-500);
      }
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        padding-right: 48px;
      }

      .toggle-password {
        position: absolute;
        right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .input-error {
      font-size: 0.75rem;
      color: var(--error-600);
    }

    .password-requirements {
      background: var(--bg-secondary);
      border-radius: 4px;
      padding: 1rem;
      border: 1px solid var(--border-light);

      .requirements-title {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--text-tertiary);
        letter-spacing: 0.05em;
        margin: 0 0 0.75rem 0;
      }

      .requirement {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-tertiary);

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.met {
          color: var(--success-600);
        }
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .alert-error {
      background: var(--error-50);
      color: var(--error-700);
      border: 1px solid var(--error-200);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;

      .spacer {
        flex: 1;
      }
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      padding: 0 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .btn-primary {
      flex: 1;
      background: var(--primary-500);
      color: white;

      &:hover:not(:disabled) {
        background: var(--primary-600);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-secondary {
      background: var(--bg-surface);
      color: var(--text-secondary);
      border: 1px solid var(--border-default);

      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border-dark);
      }
    }

    .form-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-light);

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-tertiary);
      }
    }

    .link {
      color: var(--primary-600);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;

      &:hover {
        color: var(--primary-700);
        text-decoration: underline;
      }
    }

    @media (max-width: 480px) {
      .input-row {
        grid-template-columns: 1fr;
      }

      .form-title {
        font-size: 1.75rem;
      }

      .step-label {
        display: none;
      }

      .step-line {
        width: 20px;
        margin-bottom: 0;
      }
    }
  `]
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;
  hidePassword = true;
  currentStep = 1;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, this.lowercaseValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required]
    });
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !this.form.get('firstName')?.invalid && 
               !this.form.get('lastName')?.invalid && 
               !this.form.get('email')?.invalid;
      case 2:
        return !this.form.get('address')?.invalid && 
               !this.form.get('city')?.invalid && 
               !this.form.get('state')?.invalid && 
               !this.form.get('postalCode')?.invalid;
      case 3:
        return !this.form.get('password')?.invalid;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.currentStep < 3 && this.isCurrentStepValid()) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Custom validator to check for uppercase letters in email
  lowercaseValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && /[A-Z]/.test(value)) {
      return { uppercase: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.auth.register(this.form.value as any).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
        } else {
          this.error = res.message || 'Registration failed';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed';
        this.cdr.detectChanges();
      }
    });
  }
}
