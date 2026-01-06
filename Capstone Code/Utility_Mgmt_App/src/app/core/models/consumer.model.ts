// Consumer DTOs

export interface Consumer {
  id: number;
  userId: number;
  consumerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  registrationDate: string;
  isActive: boolean;
  connections: ConnectionSummary[];
}

export interface ConnectionSummary {
  id: number;
  connectionNumber: string;
  meterNumber: string;
  utilityType: string;
  tariffPlan: string;
  status: string;
}

export interface CreateConsumerRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface UpdateConsumerRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
}

export interface ConsumerListItem {
  id: number;
  consumerNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  city: string;
  totalConnections: number;
  isActive: boolean;
}
