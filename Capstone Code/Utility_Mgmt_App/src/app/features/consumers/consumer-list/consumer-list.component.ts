import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConsumersService } from '../../../core/services/consumers.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsumerListItem, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-consumer-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Consumers</h1>
          <p>Manage all registered consumers</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/consumers/new" *ngIf="canEdit">
          <mat-icon>add</mat-icon>
          Add Consumer
        </button>
      </div>

      <mat-card class="list-card">
        <mat-card-content>
          <!-- Search -->
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search consumers</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search by name, email, or consumer number">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="search()">Search</button>
            <button mat-stroked-button (click)="clearSearch()" *ngIf="searchTerm">Clear</button>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <!-- Table -->
          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="consumerNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Consumer #</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="fullName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
              </ng-container>

              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
                <td mat-cell *matCellDef="let row">{{ row.email }}</td>
              </ng-container>

              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let row">{{ row.phone || '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="city">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>City</th>
                <td mat-cell *matCellDef="let row">{{ row.city }}</td>
              </ng-container>

              <ng-container matColumnDef="totalConnections">
                <th mat-header-cell *matHeaderCellDef>Connections</th>
                <td mat-cell *matCellDef="let row">{{ row.totalConnections }}</td>
              </ng-container>

              <ng-container matColumnDef="isActive">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [ngClass]="row.isActive ? 'active' : 'inactive'">
                    {{ row.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  No consumers found
                </td>
              </tr>
            </table>

            <mat-paginator
              [length]="totalRecords"
              [pageIndex]="pageNumber - 1"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 0;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.025em;
      }

      p {
        margin: 0.25rem 0 0;
        color: var(--text-tertiary);
      }
    }

    .list-card {
      overflow: hidden;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      background: var(--bg-surface);
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .search-field {
      flex: 1;
      max-width: 400px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: var(--text-tertiary);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;

      &.active {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
      }

      &.inactive {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
      }
    }

    .mat-column-totalConnections {
      text-align: center;
    }
  `]
})
export class ConsumerListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
      // Case-insensitive sorting with lowercase first letter appearing before uppercase
      this.dataSource.sortingDataAccessor = (item: any, property: string) => {
        const value = item[property];
        if (typeof value === 'string' && value.length > 0) {
          const firstChar = value.charAt(0);
          const isLowercase = firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase();
          // Prefix: first letter lowercase + case indicator (0=lowercase, 1=uppercase) + rest of string lowercase
          return firstChar.toLowerCase() + (isLowercase ? '0' : '1') + value.slice(1).toLowerCase();
        }
        return value;
      };
    }
  }

  dataSource = new MatTableDataSource<ConsumerListItem>([]);
  displayedColumns = ['consumerNumber', 'fullName', 'email', 'phone', 'city', 'totalConnections', 'isActive'];

  loading = false;
  searchTerm = '';
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canEdit = false;

  constructor(
    private consumersService: ConsumersService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Only Admin can edit consumers - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
  }

  ngOnInit(): void {
    this.loadConsumers();
  }

  loadConsumers(): void {
    this.loading = true;
    const params: PaginationParams = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined
    };

    this.consumersService.getAll(params).subscribe({
      next: (response) => {
        this.loading = false;
        this.dataSource.data = response.data || [];
        this.totalRecords = response.totalRecords;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadConsumers();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadConsumers();
  }
}
