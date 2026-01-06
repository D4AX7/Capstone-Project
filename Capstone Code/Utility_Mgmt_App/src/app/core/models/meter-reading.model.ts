// Meter Reading DTOs

export interface MeterReading {
  id: number;
  connectionId: number;
  connectionNumber: string;
  meterNumber: string;
  consumerName: string;
  utilityType: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
  billingMonth: number;
  billingYear: number;
  readByUserName?: string;
  notes?: string;
  isEstimated: boolean;
  isBilled: boolean;
}

export interface CreateMeterReadingRequest {
  connectionId: number;
  currentReading: number;
  readingDate?: string;
  billingMonth: number;
  billingYear: number;
  notes?: string;
  isEstimated?: boolean;
}

export interface UpdateMeterReadingRequest {
  currentReading?: number;
  readingDate?: string;
  billingMonth?: number;
  billingYear?: number;
  notes?: string;
  isEstimated?: boolean;
}

export interface MeterReadingListItem {
  id: number;
  connectionId: number;
  connectionNumber: string;
  meterNumber: string;
  consumerName: string;
  utilityTypeName?: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
  billingMonth: number;
  billingYear: number;
  isBilled: boolean;
  status?: string;
  createdAt: string;
}

export interface BulkMeterReadingRequest {
  readings: CreateMeterReadingRequest[];
}
