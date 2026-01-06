// Bill DTOs

export interface Bill {
  id: number;
  billNumber: string;
  connectionId: number;
  connectionNumber: string;
  meterNumber: string;
  consumerName: string;
  consumerNumber: string;
  consumerId?: number; // for linking
  utilityType: string;
  utilityTypeName?: string; // alias
  tariffPlan: string;
  tariffPlanName?: string; // alias
  billingMonth: number;
  billingYear: number;
  billingPeriod: string;
  billDate: string;
  dueDate: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  energyCharges: number;
  baseAmount?: number; // alias for energyCharges
  fixedCharges: number;
  taxAmount: number;
  penaltyAmount: number;
  lateFee?: number; // alias for penaltyAmount
  previousBalance: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueAmount?: number; // alias for outstandingBalance
  status: string;
  generatedByUserName?: string;
  createdAt: string;
  payments: PaymentSummaryItem[];
}

export interface PaymentSummaryItem {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
}

export interface GenerateBillRequest {
  connectionId?: number;
  billingMonth?: number;
  billingYear?: number;
  meterReadingId?: number;
}

export interface GenerateBulkBillsRequest {
  billingMonth?: number;
  billingYear?: number;
  billingCycleId?: number;
  connectionIds?: number[];
}

export interface BillListItem {
  id: number;
  billNumber: string;
  consumerName: string;
  consumerNumber: string;
  utilityType: string;
  billingPeriod: string;
  dueDate: string;
  dueAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  status: string;
  createdAt: string;
}

export interface UpdateBillStatusRequest {
  status: string;
  notes?: string;
}

export interface BillSummary {
  totalBills: number;
  totalBilledAmount: number;
  totalCollected: number;
  totalOutstanding: number;
  paidBills: number;
  overdueBills: number;
}

export type BillStatus = 'Due' | 'Paid' | 'Overdue';
