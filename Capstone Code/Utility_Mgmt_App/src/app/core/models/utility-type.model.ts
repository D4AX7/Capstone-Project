// Utility Type DTOs

export interface UtilityType {
  id: number;
  name: string;
  description?: string;
  unitOfMeasurement: string;
  unit?: string; // Alias for unitOfMeasurement
  billingCycleMonths: number; // 1 = Monthly, 2 = Bi-Monthly, 3 = Quarterly
  isActive: boolean;
  tariffPlanCount: number;
  connectionCount: number;
}

export interface CreateUtilityTypeRequest {
  name: string;
  description?: string;
  unitOfMeasurement: string;
  billingCycleMonths?: number;
}

export interface UpdateUtilityTypeRequest {
  name?: string;
  description?: string;
  unitOfMeasurement?: string;
  billingCycleMonths?: number;
  isActive?: boolean;
}
