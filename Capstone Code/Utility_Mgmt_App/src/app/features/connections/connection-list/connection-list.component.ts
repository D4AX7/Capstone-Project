import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConnectionsService } from '../../../core/services/connections.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConnectionListItem, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-connection-list',
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
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Connections</h1>
          <p>Manage utility connections</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/connections/new" *ngIf="canEdit">
          <mat-icon>add</mat-icon>
          Add Connection
        </button>
      </div>

      <mat-card class="list-card">
        <mat-card-content>
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search connections</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search by connection number, meter number, or consumer">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <button mat-stroked-button (click)="search()">Search</button>
            <button mat-stroked-button (click)="clearSearch()" *ngIf="searchTerm">Clear</button>
          </div>

          <div *ngIf="loading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="dataSource" matSort>
              <ng-container matColumnDef="connectionNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Connection #</th>
                <td mat-cell *matCellDef="let row">{{ row.connectionNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="meterNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Meter #</th>
                <td mat-cell *matCellDef="let row">{{ row.meterNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Consumer</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>

              <ng-container matColumnDef="utilityType">
                <th mat-header-cell *matHeaderCellDef>Utility Type</th>
                <td mat-cell *matCellDef="let row">{{ row.utilityType }}</td>
              </ng-container>

              <ng-container matColumnDef="tariffPlanName">
                <th mat-header-cell *matHeaderCellDef>Tariff Plan</th>
                <td mat-cell *matCellDef="let row">{{ row.tariffPlanName }}</td>
              </ng-container>

              <ng-container matColumnDef="connectionDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Connection Date</th>
                <td mat-cell *matCellDef="let row">{{ row.connectionDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [ngClass]="row.status === 'Active' ? 'active' : 'inactive'">
                    {{ row.status }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/connections', row.id]" matTooltip="View Details">
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button [routerLink]="['/connections', row.id, 'edit']" matTooltip="Edit" *ngIf="canEdit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Delete" color="warn" *ngIf="isAdmin" (click)="deleteConnection(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  No connections found
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #1e293b; }
      p { margin: 0.25rem 0 0; color: #64748b; }
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .search-field { flex: 1; max-width: 400px; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .no-data { text-align: center; padding: 2rem; color: #64748b; }
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

    .mat-column-actions {
      button.mat-mdc-icon-button {
        width: 32px;
        height: 32px;
        padding: 4px;
        
        .mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          line-height: 18px;
        }
      }
    }
  `]
})
export class ConnectionListComponent implements OnInit {
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

  dataSource = new MatTableDataSource<ConnectionListItem>([]);
  displayedColumns: string[] = [];

  loading = false;
  searchTerm = '';
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;
  canEdit = false;
  isAdmin = false;

  constructor(
    private connectionsService: ConnectionsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    // Only Admin can edit connections - AccountOfficer has view-only access
    const user = this.authService.getCurrentUser();
    this.canEdit = user?.role === 'Admin';
    this.isAdmin = user?.role === 'Admin';
    
    // Set columns based on role - hide actions column for billing officers
    const baseColumns = ['connectionNumber', 'meterNumber', 'consumerName', 'utilityType', 'tariffPlanName', 'connectionDate', 'status'];
    this.displayedColumns = this.isAdmin ? [...baseColumns, 'actions'] : baseColumns;
  }

  ngOnInit(): void {
    this.loadConnections();
  }

  loadConnections(): void {
    this.loading = true;
    const params: PaginationParams = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined
    };

    this.connectionsService.getAll(params).subscribe({
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
    this.loadConnections();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadConnections();
  }

  deleteConnection(row: ConnectionListItem): void {
    if (confirm(`Are you sure you want to delete connection ${row.connectionNumber}?`)) {
      this.connectionsService.delete(row.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Connection deleted successfully', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.loadConnections();
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'Failed to delete connection', 'Close', {
            duration: 8000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
