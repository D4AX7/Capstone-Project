// Billing Cycle DTOs

export interface BillingCycle {
  id: number;
  name: string;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
  billGenerationDate?: string;
  dueDate?: string;
  status: string;
  createdAt: string;
  createdByUserName?: string;
  totalReadings: number;
  totalBills: number;
}

export interface CreateBillingCycleRequest {
  name?: string;
  month: number;
  year: number;
  startDate?: string;
  endDate?: string;
  billGenerationDate?: string;
  dueDate?: string;
}

export interface UpdateBillingCycleRequest {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  billGenerationDate?: string;
  dueDate?: string;
}

export type BillingCycleStatus = 'Open' | 'Closed' | 'InProgress';
