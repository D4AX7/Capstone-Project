import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="login-form">
      <div class="form-header">
        <span class="form-subtitle">WELCOME BACK</span>
        <h1 class="form-title">Login</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-body">
        <div class="input-group">
          <label class="input-label">USERNAME*</label>
          <div class="input-wrapper" [class.focused]="emailFocused" [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
            <input 
              type="email" 
              formControlName="email" 
              (focus)="emailFocused = true"
              (blur)="emailFocused = false"
            />
          </div>
          <span class="input-error" *ngIf="form.get('email')?.hasError('required') && form.get('email')?.touched">
            Email address is required
          </span>
          <span class="input-error" *ngIf="form.get('email')?.hasError('email') && form.get('email')?.touched">
            Please enter a valid email address
          </span>
        </div>

        <div class="input-group">
          <label class="input-label">PASSWORD*</label>
          <div class="input-wrapper" [class.focused]="passwordFocused" [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
            <input 
              [type]="hidePassword ? 'password' : 'text'" 
              formControlName="password" 
              (focus)="passwordFocused = true"
              (blur)="passwordFocused = false"
            />
          </div>
          <span class="input-error" *ngIf="form.get('password')?.hasError('required') && form.get('password')?.touched">
            Password is required
          </span>
          <span class="input-error" *ngIf="form.get('password')?.hasError('minlength') && form.get('password')?.touched">
            Password must be at least 6 characters
          </span>
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          <mat-icon>check_circle</mat-icon>
          <span>{{ successMessage }}</span>
        </div>

        <div *ngIf="error" class="alert alert-error">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
        </div>

        <button type="submit" class="submit-btn" [disabled]="form.invalid || loading">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <span *ngIf="!loading">LOGIN</span>
        </button>
      </form>

      <div class="form-footer">
        <p>New User? <a routerLink="/register" class="link">Create an account</a></p>
      </div>
    </div>
  `,
  styles: [`
    .login-form {
      width: 100%;
      animation: formFadeIn 0.5s ease-out;
    }

    @keyframes formFadeIn {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2rem;
      font-weight: 500;
      color: var(--text-primary);
      margin: 0.5rem 0 0 0;
      letter-spacing: -0.01em;
    }

    .form-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--text-tertiary);
      margin: 0;
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-label {
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-tertiary);
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      height: 48px;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: 4px;
      transition: all var(--transition-base);

      &.focused {
        border-color: var(--primary-500);
        background: var(--bg-surface);
      }

      &.error {
        border-color: var(--error-500);
      }

      input {
        flex: 1;
        height: 100%;
        padding: 0 1rem;
        border: none;
        background: transparent;
        font-size: 0.9375rem;
        color: var(--text-primary);
        outline: none;

        &::placeholder {
          color: var(--text-muted);
        }
      }
    }

    .input-error {
      font-size: 0.75rem;
      color: var(--error-600);
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
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .alert-success {
      background: var(--success-50);
      color: var(--success-700);
      border: 1px solid var(--success-200);
    }

    .alert-error {
      background: var(--error-50);
      color: var(--error-700);
      border: 1px solid var(--error-200);
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      height: 48px;
      margin-top: 0.5rem;
      border: none;
      border-radius: 4px;
      background: var(--primary-500);
      color: white;
      font-size: 0.8125rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover:not(:disabled) {
        background: var(--primary-600);
      }

      &:active:not(:disabled) {
        background: var(--primary-700);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .form-footer {
      text-align: center;
      margin-top: 1.5rem;

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-tertiary);
      }
    }

    .link {
      color: var(--primary-600);
      text-decoration: underline;
      font-weight: 500;
      transition: color var(--transition-base);

      &:hover {
        color: var(--primary-700);
        text-decoration: underline;
      }
    }

    @media (max-width: 480px) {
      .form-title {
        font-size: 1.75rem;
      }

      .form-header {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  hidePassword = true;
  emailFocused = false;
  passwordFocused = false;
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check if user just registered
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registration successful! Please log in with your credentials.';
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.successMessage = null;
    const { email, password } = this.form.value;
    this.auth.login({ email: email || '', password: password || '' }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.message || 'Login failed';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
        this.cdr.detectChanges();
      }
    });
  }
}
