// Connection DTOs

export interface Connection {
  id: number;
  consumerId: number;
  consumerName: string;
  consumerNumber: string;
  utilityTypeId: number;
  utilityTypeName: string;
  tariffPlanId: number;
  tariffPlanName: string;
  meterNumber: string;
  connectionNumber: string;
  connectionDate: string;
  status: string;
  loadSanctioned?: number;
  installationAddress?: string;
  lastReading?: number;
  lastReadingDate?: string;
}

export interface CreateConnectionRequest {
  consumerId: number;
  utilityTypeId: number;
  tariffPlanId: number;
  meterNumber: string;
  connectionDate?: string;
  loadSanctioned?: number;
  installationAddress?: string;
}

export interface UpdateConnectionRequest {
  tariffPlanId?: number;
  status?: string;
  loadSanctioned?: number;
  installationAddress?: string;
}

export interface ConnectionListItem {
  id: number;
  connectionNumber: string;
  meterNumber: string;
  consumerName: string;
  utilityTypeId: number;
  utilityType: string;
  tariffPlanId: number;
  tariffPlanName: string;
  status: string;
  connectionDate: string;
}

export type ConnectionStatus = 'Active' | 'Inactive' | 'Suspended' | 'Disconnected';
