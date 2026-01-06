// Auth DTOs - matching backend exactly

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  phoneNumber?: string;
  role: string;
}

export interface ConsumerRegisterRequest {
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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  consumerNumber?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
}

export type UserRole = 'Admin' | 'BillingOfficer' | 'AccountOfficer' | 'Consumer';
