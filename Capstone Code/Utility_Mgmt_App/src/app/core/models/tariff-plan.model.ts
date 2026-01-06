// Tariff Plan DTOs

export interface TariffPlan {
  id: number;
  name: string;
  description?: string;
  utilityTypeId: number;
  utilityTypeName: string;
  ratePerUnit: number;
  fixedCharges: number;
  taxPercentage: number;
  latePaymentPenalty: number;
  slabMinUnits?: number;
  slabMaxUnits?: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  connectionCount: number;
}

export interface CreateTariffPlanRequest {
  name: string;
  description?: string;
  utilityTypeId: number;
  ratePerUnit: number;
  fixedCharges?: number;
  taxPercentage?: number;
  latePaymentPenalty?: number;
  slabMinUnits?: number;
  slabMaxUnits?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateTariffPlanRequest {
  name?: string;
  description?: string;
  ratePerUnit?: number;
  fixedCharges?: number;
  taxPercentage?: number;
  latePaymentPenalty?: number;
  slabMinUnits?: number;
  slabMaxUnits?: number;
  isActive?: boolean;
  effectiveTo?: string;
}

export interface TariffPlanListItem {
  id: number;
  name: string;
  utilityTypeName: string;
  ratePerUnit: number;
  fixedCharges: number;
  isActive: boolean;
}
