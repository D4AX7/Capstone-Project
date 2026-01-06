import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ConnectionsService } from '../../../core/services/connections.service';
import { ConsumersService } from '../../../core/services/consumers.service';
import { UtilityTypesService } from '../../../core/services/utility-types.service';
import { TariffPlansService } from '../../../core/services/tariff-plans.service';
import { 
  CreateConnectionRequest, 
  UpdateConnectionRequest, 
  ConsumerListItem,
  UtilityType,
  TariffPlan
} from '../../../core/models';

@Component({
  selector: 'app-connection-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <button mat-icon-button routerLink="/connections" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1>{{ isEdit ? 'Edit Connection' : 'New Connection' }}</h1>
          <p>{{ isEdit ? 'Update connection details' : 'Add a new utility connection' }}</p>
        </div>
      </div>

      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="section-title">Consumer & Utility</div>
            
            <mat-form-field appearance="outline" class="full-width" *ngIf="!isEdit">
              <mat-label>Consumer</mat-label>
              <mat-select formControlName="consumerId">
                <mat-option *ngFor="let consumer of consumers" [value]="consumer.id">
                  {{ consumer.fullName }} ({{ consumer.consumerNumber }})
                </mat-option>
              </mat-select>
              <mat-error *ngIf="form.get('consumerId')?.hasError('required')">Consumer is required</mat-error>
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" *ngIf="!isEdit">
                <mat-label>Utility Type</mat-label>
                <mat-select formControlName="utilityTypeId" (selectionChange)="onUtilityTypeChange()">
                  <mat-option *ngFor="let type of utilityTypes" [value]="type.id">
                    {{ type.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('utilityTypeId')?.hasError('required')">Utility type is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tariff Plan</mat-label>
                <mat-select formControlName="tariffPlanId">
                  <mat-option *ngFor="let plan of filteredTariffPlans" [value]="plan.id">
                    {{ plan.name }} (₹{{ plan.ratePerUnit }}/unit)
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('tariffPlanId')?.hasError('required')">Tariff plan is required</mat-error>
              </mat-form-field>
            </div>

            <div class="section-title">Connection Details</div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" *ngIf="!isEdit">
                <mat-label>Meter Number</mat-label>
                <input matInput formControlName="meterNumber" />
                <mat-error *ngIf="form.get('meterNumber')?.hasError('required')">Meter number is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Load Sanctioned (kW)</mat-label>
                <input matInput type="number" formControlName="loadSanctioned" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Installation Address</mat-label>
              <textarea matInput formControlName="installationAddress" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width" *ngIf="isEdit">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="Active">Active</mat-option>
                <mat-option value="Inactive">Inactive</mat-option>
              </mat-select>
            </mat-form-field>

            <div *ngIf="error" class="error-message">{{ error }}</div>

            <div class="form-actions">
              <button mat-stroked-button type="button" routerLink="/connections">Cancel</button>
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

      .header-content {
        flex: 1;
        h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
        p { margin: 0.25rem 0 0; color: #64748b; }
      }
    }

    .form-card { max-width: 700px; }

    .section-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin: 1.5rem 0 1rem;

      &:first-child { margin-top: 0; }
    }

    .form-row {
      display: flex;
      gap: 1rem;

      mat-form-field { flex: 1; }
    }

    .full-width { width: 100%; }

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
export class ConnectionFormComponent implements OnInit {
  isEdit = false;
  loading = false;
  error: string | null = null;
  private connectionId?: number;

  consumers: ConsumerListItem[] = [];
  utilityTypes: UtilityType[] = [];
  tariffPlans: TariffPlan[] = [];
  filteredTariffPlans: TariffPlan[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private connectionsService: ConnectionsService,
    private consumersService: ConsumersService,
    private utilityTypesService: UtilityTypesService,
    private tariffPlansService: TariffPlansService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      consumerId: [null as number | null, Validators.required],
      utilityTypeId: [null as number | null, Validators.required],
      tariffPlanId: [null as number | null, Validators.required],
      meterNumber: ['', Validators.required],
      loadSanctioned: [null as number | null],
      installationAddress: [''],
      status: ['Active']
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();

    const id = this.route.snapshot.paramMap.get('id');
    const consumerId = this.route.snapshot.queryParamMap.get('consumerId');

    if (id && id !== 'new') {
      this.isEdit = true;
      this.connectionId = Number(id);
      this.loadConnection();
    } else if (consumerId) {
      this.form.patchValue({ consumerId: Number(consumerId) });
    }
  }

  loadDropdowns(): void {
    this.consumersService.getAll({ pageSize: 1000 }).subscribe({
      next: (response) => {
        this.consumers = response.data || [];
      }
    });

    this.utilityTypesService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.utilityTypes = response.data;
        }
      }
    });

    this.tariffPlansService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tariffPlans = response.data;
        }
      }
    });
  }

  loadConnection(): void {
    if (!this.connectionId) return;

    this.connectionsService.getById(this.connectionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const conn = response.data;
          this.form.patchValue({
            consumerId: conn.consumerId,
            utilityTypeId: conn.utilityTypeId,
            tariffPlanId: conn.tariffPlanId,
            meterNumber: conn.meterNumber,
            loadSanctioned: conn.loadSanctioned,
            installationAddress: conn.installationAddress,
            status: conn.status
          });
          this.onUtilityTypeChange();
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load connection';
      }
    });
  }

  onUtilityTypeChange(): void {
    const utilityTypeId = this.form.value.utilityTypeId;
    if (utilityTypeId) {
      this.filteredTariffPlans = this.tariffPlans.filter(p => p.utilityTypeId === utilityTypeId && p.isActive);
    } else {
      this.filteredTariffPlans = [];
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = null;

    if (this.isEdit && this.connectionId) {
      const payload: UpdateConnectionRequest = {
        tariffPlanId: this.form.value.tariffPlanId ?? undefined,
        status: this.form.value.status ?? undefined,
        loadSanctioned: this.form.value.loadSanctioned ?? undefined,
        installationAddress: this.form.value.installationAddress ?? undefined
      };

      this.connectionsService.update(this.connectionId, payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            this.router.navigate(['/connections', this.connectionId]);
          } else {
            this.error = response.message || 'Failed to update connection';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to update connection';
          this.cdr.detectChanges();
        }
      });
    } else {
      const payload: CreateConnectionRequest = {
        consumerId: this.form.value.consumerId!,
        utilityTypeId: this.form.value.utilityTypeId!,
        tariffPlanId: this.form.value.tariffPlanId!,
        meterNumber: this.form.value.meterNumber!,
        loadSanctioned: this.form.value.loadSanctioned ?? undefined,
        installationAddress: this.form.value.installationAddress ?? undefined
      };

      this.connectionsService.create(payload).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.data) {
            this.router.navigate(['/connections', response.data.id]);
          } else {
            this.error = response.message || 'Failed to create connection';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Failed to create connection';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
