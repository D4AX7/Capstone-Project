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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MeterReadingsService } from '../../../core/services/meter-readings.service';
import { MeterReadingListItem, PaginationParams } from '../../../core/models';

@Component({
  selector: 'app-reading-list',
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
    MatSelectModule,
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
          <h1>Meter Readings</h1>
          <p>Record and manage meter readings</p>
        </div>
        <button mat-raised-button color="primary" routerLink="/meter-readings/new">
          <mat-icon>add</mat-icon>
          Add Reading
        </button>
      </div>

      <mat-card class="list-card">
        <mat-card-content>
          <div class="filter-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search by connection or consumer">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Month</mat-label>
              <mat-select [(ngModel)]="selectedMonth" (selectionChange)="search()">
                <mat-option [value]="null">All</mat-option>
                <mat-option *ngFor="let m of months" [value]="m.value">{{ m.label }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Year</mat-label>
              <mat-select [(ngModel)]="selectedYear" (selectionChange)="search()">
                <mat-option [value]="null">All</mat-option>
                <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="clearFilters()">Clear Filters</button>
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
                <th mat-header-cell *matHeaderCellDef>Meter #</th>
                <td mat-cell *matCellDef="let row">{{ row.meterNumber }}</td>
              </ng-container>

              <ng-container matColumnDef="consumerName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Consumer</th>
                <td mat-cell *matCellDef="let row">{{ row.consumerName }}</td>
              </ng-container>

              <ng-container matColumnDef="previousReading">
                <th mat-header-cell *matHeaderCellDef>Previous</th>
                <td mat-cell *matCellDef="let row">{{ row.previousReading | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="currentReading">
                <th mat-header-cell *matHeaderCellDef>Current</th>
                <td mat-cell *matCellDef="let row">{{ row.currentReading | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="unitsConsumed">
                <th mat-header-cell *matHeaderCellDef>Units</th>
                <td mat-cell *matCellDef="let row" class="units-cell">{{ row.unitsConsumed | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="readingDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.readingDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="billingPeriod">
                <th mat-header-cell *matHeaderCellDef>Period</th>
                <td mat-cell *matCellDef="let row">{{ row.billingMonth }}/{{ row.billingYear }}</td>
              </ng-container>

              <ng-container matColumnDef="isBilled">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-badge" [class.generated]="row.isBilled" [class.pending]="!row.isBilled">
                    {{ row.isBilled ? 'Generated' : 'Pending' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [routerLink]="['/meter-readings', row.id, 'edit']" matTooltip="Edit" [disabled]="row.isBilled">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                  No meter readings found
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

    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .search-field { flex: 1; min-width: 250px; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .no-data { text-align: center; padding: 2rem; color: #64748b; }
    .units-cell { font-weight: 600; color: #3b82f6; }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-align: center;
    }

    .status-badge.generated {
      background-color: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }

    .status-badge.pending {
      background-color: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde047;
    }
  `]
})
export class ReadingListComponent implements OnInit {
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  dataSource = new MatTableDataSource<MeterReadingListItem>([]);
  displayedColumns = ['connectionNumber', 'meterNumber', 'consumerName', 'previousReading', 'currentReading', 'unitsConsumed', 'readingDate', 'billingPeriod', 'isBilled', 'actions'];

  loading = false;
  searchTerm = '';
  selectedMonth: number | null = null;
  selectedYear: number | null = null;
  pageSize = 10;
  pageNumber = 1;
  totalRecords = 0;

  months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  years: number[] = [];

  constructor(private meterReadingsService: MeterReadingsService, private cdr: ChangeDetectorRef) {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.loadReadings();
  }

  loadReadings(): void {
    this.loading = true;
    const params: PaginationParams & { billingMonth?: number; billingYear?: number } = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      billingMonth: this.selectedMonth ?? undefined,
      billingYear: this.selectedYear ?? undefined
    };

    this.meterReadingsService.getAll(params).subscribe({
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
    this.loadReadings();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedMonth = null;
    this.selectedYear = null;
    this.search();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadReadings();
  }
}
