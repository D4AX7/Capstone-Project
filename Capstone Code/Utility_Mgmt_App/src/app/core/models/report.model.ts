// Report DTOs

export interface DashboardSummary {
  totalConsumers: number;
  activeConnections: number;
  pendingBills: number;
  overdueBills: number;
  totalRevenueThisMonth: number;
  totalOutstanding: number;
  totalBilled?: number;
  totalCollected?: number;
  recentActivities: RecentActivity[];
  consumptionByUtilityType: UtilityConsumption[];
  revenueByUtilityType?: UtilityRevenue[];
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
}

export interface UtilityConsumption {
  utilityType: string;
  totalConsumption: number;
  unit: string;
  connectionCount: number;
}

export interface MonthlyRevenueReport {
  month: number;
  year: number;
  monthName: string;
  totalBilledAmount: number;
  totalCollected: number;
  totalOutstanding: number;
  totalBills: number;
  paidBills: number;
  collectionRate: number;
  byUtilityType: UtilityRevenue[];
}

export interface UtilityRevenue {
  utilityType: string;
  billedAmount: number;
  collected: number;
  billCount: number;
}

export interface OutstandingDuesReport {
  totalOutstanding: number;
  totalOverdueAccounts: number;
  byAgeBucket: OutstandingByAge[];
  topDefaulters: ConsumerOutstanding[];
}

export interface OutstandingByAge {
  ageBucket: string;
  amount: number;
  count: number;
}

export interface ConsumerOutstanding {
  consumerId: number;
  consumerNumber: string;
  consumerName: string;
  outstandingAmount: number;
  overdueBills: number;
  oldestDueDate?: string;
}

export interface ConsumptionReport {
  month: number;
  year: number;
  byUtilityType: UtilityConsumptionDetail[];
  topConsumers: TopConsumer[];
  totalConsumption: number;
  averageConsumption: number;
}

export interface UtilityConsumptionDetail {
  utilityType: string;
  unit: string;
  totalConsumption: number;
  averageConsumption: number;
  minConsumption: number;
  maxConsumption: number;
  connectionCount: number;
}

export interface TopConsumer {
  consumerId: number;
  consumerNumber: string;
  consumerName: string;
  utilityType: string;
  consumption: number;
  unit: string;
}

export interface ConsumerBillingSummary {
  consumerId: number;
  consumerNumber: string;
  consumerName: string;
  totalBills: number;
  totalBilledAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  connections: ConnectionBillingSummary[];
}

export interface ConnectionBillingSummary {
  connectionId: number;
  connectionNumber: string;
  utilityType: string;
  billCount: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  totalConsumption: number;
}

export interface CollectionReport {
  fromDate: string;
  toDate: string;
  totalCollected: number;
  dailyCollections: DailyCollection[];
  byPaymentMethod: PaymentMethodCollection[];
}

export interface DailyCollection {
  date: string;
  amount: number;
  paymentCount: number;
}

export interface PaymentMethodCollection {
  paymentMethod: string;
  amount: number;
  count: number;
  percentage: number;
}
