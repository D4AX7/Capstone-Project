// Payment DTOs

export interface Payment {
  id: number;
  paymentNumber: string;
  billId: number;
  billNumber: string;
  consumerName: string;
  consumerNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  status: string;
  receivedByUserName?: string;
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  billId: number;
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  transactionReference?: string;
  notes?: string;
}

export interface UpdatePaymentStatusRequest {
  status: string;
  notes?: string;
}

export interface PaymentListItem {
  id: number;
  paymentNumber: string;
  billNumber: string;
  consumerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  byPaymentMethod: { [key: string]: number };
  todayCollection: number;
  thisMonthCollection: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'BankTransfer' | 'UPI' | 'Cheque' | 'Online';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';
