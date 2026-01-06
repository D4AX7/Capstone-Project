// Connection Request DTOs

export interface ConnectionRequestDto {
  id: number;
  requestNumber: string;
  consumerId: number;
  consumerName: string;
  consumerNumber: string;
  utilityTypeId: number;
  utilityTypeName: string;
  tariffPlanId: number;
  tariffPlanName: string;
  loadSanctioned?: number;
  installationAddress?: string;
  remarks?: string;
  status: ConnectionRequestStatus;
  adminRemarks?: string;
  processedByUserName?: string;
  processedAt?: string;
  createdConnectionId?: number;
  createdConnectionNumber?: string;
  createdAt: string;
}

export interface ConnectionRequestListDto {
  id: number;
  requestNumber: string;
  consumerName: string;
  consumerNumber: string;
  utilityTypeName: string;
  tariffPlanName: string;
  status: ConnectionRequestStatus;
  createdAt: string;
  processedAt?: string;
}

export interface CreateConnectionRequestDto {
  utilityTypeId: number;
  tariffPlanId: number;
  loadSanctioned?: number;
  installationAddress?: string;
  remarks?: string;
}

export interface ProcessConnectionRequestDto {
  approve: boolean;
  adminRemarks?: string;
  meterNumber?: string;
}

export interface AvailableUtilityDto {
  utilityTypeId: number;
  utilityTypeName: string;
  description?: string;
  unitOfMeasurement: string;
  tariffPlans: AvailableTariffPlanDto[];
}

export interface AvailableTariffPlanDto {
  id: number;
  name: string;
  description?: string;
  ratePerUnit: number;
  fixedCharges: number;
  taxPercentage: number;
}

export type ConnectionRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
