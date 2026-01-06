// Common DTOs - API Response wrappers and pagination

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PagedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}
