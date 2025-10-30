/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Authentication Types
export interface User {
  id: string;
  email: string;
  companyName: string;
  position: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  companyName: string;
  position: string;
  phoneNumber: string;
  bio?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message?: string;
}

export interface ProfileUpdateRequest {
  companyName?: string;
  position?: string;
  phoneNumber?: string;
  bio?: string;
  profilePictureUrl?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}
